import type { PathNode, PlanContract } from "../contracts.js";
import type { EditableLayoutPlanPathBridgeContract } from "./editableLayoutPlanPathBridgeContract.js";
import { validateEditableLayoutPlanPathBridgeContract } from "./editableLayoutPlanPathBridgeContract.js";
import type { EditableLayoutGeometryContract } from "./editableLayoutGeometryContract.js";
import {
  ROOM_MOVE_PATH_NODE_GEOMETRY_SYNC_LIMITATIONS,
  type RoomMovePathSyncDeltaFeet
} from "./roomMovePathSyncContract.js";
import { syncDoorPathNodeGeometry, type DoorPathNodeGeometrySyncResult } from "./syncDoorPathNodeGeometry.js";

export const ROOM_MOVE_PATH_NODE_GEOMETRY_SYNC_STATUSES = [
  "synced",
  "not_required",
  "skipped_missing_room_path_node",
  "skipped_missing_room_geometry"
] as const;

export type RoomMovePathNodeGeometrySyncStatus =
  (typeof ROOM_MOVE_PATH_NODE_GEOMETRY_SYNC_STATUSES)[number];

export type RoomMovePathNodeGeometrySyncEntry = {
  movedRoomId: string;
  linkedPathNodeIds: string[];
  roomDeltaFeet: RoomMovePathSyncDeltaFeet;
  syncStatus: RoomMovePathNodeGeometrySyncStatus;
  limitations: string[];
};

export type RoomMovePathNodeGeometrySyncResult = {
  editableLayoutId: string;
  planId: string;
  movedRoomId: string;
  roomDeltaFeet: RoomMovePathSyncDeltaFeet;
  updatedPlan: PlanContract;
  roomPathNodeResult: RoomMovePathNodeGeometrySyncEntry;
  doorPathNodeResult: DoorPathNodeGeometrySyncResult;
  syncedPathNodeIds: string[];
  skippedPathNodeIds: string[];
  pathEdgesMutated: false;
  walkingDistanceRecalculated: false;
  limitations: string[];
};

export type SyncRoomMovePathNodeGeometryInput = {
  editableLayout: EditableLayoutGeometryContract;
  plan: PlanContract;
  bridge: EditableLayoutPlanPathBridgeContract;
  movedRoomId: string;
  roomDeltaFeet: RoomMovePathSyncDeltaFeet;
};

export function syncRoomMovePathNodeGeometry(
  input: SyncRoomMovePathNodeGeometryInput
): RoomMovePathNodeGeometrySyncResult {
  const bridge = validateEditableLayoutPlanPathBridgeContract(input.bridge);
  if (bridge.editableLayoutId !== input.editableLayout.layoutId) {
    throw new Error("bridge editableLayoutId must match editable layout");
  }
  if (bridge.planId !== input.plan.planId) {
    throw new Error("bridge planId must match plan");
  }

  const delta = normalizeDelta(input.roomDeltaFeet);
  const movedRoom = input.editableLayout.rooms.find((room) => room.id === input.movedRoomId) ?? null;
  const roomMapping = bridge.roomMappings.find((mapping) => mapping.editableObjectId === input.movedRoomId);
  const linkedRoomPathNodeIds = [...(roomMapping?.pathNodeIds ?? [])].sort((left, right) =>
    left.localeCompare(right)
  );
  const affectedDoorIds = input.editableLayout.doors
    .filter((door) => door.ownerKind === "room" && door.ownerId === input.movedRoomId)
    .map((door) => door.id)
    .sort((left, right) => left.localeCompare(right));

  if (delta.deltaXFeet === 0 && delta.deltaYFeet === 0) {
    const copiedPlan = copyPlan(input.plan);
    const doorPathNodeResult = syncDoorPathNodeGeometry({
      editableLayout: input.editableLayout,
      plan: copiedPlan,
      bridge,
      doorIds: []
    });
    return createResult({
      input,
      delta,
      updatedPlan: copiedPlan,
      roomPathNodeResult: createRoomResult({
        movedRoomId: input.movedRoomId,
        linkedPathNodeIds: linkedRoomPathNodeIds,
        delta,
        syncStatus: "not_required"
      }),
      doorPathNodeResult,
      syncedRoomPathNodeIds: [],
      skippedPathNodeIds: []
    });
  }

  if (movedRoom == null) {
    const copiedPlan = copyPlan(input.plan);
    const doorPathNodeResult = syncDoorPathNodeGeometry({
      editableLayout: input.editableLayout,
      plan: copiedPlan,
      bridge,
      doorIds: []
    });
    return createResult({
      input,
      delta,
      updatedPlan: copiedPlan,
      roomPathNodeResult: createRoomResult({
        movedRoomId: input.movedRoomId,
        linkedPathNodeIds: linkedRoomPathNodeIds,
        delta,
        syncStatus: "skipped_missing_room_geometry"
      }),
      doorPathNodeResult,
      syncedRoomPathNodeIds: [],
      skippedPathNodeIds: linkedRoomPathNodeIds
    });
  }

  const pathNodesById = new Map(input.plan.pathNodes.map((node) => [node.id, node]));
  const missingRoomPathNode = linkedRoomPathNodeIds.length === 0 ||
    linkedRoomPathNodeIds.some((pathNodeId) => !pathNodesById.has(pathNodeId));
  const roomPathNodeUpdates = missingRoomPathNode
    ? new Map<string, RoomMovePathSyncDeltaFeet>()
    : new Map(linkedRoomPathNodeIds.map((pathNodeId) => [pathNodeId, delta]));
  const planWithRoomNodes = {
    ...copyPlan(input.plan),
    pathNodes: input.plan.pathNodes.map((node) => updateRoomPathNode(node, roomPathNodeUpdates))
  };
  const doorPathNodeResult = syncDoorPathNodeGeometry({
    editableLayout: input.editableLayout,
    plan: planWithRoomNodes,
    bridge,
    doorIds: affectedDoorIds
  });

  return createResult({
    input,
    delta,
    updatedPlan: doorPathNodeResult.updatedPlan,
    roomPathNodeResult: createRoomResult({
      movedRoomId: input.movedRoomId,
      linkedPathNodeIds: linkedRoomPathNodeIds,
      delta,
      syncStatus: missingRoomPathNode ? "skipped_missing_room_path_node" : "synced"
    }),
    doorPathNodeResult,
    syncedRoomPathNodeIds: missingRoomPathNode ? [] : linkedRoomPathNodeIds,
    skippedPathNodeIds: missingRoomPathNode ? linkedRoomPathNodeIds : []
  });
}

function createResult(input: {
  input: SyncRoomMovePathNodeGeometryInput;
  delta: RoomMovePathSyncDeltaFeet;
  updatedPlan: PlanContract;
  roomPathNodeResult: RoomMovePathNodeGeometrySyncEntry;
  doorPathNodeResult: DoorPathNodeGeometrySyncResult;
  syncedRoomPathNodeIds: string[];
  skippedPathNodeIds: string[];
}): RoomMovePathNodeGeometrySyncResult {
  const syncedPathNodeIds = uniqueSorted([
    ...input.syncedRoomPathNodeIds,
    ...input.doorPathNodeResult.syncedPathNodeIds
  ]);
  return {
    editableLayoutId: input.input.editableLayout.layoutId,
    planId: input.input.plan.planId,
    movedRoomId: input.input.movedRoomId,
    roomDeltaFeet: input.delta,
    updatedPlan: input.updatedPlan,
    roomPathNodeResult: input.roomPathNodeResult,
    doorPathNodeResult: input.doorPathNodeResult,
    syncedPathNodeIds,
    skippedPathNodeIds: uniqueSorted(input.skippedPathNodeIds),
    pathEdgesMutated: false,
    walkingDistanceRecalculated: false,
    limitations: [...ROOM_MOVE_PATH_NODE_GEOMETRY_SYNC_LIMITATIONS]
  };
}

function createRoomResult(input: {
  movedRoomId: string;
  linkedPathNodeIds: string[];
  delta: RoomMovePathSyncDeltaFeet;
  syncStatus: RoomMovePathNodeGeometrySyncStatus;
}): RoomMovePathNodeGeometrySyncEntry {
  return {
    movedRoomId: input.movedRoomId,
    linkedPathNodeIds: input.linkedPathNodeIds,
    roomDeltaFeet: input.delta,
    syncStatus: input.syncStatus,
    limitations: [...ROOM_MOVE_PATH_NODE_GEOMETRY_SYNC_LIMITATIONS]
  };
}

function updateRoomPathNode(
  node: PathNode,
  updates: ReadonlyMap<string, RoomMovePathSyncDeltaFeet>
): PathNode {
  const delta = updates.get(node.id);
  if (delta == null) {
    return { ...node };
  }
  return {
    ...node,
    x: roundFeet(node.x + delta.deltaXFeet),
    y: roundFeet(node.y + delta.deltaYFeet)
  };
}

function copyPlan(plan: PlanContract): PlanContract {
  return {
    ...plan,
    rooms: plan.rooms.map((room) => ({ ...room })),
    hallways: plan.hallways.map((hallway) => ({
      ...hallway,
      points: hallway.points.map((point) => ({ ...point }))
    })),
    doors: plan.doors.map((door) => ({ ...door })),
    nurseStations: plan.nurseStations.map((station) => ({ ...station })),
    zones: plan.zones.map((zone) => ({ ...zone })),
    pathNodes: plan.pathNodes.map((node) => ({ ...node })),
    pathEdges: plan.pathEdges.map((edge) => ({ ...edge }))
  };
}

function normalizeDelta(delta: RoomMovePathSyncDeltaFeet): RoomMovePathSyncDeltaFeet {
  return {
    deltaXFeet: normalizeSignedZero(roundFeet(requireFiniteNumber(delta.deltaXFeet, "deltaXFeet"))),
    deltaYFeet: normalizeSignedZero(roundFeet(requireFiniteNumber(delta.deltaYFeet, "deltaYFeet")))
  };
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}
