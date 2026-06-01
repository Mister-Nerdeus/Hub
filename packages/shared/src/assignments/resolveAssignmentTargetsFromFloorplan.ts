import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import { deriveRouteGraphFromGeometry } from "../floorplans/deriveRouteGraphFromGeometry.js";
import { routeNodeIdFor } from "../floorplans/routeNodeContract.js";
import type { RouteGraphContract } from "../floorplans/routeGraphContract.js";
import {
  assignmentTargetIdFor,
  validateAssignmentTargetList,
  type AssignmentTargetContract,
  type AssignmentTargetKind
} from "./assignmentTargetContract.js";

const ASSIGNABLE_SUPPORT_ZONE_TYPES = ["provider_pharmacy"] as const;

export function resolveAssignmentTargetsFromFloorplan(
  layoutValue: EditableLayoutGeometryContract,
  input: { routeGraph?: RouteGraphContract | null } = {}
): AssignmentTargetContract[] {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  const routeGraph = input.routeGraph ?? deriveRouteGraphFromGeometry(layout);
  const routeNodeIds = new Set(routeGraph.nodes.map((node) => node.routeNodeId));
  const splitParentRoomIds = new Set((layout.splitRooms ?? []).map((splitRoom) => splitRoom.parentRoomId));
  const targets: AssignmentTargetContract[] = [];

  for (const room of layout.rooms) {
    if (room.roomType === "solid_wall" || room.roomType === "storage" || room.roomType === "provider_pharmacy") {
      continue;
    }
    if (splitParentRoomIds.has(room.id)) {
      continue;
    }
    targets.push(buildTarget(layout.layoutId, room.isHallBed ? "hall_bed" : "room", room.id, room.label, routeNodeIds));
  }

  for (const splitRoom of layout.splitRooms ?? []) {
    for (const bedPosition of splitRoom.bedPositions) {
      targets.push(
        buildTarget(layout.layoutId, "bed_position", bedPosition.bedPositionId, bedPosition.label, routeNodeIds)
      );
    }
  }

  for (const zone of layout.zones) {
    if (
      zone.assignmentTarget === true &&
      ASSIGNABLE_SUPPORT_ZONE_TYPES.includes(zone.zoneType as (typeof ASSIGNABLE_SUPPORT_ZONE_TYPES)[number])
    ) {
      targets.push(buildTarget(layout.layoutId, "zone", zone.id, zone.label, routeNodeIds));
    }
  }

  for (const station of layout.stations) {
    if (station.assignmentTarget === true) {
      targets.push(buildTarget(layout.layoutId, "support_area", station.id, station.label, routeNodeIds));
    }
  }

  return validateAssignmentTargetList(targets);
}

export function roomTargetSourceIds(layoutValue: EditableLayoutGeometryContract): string[] {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  const splitParentRoomIds = new Set((layout.splitRooms ?? []).map((splitRoom) => splitRoom.parentRoomId));
  return layout.rooms
    .filter((room) => isPatientCareRoomTarget(room, splitParentRoomIds))
    .map((room) => room.id)
    .sort();
}

function isPatientCareRoomTarget(room: EditableRoomGeometry, splitParentRoomIds: ReadonlySet<string>): boolean {
  return !splitParentRoomIds.has(room.id) &&
    room.roomType !== "solid_wall" &&
    room.roomType !== "storage" &&
    room.roomType !== "provider_pharmacy";
}

function buildTarget(
  floorplanId: string,
  targetKind: AssignmentTargetKind,
  sourceId: string,
  displayLabel: string,
  routeNodeIds: ReadonlySet<string>
): AssignmentTargetContract {
  const routeSourceKind = targetKind === "bed_position" ? "bed_position" :
    targetKind === "zone" ? "zone" :
      targetKind === "support_area" ? null : "room";
  const routeNodeId = routeSourceKind == null ? null : routeNodeIdFor(routeSourceKind, sourceId);
  return {
    assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind, sourceId }),
    targetKind,
    sourceId,
    displayLabel,
    floorplanId,
    ...(routeNodeId != null && routeNodeIds.has(routeNodeId) ? { routeNodeId } : {}),
    active: true
  };
}
