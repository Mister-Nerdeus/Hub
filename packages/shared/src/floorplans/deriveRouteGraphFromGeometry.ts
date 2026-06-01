import {
  validateEditableLayoutGeometryContract,
  type EditableDoorGeometry,
  type EditableLayoutGeometryContract,
  type EditableSupportAccessPointGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import type { DoorDestinationContract } from "./doorDestinationContract.js";
import {
  routeEdgeIdFor,
  type RouteEdgeContract,
  type RouteEdgeSourceKind
} from "./routeEdgeContract.js";
import {
  validateRouteGraphContract,
  type RouteGraphContract,
  type RouteGraphWarningContract
} from "./routeGraphContract.js";
import {
  routeNodeIdFor,
  type RouteNodeContract,
  type RouteNodeSourceKind
} from "./routeNodeContract.js";

type Rect = {
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
};

type BlockedWallAnchor = {
  sourceObjectId: string;
  sourceAnchorFeet: {
    xFeet: number;
    yFeet: number;
  };
};

const DOOR_THICKNESS_FEET = 0.5;

export function deriveRouteGraphFromGeometry(layoutValue: EditableLayoutGeometryContract): RouteGraphContract {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  const nodes: RouteNodeContract[] = [];
  const edges: RouteEdgeContract[] = [];
  const warnings: RouteGraphWarningContract[] = [];

  const addNode = (
    sourceKind: RouteNodeSourceKind,
    sourceId: string,
    label: string,
    rect: Rect,
    traversable = true
  ) => {
    nodes.push({
      routeNodeId: routeNodeIdFor(sourceKind, sourceId),
      sourceKind,
      sourceId,
      label,
      xFeet: centerX(rect),
      yFeet: centerY(rect),
      traversable
    });
  };

  for (const hallway of layout.hallways) {
    addNode("hallway", hallway.id, hallway.label, hallway);
  }
  for (const room of layout.rooms) {
    addNode("room", room.id, room.label, room, room.roomType !== "solid_wall");
  }
  for (const zone of layout.zones) {
    addNode("zone", zone.id, zone.label, zone);
  }
  for (const entryExit of layout.entryExits ?? []) {
    addNode("entry_exit", entryExit.entryExitId, entryExit.label, entryExit);
  }
  for (const door of layout.doors) {
    const rect = rectForDoor(door, layout);
    if (rect != null) {
      addNode("door", door.id, door.label, rect);
    }
  }
  for (const supportAccess of layout.supportAccessPoints ?? []) {
    const rect = rectForSupportAccess(supportAccess, layout);
    if (rect != null) {
      addNode("support_access", supportAccess.id, supportAccess.label, rect);
    }
  }
  for (const splitRoom of layout.splitRooms ?? []) {
    const parent = layout.rooms.find((room) => room.id === splitRoom.parentRoomId);
    if (parent == null) continue;
    for (const bedPosition of splitRoom.bedPositions) {
      addNode("bed_position", bedPosition.bedPositionId, bedPosition.label, {
        xFeet: parent.xFeet + parent.widthFeet * bedPosition.relativeBounds.xRatio,
        yFeet: parent.yFeet + parent.heightFeet * bedPosition.relativeBounds.yRatio,
        widthFeet: parent.widthFeet * bedPosition.relativeBounds.widthRatio,
        heightFeet: parent.heightFeet * bedPosition.relativeBounds.heightRatio
      });
      addEdge("manual_connection", routeNodeIdFor("room", parent.id), routeNodeIdFor("bed_position", bedPosition.bedPositionId), `${parent.label} to ${bedPosition.label}`, false);
    }
  }

  for (const door of layout.doors) {
    addOwnerDoorEdge(door);
  }
  for (const supportAccess of layout.supportAccessPoints ?? []) {
    addOwnerDoorEdge(supportAccess);
  }
  for (const destination of layout.doorDestinations ?? []) {
    addDestinationEdge(destination);
  }
  for (const entryExit of layout.entryExits ?? []) {
    if (entryExit.connectsTo.displayLabel.trim().length === 0) {
      warnings.push({
        code: "route_entry_exit_missing_destination",
        severity: "error",
        sourceObjectType: "entry_exit",
        sourceObjectId: entryExit.entryExitId,
        message: "Entry or exit route destination is missing."
      });
      continue;
    }
    const targetNodeId = nodeIdForEntryExitDestination(entryExit.connectsTo.destinationKind, entryExit.connectsTo.destinationId);
    if (targetNodeId != null && hasNode(targetNodeId)) {
      addEdge("entry_exit", routeNodeIdFor("entry_exit", entryExit.entryExitId), targetNodeId, `${entryExit.label} connects to ${entryExit.connectsTo.displayLabel}`, false);
    }
  }
  for (const left of layout.hallways) {
    for (const right of layout.hallways) {
      if (left.id >= right.id) continue;
      if (rectsTouchOrOverlap(left, right)) {
        addEdge("hallway_overlap", routeNodeIdFor("hallway", left.id), routeNodeIdFor("hallway", right.id), `${left.label} connects to ${right.label}`, false);
      }
    }
  }

  for (const doorLike of [...layout.doors, ...(layout.supportAccessPoints ?? [])]) {
    if (!(layout.doorDestinations ?? []).some((destination) => destination.doorId === doorLike.id)) {
      warnings.push({
        code: "route_missing_destination",
        severity: "warning",
        sourceObjectType: doorLike.objectType === "support_access" ? "support_access" : "door",
        sourceObjectId: doorLike.id,
        message: "Door route destination is missing; connectivity stays explicit."
      });
    }
  }

  const graph = validateRouteGraphContract({
    schemaVersion: "1.0.0",
    routeGraphId: `route-graph:${layout.layoutId}`,
    routeGraphScope: "connectivity_only",
    derivedFromLayoutId: layout.layoutId,
    nodes: nodes.sort((left, right) => left.routeNodeId.localeCompare(right.routeNodeId)),
    edges: uniqueEdges(edges).sort((left, right) => left.routeEdgeId.localeCompare(right.routeEdgeId)),
    warnings: warnings.sort((left, right) =>
      left.code.localeCompare(right.code) ||
      left.sourceObjectType.localeCompare(right.sourceObjectType) ||
      left.sourceObjectId.localeCompare(right.sourceObjectId)
    )
  });

  return graph;

  function addOwnerDoorEdge(doorLike: EditableDoorGeometry | EditableSupportAccessPointGeometry): void {
    const sourceKind = doorLike.objectType === "support_access" ? "support_access" : "door";
    const ownerKind = doorLike.ownerKind === "zone" ? "zone" : doorLike.ownerKind;
    addEdge(
      "manual_connection",
      routeNodeIdFor(ownerKind, doorLike.ownerId),
      routeNodeIdFor(sourceKind, doorLike.id),
      `${ownerKind} connects to ${doorLike.label}`,
      false
    );
  }

  function addDestinationEdge(destination: DoorDestinationContract): void {
    const sourceKind = destination.ownerKind === "zone" ? "support_access" : "door";
    const fromNodeId = routeNodeIdFor(sourceKind, destination.doorId);
    if (destination.leadsToKind === "unknown") {
      warnings.push({
        code: "route_unknown_destination",
        severity: "warning",
        sourceObjectType: sourceKind,
        sourceObjectId: destination.doorId,
        message: "Door route destination is unknown; no traversable connectivity is inferred."
      });
      return;
    }
    const toNodeId = nodeIdForDoorDestination(destination);
    if (toNodeId == null || !hasNode(toNodeId)) {
      warnings.push({
        code: "route_deleted_destination",
        severity: "error",
        sourceObjectType: sourceKind,
        sourceObjectId: destination.doorId,
        message: "Door route destination points to unavailable floorplan geometry."
      });
      return;
    }
    const blockedWallAnchor = doorBlockedByPerimeter(destination.doorId, sourceKind);
    const blockedByWall = blockedWallAnchor != null;
    if (blockedWallAnchor != null) {
      warnings.push({
        code: "route_blocked_by_wall",
        severity: "warning",
        sourceObjectType: "perimeter_wall",
        sourceObjectId: blockedWallAnchor.sourceObjectId,
        sourceAnchorFeet: blockedWallAnchor.sourceAnchorFeet,
        message: "Door route is blocked by wall geometry."
      });
    }
    addEdge("door_destination", fromNodeId, toNodeId, `${destination.doorId} leads to ${destination.leadsToLabel}`, blockedByWall);
  }

  function addEdge(
    sourceKind: RouteEdgeSourceKind,
    fromNodeId: string,
    toNodeId: string,
    label: string,
    blockedByWall: boolean
  ): void {
    if (!hasNode(fromNodeId) || !hasNode(toNodeId) || fromNodeId === toNodeId) {
      return;
    }
    edges.push({
      routeEdgeId: routeEdgeIdFor(sourceKind, fromNodeId, toNodeId),
      fromNodeId,
      toNodeId,
      direction: "undirected",
      sourceKind,
      traversable: !blockedByWall,
      blockedByWall,
      label
    });
  }

  function hasNode(routeNodeId: string): boolean {
    return nodes.some((node) => node.routeNodeId === routeNodeId);
  }

  function doorBlockedByPerimeter(doorId: string, sourceKind: "door" | "support_access"): BlockedWallAnchor | null {
    const doorLike = sourceKind === "support_access"
      ? layout.supportAccessPoints?.find((accessPoint) => accessPoint.id === doorId)
      : layout.doors.find((door) => door.id === doorId);
    const rect = doorLike?.objectType === "support_access"
      ? rectForSupportAccess(doorLike, layout)
      : doorLike == null ? null : rectForDoor(doorLike, layout);
    if (rect == null) return null;
    for (const wall of layout.perimeterWalls ?? []) {
      for (const segment of wall.segments) {
        if (segment.blocksTravel && rectsOverlap(rect, segment)) {
          return {
            sourceObjectId: segment.segmentId,
            sourceAnchorFeet: overlapCenter(rect, segment)
          };
        }
      }
    }
    return null;
  }
}

function nodeIdForDoorDestination(destination: DoorDestinationContract): string | null {
  switch (destination.leadsToKind) {
    case "hallway":
      return destination.leadsToId == null ? null : routeNodeIdFor("hallway", destination.leadsToId);
    case "room":
      return destination.leadsToId == null ? null : routeNodeIdFor("room", destination.leadsToId);
    case "zone":
      return destination.leadsToId == null ? null : routeNodeIdFor("zone", destination.leadsToId);
    case "entry_exit":
      return destination.leadsToId == null ? null : routeNodeIdFor("entry_exit", destination.leadsToId);
    case "external":
    case "unknown":
      return null;
  }
}

function nodeIdForEntryExitDestination(destinationKind: string, destinationId?: string): string | null {
  if (destinationKind === "hallway" && destinationId != null) return routeNodeIdFor("hallway", destinationId);
  if (destinationKind === "provider_pharmacy" && destinationId != null) return routeNodeIdFor("zone", destinationId);
  return null;
}

function rectForDoor(door: EditableDoorGeometry, layout: EditableLayoutGeometryContract): Rect | null {
  const owner = door.ownerKind === "room"
    ? layout.rooms.find((room) => room.id === door.ownerId)
    : layout.hallways.find((hallway) => hallway.id === door.ownerId);
  return owner == null ? null : rectForDoorOnOwner(door, owner);
}

function rectForSupportAccess(
  accessPoint: EditableSupportAccessPointGeometry,
  layout: EditableLayoutGeometryContract
): Rect | null {
  const owner = layout.zones.find((zone) => zone.id === accessPoint.ownerId);
  return owner == null ? null : rectForDoorOnOwner(accessPoint, owner);
}

function rectForDoorOnOwner(
  door: Pick<EditableDoorGeometry, "wall" | "offsetFeet" | "widthFeet">,
  owner: Rect
): Rect {
  switch (door.wall) {
    case "north":
      return {
        xFeet: owner.xFeet + door.offsetFeet,
        yFeet: owner.yFeet - DOOR_THICKNESS_FEET / 2,
        widthFeet: door.widthFeet,
        heightFeet: DOOR_THICKNESS_FEET
      };
    case "south":
      return {
        xFeet: owner.xFeet + door.offsetFeet,
        yFeet: owner.yFeet + owner.heightFeet - DOOR_THICKNESS_FEET / 2,
        widthFeet: door.widthFeet,
        heightFeet: DOOR_THICKNESS_FEET
      };
    case "east":
      return {
        xFeet: owner.xFeet + owner.widthFeet - DOOR_THICKNESS_FEET / 2,
        yFeet: owner.yFeet + door.offsetFeet,
        widthFeet: DOOR_THICKNESS_FEET,
        heightFeet: door.widthFeet
      };
    case "west":
      return {
        xFeet: owner.xFeet - DOOR_THICKNESS_FEET / 2,
        yFeet: owner.yFeet + door.offsetFeet,
        widthFeet: DOOR_THICKNESS_FEET,
        heightFeet: door.widthFeet
      };
  }
}

function centerX(rect: Rect): number {
  return rect.xFeet + rect.widthFeet / 2;
}

function centerY(rect: Rect): number {
  return rect.yFeet + rect.heightFeet / 2;
}

function rectsOverlap(left: Rect, right: Rect): boolean {
  return left.xFeet < right.xFeet + right.widthFeet &&
    left.xFeet + left.widthFeet > right.xFeet &&
    left.yFeet < right.yFeet + right.heightFeet &&
    left.yFeet + left.heightFeet > right.yFeet;
}

function rectsTouchOrOverlap(left: Rect, right: Rect): boolean {
  return left.xFeet <= right.xFeet + right.widthFeet &&
    left.xFeet + left.widthFeet >= right.xFeet &&
    left.yFeet <= right.yFeet + right.heightFeet &&
    left.yFeet + left.heightFeet >= right.yFeet;
}

function overlapCenter(left: Rect, right: Rect): { xFeet: number; yFeet: number } {
  const x1 = Math.max(left.xFeet, right.xFeet);
  const y1 = Math.max(left.yFeet, right.yFeet);
  const x2 = Math.min(left.xFeet + left.widthFeet, right.xFeet + right.widthFeet);
  const y2 = Math.min(left.yFeet + left.heightFeet, right.yFeet + right.heightFeet);
  return {
    xFeet: (x1 + x2) / 2,
    yFeet: (y1 + y2) / 2
  };
}

function uniqueEdges(edges: RouteEdgeContract[]): RouteEdgeContract[] {
  return [...new Map(edges.map((edge) => [edge.routeEdgeId, edge])).values()];
}
