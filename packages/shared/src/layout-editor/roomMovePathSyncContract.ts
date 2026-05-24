import type { PathEdge, PlanContract } from "../contracts.js";

export const ROOM_MOVE_PATH_SYNC_STATUSES = [
  "pending",
  "not_required",
  "blocked_by_missing_path_reference",
  "ready_for_sync"
] as const;

export type RoomMovePathSyncStatus = (typeof ROOM_MOVE_PATH_SYNC_STATUSES)[number];

export type RoomMovePathSyncDeltaFeet = {
  deltaXFeet: number;
  deltaYFeet: number;
};

export type RoomMovePathSyncContract = {
  movedRoomId: string;
  roomDeltaFeet: RoomMovePathSyncDeltaFeet;
  affectedDoorIds: string[];
  affectedPathNodeIds: string[];
  affectedPathEdgeIds: string[];
  syncStatus: RoomMovePathSyncStatus;
  limitations: string[];
};

export type BuildRoomMovePathSyncContractInput = {
  plan: PlanContract;
  movedRoomId: string;
  roomDeltaFeet: RoomMovePathSyncDeltaFeet;
};

export const DEFAULT_ROOM_MOVE_PATH_SYNC_LIMITATIONS = [
  "Contract only; no path geometry changes are applied.",
  "Simulation rerun and pathfinding changes are not performed."
] as const;

export const ROOM_MOVE_PATH_NODE_GEOMETRY_SYNC_LIMITATIONS = [
  "Room move path node sync updates copied linked room nodes by room delta and room-owned door nodes by derived door centers only.",
  "Path edges, pathfinding changes, walking metric recalculation, and simulation rerun are not performed."
] as const;

export function buildRoomMovePathSyncContract({
  plan,
  movedRoomId,
  roomDeltaFeet
}: BuildRoomMovePathSyncContractInput): RoomMovePathSyncContract {
  const room = plan.rooms.find((candidate) => candidate.id === movedRoomId);
  if (room == null) {
    throw new Error(`unknown room: ${movedRoomId}`);
  }

  const affectedDoors = plan.doors
    .filter((door) => door.roomId === movedRoomId)
    .sort((left, right) => left.id.localeCompare(right.id));
  const affectedDoorIds = affectedDoors.map((door) => door.id);
  const affectedPathNodeIds = uniqueSorted([
    ...optionalId(room.pathNodeId),
    ...affectedDoors.flatMap((door) => optionalId(door.pathNodeId)),
    ...plan.pathNodes
      .filter((node) =>
        node.linkedObjectId === movedRoomId || affectedDoorIds.includes(node.linkedObjectId ?? "")
      )
      .map((node) => node.id)
  ]);
  const affectedPathEdgeIds = affectedEdgesForNodes(plan.pathEdges, affectedPathNodeIds).map((edge) => edge.id);
  const normalizedDelta = normalizeDelta(roomDeltaFeet);

  return validateRoomMovePathSyncContract({
    movedRoomId,
    roomDeltaFeet: normalizedDelta,
    affectedDoorIds,
    affectedPathNodeIds,
    affectedPathEdgeIds,
    syncStatus: inferSyncStatus({
      delta: normalizedDelta,
      affectedDoorPathNodeIds: affectedDoors.map((door) => door.pathNodeId ?? null),
      affectedPathNodeIds
    }),
    limitations: [...DEFAULT_ROOM_MOVE_PATH_SYNC_LIMITATIONS]
  });
}

export function validateRoomMovePathSyncContract(value: unknown): RoomMovePathSyncContract {
  const contract = requireRecord(value, "roomMovePathSyncContract");
  requireExactKeys(contract, "roomMovePathSyncContract", [
    "movedRoomId",
    "roomDeltaFeet",
    "affectedDoorIds",
    "affectedPathNodeIds",
    "affectedPathEdgeIds",
    "syncStatus",
    "limitations"
  ]);

  const validated = {
    movedRoomId: requireString(contract.movedRoomId, "movedRoomId"),
    roomDeltaFeet: validateDelta(contract.roomDeltaFeet),
    affectedDoorIds: validateStringList(contract.affectedDoorIds, "affectedDoorIds"),
    affectedPathNodeIds: validateStringList(contract.affectedPathNodeIds, "affectedPathNodeIds"),
    affectedPathEdgeIds: validateStringList(contract.affectedPathEdgeIds, "affectedPathEdgeIds"),
    syncStatus: requireEnum(contract.syncStatus, ROOM_MOVE_PATH_SYNC_STATUSES, "syncStatus"),
    limitations: validateStringList(contract.limitations, "limitations")
  };

  if (validated.limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  return validated;
}

function inferSyncStatus({
  delta,
  affectedDoorPathNodeIds,
  affectedPathNodeIds
}: {
  delta: RoomMovePathSyncDeltaFeet;
  affectedDoorPathNodeIds: Array<string | null>;
  affectedPathNodeIds: string[];
}): RoomMovePathSyncStatus {
  if (delta.deltaXFeet === 0 && delta.deltaYFeet === 0) {
    return "not_required";
  }
  if (
    affectedDoorPathNodeIds.some((pathNodeId) => pathNodeId == null) ||
    affectedPathNodeIds.length === 0
  ) {
    return "blocked_by_missing_path_reference";
  }
  return "ready_for_sync";
}

function affectedEdgesForNodes(pathEdges: PathEdge[], pathNodeIds: string[]): PathEdge[] {
  const nodeIds = new Set(pathNodeIds);
  return pathEdges
    .filter((edge) => nodeIds.has(edge.fromNodeId) || nodeIds.has(edge.toNodeId))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function validateDelta(value: unknown): RoomMovePathSyncDeltaFeet {
  const delta = requireRecord(value, "roomDeltaFeet");
  requireExactKeys(delta, "roomDeltaFeet", ["deltaXFeet", "deltaYFeet"]);
  return normalizeDelta({
    deltaXFeet: requireFiniteNumber(delta.deltaXFeet, "roomDeltaFeet.deltaXFeet"),
    deltaYFeet: requireFiniteNumber(delta.deltaYFeet, "roomDeltaFeet.deltaYFeet")
  });
}

function normalizeDelta(delta: RoomMovePathSyncDeltaFeet): RoomMovePathSyncDeltaFeet {
  return {
    deltaXFeet: normalizeSignedZero(roundFeet(requireFiniteNumber(delta.deltaXFeet, "deltaXFeet"))),
    deltaYFeet: normalizeSignedZero(roundFeet(requireFiniteNumber(delta.deltaYFeet, "deltaYFeet")))
  };
}

function validateStringList(value: unknown, label: string): string[] {
  return requireArray(value, label).map((item, index) => requireString(item, `${label}[${index}]`));
}

function optionalId(value: string | null | undefined): string[] {
  return typeof value === "string" && value.length > 0 ? [value] : [];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
