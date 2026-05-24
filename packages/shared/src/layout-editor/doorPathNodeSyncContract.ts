import type {
  EditableDoorGeometry,
  EditableDoorOwnerKind,
  EditableDoorWall,
  EditableLayoutGeometryContract,
  EditableRectFeet
} from "./editableLayoutGeometryContract.js";

export const DOOR_PATH_NODE_SYNC_STATUSES = [
  "pending",
  "ready_for_sync",
  "missing_linked_path_node",
  "owner_geometry_missing"
] as const;

export type DoorPathNodeSyncStatus = (typeof DOOR_PATH_NODE_SYNC_STATUSES)[number];

export type DoorCenterFeet = {
  xFeet: number;
  yFeet: number;
};

export type DoorPathNodeSyncContract = {
  doorId: string;
  ownerKind: EditableDoorOwnerKind;
  ownerId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
  derivedDoorCenterFeet: DoorCenterFeet;
  linkedPathNodeId: string | null;
  syncStatus: DoorPathNodeSyncStatus;
  limitations: string[];
};

export type BuildDoorPathNodeSyncContractInput = {
  layout: EditableLayoutGeometryContract;
  doorId: string;
  linkedPathNodeId?: string | null;
};

const DEFAULT_DOOR_PATH_NODE_SYNC_LIMITATIONS = [
  "Contract only; no path node geometry changes are applied.",
  "Simulation rerun and pathfinding changes are not performed."
] as const;

export function buildDoorPathNodeSyncContract({
  layout,
  doorId,
  linkedPathNodeId = null
}: BuildDoorPathNodeSyncContractInput): DoorPathNodeSyncContract {
  const door = layout.doors.find((candidate) => candidate.id === doorId);
  if (door == null) {
    throw new Error(`unknown door: ${doorId}`);
  }

  const owner = findDoorOwner(door, layout);
  const derivedDoorCenterFeet = owner == null
    ? { xFeet: 0, yFeet: 0 }
    : deriveDoorCenterFeet(door, owner);

  return validateDoorPathNodeSyncContract({
    doorId: door.id,
    ownerKind: door.ownerKind,
    ownerId: door.ownerId,
    wall: door.wall,
    offsetFeet: door.offsetFeet,
    derivedDoorCenterFeet,
    linkedPathNodeId,
    syncStatus: owner == null
      ? "owner_geometry_missing"
      : linkedPathNodeId == null
        ? "missing_linked_path_node"
        : "ready_for_sync",
    limitations: [...DEFAULT_DOOR_PATH_NODE_SYNC_LIMITATIONS]
  });
}

export function validateDoorPathNodeSyncContract(value: unknown): DoorPathNodeSyncContract {
  const contract = requireRecord(value, "doorPathNodeSyncContract");
  requireExactKeys(contract, "doorPathNodeSyncContract", [
    "doorId",
    "ownerKind",
    "ownerId",
    "wall",
    "offsetFeet",
    "derivedDoorCenterFeet",
    "linkedPathNodeId",
    "syncStatus",
    "limitations"
  ]);

  const validated = {
    doorId: requireString(contract.doorId, "doorId"),
    ownerKind: requireEnum(contract.ownerKind, ["room", "hallway"] as const, "ownerKind"),
    ownerId: requireString(contract.ownerId, "ownerId"),
    wall: requireEnum(contract.wall, ["north", "south", "east", "west"] as const, "wall"),
    offsetFeet: requireFiniteNumber(contract.offsetFeet, "offsetFeet"),
    derivedDoorCenterFeet: validateDoorCenterFeet(contract.derivedDoorCenterFeet),
    linkedPathNodeId: requireNullableString(contract.linkedPathNodeId, "linkedPathNodeId"),
    syncStatus: requireEnum(contract.syncStatus, DOOR_PATH_NODE_SYNC_STATUSES, "syncStatus"),
    limitations: validateStringList(contract.limitations, "limitations")
  };

  if (validated.limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  return validated;
}

export function deriveDoorCenterFeet(
  door: EditableDoorGeometry,
  owner: EditableRectFeet
): DoorCenterFeet {
  switch (door.wall) {
    case "north":
      return roundPoint({
        xFeet: owner.xFeet + door.offsetFeet + door.widthFeet / 2,
        yFeet: owner.yFeet
      });
    case "south":
      return roundPoint({
        xFeet: owner.xFeet + door.offsetFeet + door.widthFeet / 2,
        yFeet: owner.yFeet + owner.heightFeet
      });
    case "east":
      return roundPoint({
        xFeet: owner.xFeet + owner.widthFeet,
        yFeet: owner.yFeet + door.offsetFeet + door.widthFeet / 2
      });
    case "west":
      return roundPoint({
        xFeet: owner.xFeet,
        yFeet: owner.yFeet + door.offsetFeet + door.widthFeet / 2
      });
  }
}

function findDoorOwner(
  door: EditableDoorGeometry,
  layout: EditableLayoutGeometryContract
): EditableRectFeet | null {
  return door.ownerKind === "room"
    ? layout.rooms.find((room) => room.id === door.ownerId) ?? null
    : layout.hallways.find((hallway) => hallway.id === door.ownerId) ?? null;
}

function validateDoorCenterFeet(value: unknown): DoorCenterFeet {
  const center = requireRecord(value, "derivedDoorCenterFeet");
  requireExactKeys(center, "derivedDoorCenterFeet", ["xFeet", "yFeet"]);
  return roundPoint({
    xFeet: requireFiniteNumber(center.xFeet, "derivedDoorCenterFeet.xFeet"),
    yFeet: requireFiniteNumber(center.yFeet, "derivedDoorCenterFeet.yFeet")
  });
}

function roundPoint(point: DoorCenterFeet): DoorCenterFeet {
  return {
    xFeet: normalizeSignedZero(roundFeet(point.xFeet)),
    yFeet: normalizeSignedZero(roundFeet(point.yFeet))
  };
}

function validateStringList(value: unknown, label: string): string[] {
  return requireArray(value, label).map((item, index) => requireString(item, `${label}[${index}]`));
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

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  return requireString(value, label);
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
