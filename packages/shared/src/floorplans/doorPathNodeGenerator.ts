import { validatePlanContract, type PathEdge, type PathNode, type PlanContract } from "../contracts.js";
import {
  validateEditableLayoutGeometryContract,
  type EditableDoorGeometry,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import type { AuthoringWarningCode } from "./authoringWarningContract.js";
import { canCreateRoomDoorPathNode } from "./pathNodeRules.js";

export type GeneratedDoorPathNode = {
  pathNodeId: string;
  linkedDoorId: string;
  linkedRoomId: string;
  xFeet: number;
  yFeet: number;
  nodeType: "room_door";
  generated: true;
  generationMethod: "door_wall_projection" | "nearest_hallway_connection" | "manual_review_required";
  warningCodes: AuthoringWarningCode[];
};

export type DoorPathNodeGenerationResult = {
  plan: PlanContract;
  generatedNodes: GeneratedDoorPathNode[];
  generatedEdgeIds: string[];
  preservedExistingNodeIds: string[];
  warningCodes: AuthoringWarningCode[];
  pathSyncStatus: "fresh" | "stale_warning";
  limitations: string[];
};

export function generateDoorPathNodes(input: {
  sourcePlan: PlanContract;
  editableLayout: EditableLayoutGeometryContract;
  replaceGenerated?: boolean;
  maxHallwayConnectionDistanceFeet?: number;
}): DoorPathNodeGenerationResult {
  const sourcePlan = validatePlanContract(input.sourcePlan);
  const layout = validateEditableLayoutGeometryContract(input.editableLayout);
  const maxDistance = input.maxHallwayConnectionDistanceFeet ?? 40;
  const layoutRoomsById = new Map(layout.rooms.map((room) => [room.id, room]));
  const nonRoutableDoorIds = new Set(
    layout.doors
      .filter((door) => {
        const room = layoutRoomsById.get(door.ownerId);
        return room != null && !canCreateRoomDoorPathNode(room);
      })
      .map((door) => door.id)
  );
  const nonRoutableRoomIds = new Set(
    [...layoutRoomsById.values()]
      .filter((room) => !canCreateRoomDoorPathNode(room))
      .map((room) => room.id)
  );
  const generatedNodeIds = new Set(layout.doors.map((door) => nodeIdForDoor(door.id)));
  const generatedDoorIds = new Set(layout.doors.map((door) => door.id));
  const removedGeneratedNodeIds = new Set<string>();
  const preservedPathNodes = sourcePlan.pathNodes.filter((node) => {
    if (
      input.replaceGenerated === true &&
      (generatedNodeIds.has(node.id) ||
        (node.nodeType === "room_door" && (generatedDoorIds.has(node.linkedObjectId ?? "") || nonRoutableDoorIds.has(node.linkedObjectId ?? ""))))
    ) {
      removedGeneratedNodeIds.add(node.id);
      return false;
    }
    return true;
  });
  const preservedExistingNodeIds = preservedPathNodes.map((node) => node.id).sort();
  const nextNodes: PathNode[] = [...preservedPathNodes];
  const nextEdges: PathEdge[] = [...sourcePlan.pathEdges.filter((edge) => {
    return input.replaceGenerated !== true ||
      (!edge.id.startsWith("generated-edge-door-") &&
        !removedGeneratedNodeIds.has(edge.fromNodeId) &&
        !removedGeneratedNodeIds.has(edge.toNodeId));
  })];
  const generatedNodes: GeneratedDoorPathNode[] = [];
  const generatedEdgeIds: string[] = [];
  const warnings: AuthoringWarningCode[] = [];
  const hallwayNodes = sourcePlan.pathNodes.filter((node) => node.nodeType === "hallway");

  for (const door of layout.doors) {
    const room = layout.rooms.find((candidate) => candidate.id === door.ownerId);
    if (room == null) {
      continue;
    }
    if (!canCreateRoomDoorPathNode(room)) {
      continue;
    }
    const existing = nextNodes.find((node) => node.linkedObjectId === door.id || node.id === nodeIdForDoor(door.id));
    if (existing != null && input.replaceGenerated !== true) {
      continue;
    }
    const position = doorPositionFeet(door, room);
    const nearest = nearestHallwayNode(hallwayNodes, position);
    const warningCodes: AuthoringWarningCode[] = ["GENERATED_PATH_NODE_APPROXIMATE"];
    let generationMethod: GeneratedDoorPathNode["generationMethod"] = "door_wall_projection";
    const pathNodeId = nodeIdForDoor(door.id);
    nextNodes.push({
      id: pathNodeId,
      nodeType: "room_door",
      x: position.xFeet,
      y: position.yFeet,
      linkedObjectId: door.id,
      entryOperationalMetadata: null
    });
    if (nearest == null || nearest.distanceFeet > maxDistance) {
      warningCodes.push("NO_NEARBY_HALLWAY_NODE", "PATH_EDGE_GENERATION_SKIPPED", "MANUAL_PATH_REVIEW_REQUIRED");
      warnings.push("NO_NEARBY_HALLWAY_NODE", "PATH_EDGE_GENERATION_SKIPPED", "MANUAL_PATH_REVIEW_REQUIRED");
      generationMethod = "manual_review_required";
    } else {
      const edgeId = `generated-edge-door-${door.id}-to-${nearest.node.id}`;
      nextEdges.push({
        id: edgeId,
        fromNodeId: pathNodeId,
        toNodeId: nearest.node.id,
        lengthFeet: roundDistance(nearest.distanceFeet),
        hallwayWidthFeet: 6,
        congestionFactor: 1,
        doorPenaltySeconds: 5,
        turnPenaltySeconds: 0,
        blocked: false
      });
      generatedEdgeIds.push(edgeId);
      generationMethod = "nearest_hallway_connection";
    }
    generatedNodes.push({
      pathNodeId,
      linkedDoorId: door.id,
      linkedRoomId: room.id,
      xFeet: position.xFeet,
      yFeet: position.yFeet,
      nodeType: "room_door",
      generated: true,
      generationMethod,
      warningCodes
    });
    warnings.push(...warningCodes);
  }

  const generatedDoorNodeByDoorId = new Map(generatedNodes.map((node) => [node.linkedDoorId, node.pathNodeId]));
  const plan = validatePlanContract({
    ...sourcePlan,
    doors: sourcePlan.doors.map((door) => ({
      ...door,
      pathNodeId: nonRoutableDoorIds.has(door.id) ? null : generatedDoorNodeByDoorId.get(door.id) ?? door.pathNodeId ?? null
    })),
    rooms: sourcePlan.rooms.map((room) => {
      if (nonRoutableRoomIds.has(room.id)) {
        return { ...room, pathNodeId: null };
      }
      const door = sourcePlan.doors.find((candidate) => candidate.roomId === room.id);
      const nodeId = door == null ? room.pathNodeId ?? null : generatedDoorNodeByDoorId.get(door.id) ?? room.pathNodeId ?? null;
      return { ...room, pathNodeId: nodeId };
    }),
    pathNodes: sortNodes(nextNodes),
    pathEdges: sortEdges(nextEdges)
  });

  return {
    plan,
    generatedNodes,
    generatedEdgeIds,
    preservedExistingNodeIds,
    warningCodes: unique(warnings),
    pathSyncStatus: warnings.includes("MANUAL_PATH_REVIEW_REQUIRED") || !generatedNodesReachRouteGraph(nextNodes, nextEdges, generatedNodes)
      ? "stale_warning"
      : "fresh",
    limitations: [
      "Generated door path nodes use deterministic wall projection and nearest hallway connection.",
      "Generated route links are approximate and require manual review when warnings are present."
    ]
  };
}

function nodeIdForDoor(doorId: string): string {
  return `generated-path-node-${doorId}`;
}

function nearestHallwayNode(nodes: PathNode[], point: { xFeet: number; yFeet: number }) {
  return nodes
    .map((node) => ({
      node,
      distanceFeet: Math.abs(node.x - point.xFeet) + Math.abs(node.y - point.yFeet)
    }))
    .sort((left, right) => left.distanceFeet - right.distanceFeet || left.node.id.localeCompare(right.node.id))[0] ?? null;
}

function doorPositionFeet(
  door: EditableDoorGeometry,
  room: EditableRoomGeometry
): { xFeet: number; yFeet: number } {
  switch (door.wall) {
    case "north":
      return { xFeet: room.xFeet + door.offsetFeet + door.widthFeet / 2, yFeet: room.yFeet };
    case "south":
      return { xFeet: room.xFeet + door.offsetFeet + door.widthFeet / 2, yFeet: room.yFeet + room.heightFeet };
    case "east":
      return { xFeet: room.xFeet + room.widthFeet, yFeet: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
    case "west":
      return { xFeet: room.xFeet, yFeet: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
  }
}

function roundDistance(value: number): number {
  return Math.round(value * 100) / 100;
}

function sortNodes(nodes: PathNode[]): PathNode[] {
  return [...nodes].sort((left, right) => left.id.localeCompare(right.id));
}

function sortEdges(edges: PathEdge[]): PathEdge[] {
  return [...edges].sort((left, right) => left.id.localeCompare(right.id));
}

function generatedNodesReachRouteGraph(
  nodes: PathNode[],
  edges: PathEdge[],
  generatedNodes: GeneratedDoorPathNode[]
): boolean {
  const generatedNodeIds = new Set(generatedNodes.map((node) => node.pathNodeId));
  if (generatedNodeIds.size === 0) {
    return true;
  }
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    if (edge.blocked) {
      continue;
    }
    adjacency.get(edge.fromNodeId)?.add(edge.toNodeId);
    adjacency.get(edge.toNodeId)?.add(edge.fromNodeId);
  }
  const seedIds = nodes
    .filter((node) => node.nodeType === "station" || node.nodeType === "hallway")
    .map((node) => node.id);
  const reachable = new Set(seedIds);
  const queue = [...seedIds];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) {
      continue;
    }
    for (const next of adjacency.get(current) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }
  return [...generatedNodeIds].every((nodeId) => reachable.has(nodeId));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
