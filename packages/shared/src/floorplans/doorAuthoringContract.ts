import {
  validateEditableLayoutGeometryContract,
  type EditableDoorGeometry,
  type EditableDoorWall,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";

export type DoorAuthoringResult = {
  layout: EditableLayoutGeometryContract;
  selectedDoorId: string | null;
  pathSyncStatus: "stale_warning";
  warning: string;
};

export function addDoorToRoom(input: {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  doorId: string;
  roomId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
  widthFeet: number;
}): DoorAuthoringResult {
  const layout = assertEditable(input.layout, input.readOnly);
  if (layout.doors.some((door) => door.id === input.doorId)) {
    throw new Error("door ID must be unique");
  }
  requireRoom(layout, input.roomId);
  const door = validateDoorOnRoom(layout, {
    objectType: "door",
    id: input.doorId,
    label: `${input.roomId} door`,
    ownerKind: "room",
    ownerId: input.roomId,
    wall: input.wall,
    offsetFeet: input.offsetFeet,
    widthFeet: input.widthFeet
  });
  return markPathSyncStale({
    layout: validateEditableLayoutGeometryContract({
      ...layout,
      doors: [...layout.doors, door]
    }),
    selectedDoorId: door.id
  });
}

export function moveDoor(input: {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  doorId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
}): DoorAuthoringResult {
  const layout = assertEditable(input.layout, input.readOnly);
  const existing = layout.doors.find((door) => door.id === input.doorId);
  if (existing == null) {
    throw new Error("doorId must reference an existing door");
  }
  const moved = validateDoorOnRoom(layout, {
    ...existing,
    wall: input.wall,
    offsetFeet: input.offsetFeet
  });
  return markPathSyncStale({
    layout: validateEditableLayoutGeometryContract({
      ...layout,
      doors: layout.doors.map((door) => (door.id === input.doorId ? moved : door))
    }),
    selectedDoorId: input.doorId
  });
}

export function updateDoorWidth(input: {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  doorId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
  widthFeet: number;
}): DoorAuthoringResult {
  const layout = assertEditable(input.layout, input.readOnly);
  const existing = layout.doors.find((door) => door.id === input.doorId);
  if (existing == null) {
    throw new Error("doorId must reference an existing door");
  }
  const updated = validateDoorOnRoom(layout, {
    ...existing,
    wall: input.wall,
    offsetFeet: input.offsetFeet,
    widthFeet: input.widthFeet
  });
  return markPathSyncStale({
    layout: validateEditableLayoutGeometryContract({
      ...layout,
      doors: layout.doors.map((door) => (door.id === input.doorId ? updated : door))
    }),
    selectedDoorId: input.doorId
  });
}


export function deleteDoor(input: {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  doorId: string;
}): DoorAuthoringResult {
  const layout = assertEditable(input.layout, input.readOnly);
  if (!layout.doors.some((door) => door.id === input.doorId)) {
    throw new Error("doorId must reference an existing door");
  }
  return markPathSyncStale({
    layout: validateEditableLayoutGeometryContract({
      ...layout,
      doors: layout.doors.filter((door) => door.id !== input.doorId)
    }),
    selectedDoorId: null
  });
}

export function assignDoorToRoom(input: {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  doorId: string;
  roomId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
}): DoorAuthoringResult {
  const layout = assertEditable(input.layout, input.readOnly);
  requireRoom(layout, input.roomId);
  const existing = layout.doors.find((door) => door.id === input.doorId);
  if (existing == null) {
    throw new Error("doorId must reference an existing door");
  }
  const assigned = validateDoorOnRoom(layout, {
    ...existing,
    ownerKind: "room",
    ownerId: input.roomId,
    wall: input.wall,
    offsetFeet: input.offsetFeet
  });
  return markPathSyncStale({
    layout: validateEditableLayoutGeometryContract({
      ...layout,
      doors: layout.doors.map((door) => (door.id === input.doorId ? assigned : door))
    }),
    selectedDoorId: input.doorId
  });
}

export function markPathSyncStale(input: {
  layout: EditableLayoutGeometryContract;
  selectedDoorId: string | null;
}): DoorAuthoringResult {
  return {
    layout: input.layout,
    selectedDoorId: input.selectedDoorId,
    pathSyncStatus: "stale_warning",
    warning: "Door authoring changed geometry; route/path sync is stale until path nodes are reviewed."
  };
}

function assertEditable(
  layout: EditableLayoutGeometryContract,
  readOnly: boolean
): EditableLayoutGeometryContract {
  if (readOnly) {
    throw new Error("door authoring is blocked for read-only default plans");
  }
  return validateEditableLayoutGeometryContract(layout);
}

function requireRoom(layout: EditableLayoutGeometryContract, roomId: string) {
  const room = layout.rooms.find((candidate) => candidate.id === roomId);
  if (room == null) {
    throw new Error("door roomId must reference a valid room");
  }
  return room;
}

function validateDoorOnRoom(
  layout: EditableLayoutGeometryContract,
  door: EditableDoorGeometry
): EditableDoorGeometry {
  const room = requireRoom(layout, door.ownerId);
  const wallLength = door.wall === "north" || door.wall === "south" ? room.widthFeet : room.heightFeet;
  requireFinite(door.offsetFeet, "offsetFeet");
  requirePositive(door.widthFeet, "widthFeet");
  if (door.offsetFeet < 0 || door.widthFeet <= 0 || door.offsetFeet + door.widthFeet > wallLength) {
    throw new Error("door must be on or near the room perimeter within tolerance");
  }
  return door;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}
