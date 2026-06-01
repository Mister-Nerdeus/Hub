import {
  validateSplitRoomContract,
  type SplitRoomContract
} from "../floorplans/splitRoomContract.js";
import {
  validatePerimeterWallContract,
  type PerimeterWallContract
} from "../floorplans/perimeterWallContract.js";
import {
  validateEntryExitContract,
  type EntryExitContract
} from "../floorplans/entryExitContract.js";
import {
  validateDoorDestinationContract,
  type DoorDestinationContract
} from "../floorplans/doorDestinationContract.js";

export const EDITABLE_LAYOUT_GEOMETRY_SCHEMA_VERSION = "1.0.0" as const;

export const EDITABLE_LAYOUT_UNITS = ["feet"] as const;
export const EDITABLE_DOOR_WALLS = ["north", "south", "east", "west"] as const;
export const EDITABLE_ROOM_TYPES = [
  "standard",
  "trauma",
  "isolation",
  "behavioral",
  "procedure",
  "overflow",
  "hall_bed",
  "provider_pharmacy",
  "storage",
  "solid_wall"
] as const;
export const EDITABLE_ROOM_CAPACITY_TYPES = ["single", "double", "hall", "flex"] as const;
export const EDITABLE_STATION_TYPES = ["nurse_station", "desk"] as const;
export const EDITABLE_ZONE_TYPES = ["operational", "ems_entry", "trauma", "provider_pharmacy"] as const;
export const EDITABLE_DOOR_OWNER_KINDS = ["room", "hallway"] as const;
export const EDITABLE_SUPPORT_ACCESS_OWNER_KINDS = ["zone"] as const;
export const EDITABLE_DOOR_OWNER_MODEL_STATUSES = [
  "room",
  "hallway",
  "support_access",
  "missing",
  "invalid"
] as const;
export const EDITABLE_SPLIT_BAY_DIVIDER_STYLES = [
  "diagonal",
  "diagonal_down",
  "diagonal_up",
  "vertical",
  "horizontal"
] as const;

export type EditableLayoutUnits = (typeof EDITABLE_LAYOUT_UNITS)[number];
export type EditableDoorWall = (typeof EDITABLE_DOOR_WALLS)[number];
export type EditableRoomType = (typeof EDITABLE_ROOM_TYPES)[number];
export type EditableRoomCapacityType = (typeof EDITABLE_ROOM_CAPACITY_TYPES)[number];
export type EditableStationType = (typeof EDITABLE_STATION_TYPES)[number];
export type EditableZoneType = (typeof EDITABLE_ZONE_TYPES)[number];
export type EditableDoorOwnerKind = (typeof EDITABLE_DOOR_OWNER_KINDS)[number];
export type EditableSupportAccessOwnerKind = (typeof EDITABLE_SUPPORT_ACCESS_OWNER_KINDS)[number];
export type EditableDoorOwnerModelStatus = (typeof EDITABLE_DOOR_OWNER_MODEL_STATUSES)[number];
export type EditableSplitBayDividerStyle = (typeof EDITABLE_SPLIT_BAY_DIVIDER_STYLES)[number];

export type EditableRectFeet = {
  id: string;
  label: string;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
};

export type EditableRoomGeometry = EditableRectFeet & {
  objectType: "room";
  roomNumber: string;
  roomType: EditableRoomType;
  capacityType: EditableRoomCapacityType;
  isHallBed: boolean;
  isTraumaAdjacent: boolean;
};

export type EditableStationGeometry = EditableRectFeet & {
  objectType: "station";
  stationType: EditableStationType;
};

export type EditableHallwayGeometry = EditableRectFeet & {
  objectType: "hallway";
};

export type EditableZoneGeometry = EditableRectFeet & {
  objectType: "zone";
  zoneType: EditableZoneType;
};

export type EditableDoorGeometry = {
  objectType: "door";
  id: string;
  label: string;
  ownerKind: EditableDoorOwnerKind;
  ownerId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
  widthFeet: number;
};

export type EditableSupportAccessPointGeometry = {
  objectType: "support_access";
  id: string;
  label: string;
  ownerKind: EditableSupportAccessOwnerKind;
  ownerId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
  widthFeet: number;
};

export type EditableSplitBayGeometry = EditableRectFeet & {
  objectType: "split_bay";
  splitBayId: string;
  bedPositionRoomIds: readonly [string, string];
  dividerStyle: EditableSplitBayDividerStyle;
};

export type EditableLayoutGeometryContract = {
  schemaVersion: typeof EDITABLE_LAYOUT_GEOMETRY_SCHEMA_VERSION;
  layoutId: string;
  units: EditableLayoutUnits;
  rooms: EditableRoomGeometry[];
  doors: EditableDoorGeometry[];
  supportAccessPoints?: EditableSupportAccessPointGeometry[];
  stations: EditableStationGeometry[];
  hallways: EditableHallwayGeometry[];
  zones: EditableZoneGeometry[];
  perimeterWalls?: PerimeterWallContract[];
  entryExits?: EntryExitContract[];
  doorDestinations?: DoorDestinationContract[];
  splitRooms?: SplitRoomContract[];
  /** Legacy split-bay overlays are compatibility-only. Normal editor authoring uses splitRooms. */
  splitBays?: EditableSplitBayGeometry[];
  limitations: string[];
};

export type EditableLayoutGeometryValidationOptions = {
  allowLegacySolidWallDoorReferences?: boolean;
};

const MIN_ROOM_SIZE_FEET = 4;
const MIN_STATION_SIZE_FEET = 2;
const MIN_HALLWAY_SIZE_FEET = 1;
const MIN_ZONE_SIZE_FEET = 1;
const MIN_DOOR_WIDTH_FEET = 2;

const FORBIDDEN_PIXEL_KEY_PATTERN = /(^|_)(px|pixel|pixels)$/i;
const FORBIDDEN_ROOM_NUMBER_TEXT_PATTERN =
  /\b(patient|pt|medical record|record number|chart)\b/i;
const FORBIDDEN_ROOM_TYPE_TEXT_PATTERN =
  /\b(diagnosis|diagnoses|dx|sepsis|stroke|cardiac|fracture|overdose|symptom)\b/i;

export function validateEditableLayoutGeometryContract(
  value: unknown,
  options: EditableLayoutGeometryValidationOptions = {}
): EditableLayoutGeometryContract {
  rejectPixelFields(value, "editableLayoutGeometry");
  const layout = requireRecord(value, "editableLayoutGeometry");
  requireExactKeys(layout, "editableLayoutGeometry", [
    "schemaVersion",
    "layoutId",
    "units",
    "rooms",
    "doors",
    "supportAccessPoints",
    "stations",
    "hallways",
    "zones",
    "perimeterWalls",
    "entryExits",
    "doorDestinations",
    "splitRooms",
    "splitBays",
    "limitations"
  ]);

  const rooms = requireArray(layout.rooms, "rooms").map(validateRoom);
  const hallways = requireArray(layout.hallways, "hallways").map(validateHallway);
  const doors = requireArray(layout.doors, "doors").map(validateDoor);
  const supportAccessPoints = requireArray(
    layout.supportAccessPoints ?? [],
    "supportAccessPoints"
  ).map(validateSupportAccessPoint);
  const stations = requireArray(layout.stations, "stations").map(validateStation);
  const zones = requireArray(layout.zones, "zones").map(validateZone);
  const perimeterWalls = requireArray(layout.perimeterWalls ?? [], "perimeterWalls").map(
    validatePerimeterWallContract
  );
  const entryExits = requireArray(layout.entryExits ?? [], "entryExits").map(validateEntryExitContract);
  const doorDestinations = requireArray(layout.doorDestinations ?? [], "doorDestinations").map(
    validateDoorDestinationContract
  );
  const splitRooms = requireArray(layout.splitRooms ?? [], "splitRooms").map(validateSplitRoomContract);
  const splitBays = requireArray(layout.splitBays ?? [], "splitBays").map(validateSplitBay);
  const limitations = requireArray(layout.limitations, "limitations").map((limitation, index) =>
    requireString(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  requireUniqueIds([
    ...rooms,
    ...doors,
    ...supportAccessPoints,
    ...stations,
    ...hallways,
    ...zones,
    ...perimeterWalls.map((wall) => ({ id: wall.perimeterWallId })),
    ...perimeterWalls.flatMap((wall) => wall.segments.map((segment) => ({ id: segment.segmentId }))),
    ...entryExits.map((entryExit) => ({ id: entryExit.entryExitId })),
    ...splitBays,
    ...splitRooms.map((splitRoom) => ({ id: splitRoom.splitRoomId }))
  ]);
  validateDoorWallSpans(doors, rooms, hallways, options);
  validateSupportAccessWallSpans(supportAccessPoints, zones);
  validateDoorDestinationReferences(doorDestinations, doors, rooms, hallways, zones, entryExits);
  validateSplitRoomReferences(splitRooms, rooms);
  validateSplitBayReferences(splitBays, rooms);

  return {
    schemaVersion: requireLiteral(
      layout.schemaVersion,
      EDITABLE_LAYOUT_GEOMETRY_SCHEMA_VERSION,
      "schemaVersion"
    ),
    layoutId: requireString(layout.layoutId, "layoutId"),
    units: requireEnum(layout.units, EDITABLE_LAYOUT_UNITS, "units"),
    rooms,
    doors,
    supportAccessPoints,
    stations,
    hallways,
    zones,
    perimeterWalls,
    entryExits,
    doorDestinations,
    splitRooms,
    splitBays,
    limitations
  };
}

function validateRoom(value: unknown, index: number): EditableRoomGeometry {
  const room = requireRecord(value, `rooms[${index}]`);
  requireExactKeys(room, `rooms[${index}]`, [
    "objectType",
    "id",
    "label",
    "roomNumber",
    "roomType",
    "capacityType",
    "isHallBed",
    "isTraumaAdjacent",
    "xFeet",
    "yFeet",
    "widthFeet",
    "heightFeet"
  ]);
  const rect = validateRectFields(room, `rooms[${index}]`, "room", MIN_ROOM_SIZE_FEET);
  const roomNumber = requireRoomNumber(room.roomNumber, `rooms[${index}].roomNumber`);
  const roomType = requireRoomType(room.roomType, `rooms[${index}].roomType`);
  const capacityType = requireEnum(
    room.capacityType,
    EDITABLE_ROOM_CAPACITY_TYPES,
    `rooms[${index}].capacityType`
  );
  const isHallBed = requireBoolean(room.isHallBed, `rooms[${index}].isHallBed`);
  if (roomType === "hall_bed" && !isHallBed) {
    throw new Error(`rooms[${index}].isHallBed must be true when roomType is hall_bed`);
  }
  if (roomType !== "hall_bed" && isHallBed) {
    throw new Error(`rooms[${index}].isHallBed must be false unless roomType is hall_bed`);
  }

  return {
    ...rect,
    objectType: "room",
    roomNumber,
    roomType,
    capacityType,
    isHallBed,
    isTraumaAdjacent: requireBoolean(room.isTraumaAdjacent, `rooms[${index}].isTraumaAdjacent`)
  };
}

function validateStation(value: unknown, index: number): EditableStationGeometry {
  const station = requireRecord(value, `stations[${index}]`);
  requireExactKeys(station, `stations[${index}]`, [
    "objectType",
    "id",
    "label",
    "stationType",
    "xFeet",
    "yFeet",
    "widthFeet",
    "heightFeet"
  ]);
  const rect = validateRectFields(station, `stations[${index}]`, "station", MIN_STATION_SIZE_FEET);
  return {
    ...rect,
    objectType: "station",
    stationType: requireEnum(station.stationType, EDITABLE_STATION_TYPES, `stations[${index}].stationType`)
  };
}

function validateHallway(value: unknown, index: number): EditableHallwayGeometry {
  const hallway = validateBasicRect(value, `hallways[${index}]`, "hallway", MIN_HALLWAY_SIZE_FEET);
  return { ...hallway, objectType: "hallway" };
}

function validateZone(value: unknown, index: number): EditableZoneGeometry {
  const zone = requireRecord(value, `zones[${index}]`);
  requireExactKeys(zone, `zones[${index}]`, [
    "objectType",
    "id",
    "label",
    "zoneType",
    "xFeet",
    "yFeet",
    "widthFeet",
    "heightFeet"
  ]);
  const rect = validateRectFields(zone, `zones[${index}]`, "zone", MIN_ZONE_SIZE_FEET);
  return {
    ...rect,
    objectType: "zone",
    zoneType: requireEnum(zone.zoneType, EDITABLE_ZONE_TYPES, `zones[${index}].zoneType`)
  };
}

function validateDoor(value: unknown, index: number): EditableDoorGeometry {
  const door = requireRecord(value, `doors[${index}]`);
  requireExactKeys(door, `doors[${index}]`, [
    "objectType",
    "id",
    "label",
    "ownerKind",
    "ownerId",
    "wall",
    "offsetFeet",
    "widthFeet"
  ]);
  requireLiteral(door.objectType, "door", `doors[${index}].objectType`);
  return {
    objectType: "door",
    id: requireString(door.id, `doors[${index}].id`),
    label: requireString(door.label, `doors[${index}].label`),
    ownerKind: requireEnum(door.ownerKind, EDITABLE_DOOR_OWNER_KINDS, `doors[${index}].ownerKind`),
    ownerId: requireString(door.ownerId, `doors[${index}].ownerId`),
    wall: requireEnum(door.wall, EDITABLE_DOOR_WALLS, `doors[${index}].wall`),
    offsetFeet: requireNumber(door.offsetFeet, `doors[${index}].offsetFeet`, 0),
    widthFeet: requireNumber(door.widthFeet, `doors[${index}].widthFeet`, MIN_DOOR_WIDTH_FEET)
  };
}

function validateSupportAccessPoint(
  value: unknown,
  index: number
): EditableSupportAccessPointGeometry {
  const accessPoint = requireRecord(value, `supportAccessPoints[${index}]`);
  requireExactKeys(accessPoint, `supportAccessPoints[${index}]`, [
    "objectType",
    "id",
    "label",
    "ownerKind",
    "ownerId",
    "wall",
    "offsetFeet",
    "widthFeet"
  ]);
  requireLiteral(accessPoint.objectType, "support_access", `supportAccessPoints[${index}].objectType`);
  return {
    objectType: "support_access",
    id: requireString(accessPoint.id, `supportAccessPoints[${index}].id`),
    label: requireString(accessPoint.label, `supportAccessPoints[${index}].label`),
    ownerKind: requireEnum(
      accessPoint.ownerKind,
      EDITABLE_SUPPORT_ACCESS_OWNER_KINDS,
      `supportAccessPoints[${index}].ownerKind`
    ),
    ownerId: requireString(accessPoint.ownerId, `supportAccessPoints[${index}].ownerId`),
    wall: requireEnum(accessPoint.wall, EDITABLE_DOOR_WALLS, `supportAccessPoints[${index}].wall`),
    offsetFeet: requireNumber(accessPoint.offsetFeet, `supportAccessPoints[${index}].offsetFeet`, 0),
    widthFeet: requireNumber(accessPoint.widthFeet, `supportAccessPoints[${index}].widthFeet`, MIN_DOOR_WIDTH_FEET)
  };
}

function validateSplitBay(value: unknown, index: number): EditableSplitBayGeometry {
  const splitBay = requireRecord(value, `splitBays[${index}]`);
  requireExactKeys(splitBay, `splitBays[${index}]`, [
    "objectType",
    "id",
    "label",
    "splitBayId",
    "bedPositionRoomIds",
    "dividerStyle",
    "xFeet",
    "yFeet",
    "widthFeet",
    "heightFeet"
  ]);
  const rect = validateRectFields(splitBay, `splitBays[${index}]`, "split_bay", MIN_ROOM_SIZE_FEET);
  const bedPositionRoomIds = requireTuple2String(
    splitBay.bedPositionRoomIds,
    `splitBays[${index}].bedPositionRoomIds`
  );
  return {
    ...rect,
    objectType: "split_bay",
    splitBayId: requireString(splitBay.splitBayId, `splitBays[${index}].splitBayId`),
    bedPositionRoomIds,
    dividerStyle: requireEnum(
      splitBay.dividerStyle,
      EDITABLE_SPLIT_BAY_DIVIDER_STYLES,
      `splitBays[${index}].dividerStyle`
    )
  };
}

function validateBasicRect(
  value: unknown,
  label: string,
  objectType: "room" | "station" | "hallway" | "zone",
  minimumSizeFeet: number
): EditableRectFeet {
  const rect = requireRecord(value, label);
  requireExactKeys(rect, label, [
    "objectType",
    "id",
    "label",
    "xFeet",
    "yFeet",
    "widthFeet",
    "heightFeet"
  ]);
  return validateRectFields(rect, label, objectType, minimumSizeFeet);
}

function validateRectFields(
  rect: Record<string, unknown>,
  label: string,
  objectType: "room" | "station" | "hallway" | "zone" | "split_bay",
  minimumSizeFeet: number
): EditableRectFeet {
  requireLiteral(rect.objectType, objectType, `${label}.objectType`);
  return {
    id: requireString(rect.id, `${label}.id`),
    label: requireString(rect.label, `${label}.label`),
    xFeet: requireNumber(rect.xFeet, `${label}.xFeet`, 0),
    yFeet: requireNumber(rect.yFeet, `${label}.yFeet`, 0),
    widthFeet: requireNumber(rect.widthFeet, `${label}.widthFeet`, minimumSizeFeet),
    heightFeet: requireNumber(rect.heightFeet, `${label}.heightFeet`, minimumSizeFeet)
  };
}

function validateDoorWallSpans(
  doors: EditableDoorGeometry[],
  rooms: EditableRoomGeometry[],
  hallways: EditableHallwayGeometry[],
  options: EditableLayoutGeometryValidationOptions
): void {
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const hallwaysById = new Map(hallways.map((hallway) => [hallway.id, hallway]));
  for (const door of doors) {
    const owner = door.ownerKind === "room"
      ? roomsById.get(door.ownerId)
      : hallwaysById.get(door.ownerId);
    if (owner == null) {
      throw new Error(`door ${door.id} ownerId must reference a ${door.ownerKind}`);
    }
    if (
      door.ownerKind === "room" &&
      "roomType" in owner &&
      owner.roomType === "solid_wall" &&
      options.allowLegacySolidWallDoorReferences !== true
    ) {
      throw new Error(`door ${door.id} must not reference solid_wall room ${owner.id}`);
    }
    const wallLengthFeet = door.wall === "north" || door.wall === "south"
      ? owner.widthFeet
      : owner.heightFeet;
    if (door.widthFeet > wallLengthFeet || door.offsetFeet + door.widthFeet > wallLengthFeet) {
      throw new Error(`door ${door.id} must remain within the referenced wall length`);
    }
  }
}

function validateSupportAccessWallSpans(
  accessPoints: EditableSupportAccessPointGeometry[],
  zones: EditableZoneGeometry[]
): void {
  const zonesById = new Map(zones.map((zone) => [zone.id, zone]));
  for (const accessPoint of accessPoints) {
    const owner = zonesById.get(accessPoint.ownerId);
    if (owner == null) {
      throw new Error(`support access ${accessPoint.id} ownerId must reference a zone`);
    }
    const wallLengthFeet = accessPoint.wall === "north" || accessPoint.wall === "south"
      ? owner.widthFeet
      : owner.heightFeet;
    if (
      accessPoint.widthFeet > wallLengthFeet ||
      accessPoint.offsetFeet + accessPoint.widthFeet > wallLengthFeet
    ) {
      throw new Error(`support access ${accessPoint.id} must remain within the referenced zone wall length`);
    }
  }
}

function validateDoorDestinationReferences(
  destinations: DoorDestinationContract[],
  doors: EditableDoorGeometry[],
  rooms: EditableRoomGeometry[],
  hallways: EditableHallwayGeometry[],
  zones: EditableZoneGeometry[],
  entryExits: EntryExitContract[]
): void {
  const doorIds = new Set(doors.map((door) => door.id));
  const roomIds = new Set(rooms.map((room) => room.id));
  const hallwayIds = new Set(hallways.map((hallway) => hallway.id));
  const zoneIds = new Set(zones.map((zone) => zone.id));
  const entryExitIds = new Set(entryExits.map((entryExit) => entryExit.entryExitId));
  requireUniqueIds(destinations.map((destination) => ({ id: destination.doorId })));

  for (const destination of destinations) {
    if (!doorIds.has(destination.doorId)) {
      throw new Error(`door destination ${destination.doorId} must reference an existing door`);
    }
    if (destination.ownerKind === "room" && !roomIds.has(destination.ownerId)) {
      throw new Error(`door destination ${destination.doorId} ownerId must reference a room`);
    }
    if (destination.ownerKind === "hallway" && !hallwayIds.has(destination.ownerId)) {
      throw new Error(`door destination ${destination.doorId} ownerId must reference a hallway`);
    }
    if (destination.ownerKind === "zone" && !zoneIds.has(destination.ownerId)) {
      throw new Error(`door destination ${destination.doorId} ownerId must reference a zone`);
    }
    if (destination.ownerKind === "entry_exit" && !entryExitIds.has(destination.ownerId)) {
      throw new Error(`door destination ${destination.doorId} ownerId must reference an entry/exit`);
    }
  }
}

function validateSplitBayReferences(
  splitBays: EditableSplitBayGeometry[],
  rooms: EditableRoomGeometry[]
): void {
  const roomIds = new Set(rooms.map((room) => room.id));
  const usedBedPositionIds = new Set<string>();
  for (const splitBay of splitBays) {
    if (splitBay.id !== splitBay.splitBayId) {
      throw new Error(`split bay ${splitBay.id} id must match splitBayId`);
    }
    for (const roomId of splitBay.bedPositionRoomIds) {
      if (!roomIds.has(roomId)) {
        throw new Error(`split bay ${splitBay.splitBayId} bedPositionRoomIds must reference existing rooms`);
      }
      if (usedBedPositionIds.has(roomId)) {
        throw new Error(`split bay bed position room ${roomId} must not be referenced by multiple split bays`);
      }
      usedBedPositionIds.add(roomId);
    }
  }
}

function validateSplitRoomReferences(
  splitRooms: SplitRoomContract[],
  rooms: EditableRoomGeometry[]
): void {
  const roomIds = new Set(rooms.map((room) => room.id));
  const usedParentRoomIds = new Set<string>();
  const usedBedPositionIds = new Set<string>();
  for (const splitRoom of splitRooms) {
    if (!roomIds.has(splitRoom.parentRoomId)) {
      throw new Error(`split room ${splitRoom.splitRoomId} parentRoomId must reference an existing room`);
    }
    if (usedParentRoomIds.has(splitRoom.parentRoomId)) {
      throw new Error(`split room parent ${splitRoom.parentRoomId} must not be referenced by multiple split rooms`);
    }
    usedParentRoomIds.add(splitRoom.parentRoomId);
    for (const bedPosition of splitRoom.bedPositions) {
      if (bedPosition.parentRoomId !== splitRoom.parentRoomId) {
        throw new Error(`split room ${splitRoom.splitRoomId} bed positions must reference the parent room`);
      }
      if (usedBedPositionIds.has(bedPosition.bedPositionId)) {
        throw new Error(`bed position ${bedPosition.bedPositionId} must be unique`);
      }
      usedBedPositionIds.add(bedPosition.bedPositionId);
    }
  }
}

function rejectPixelFields(value: unknown, label: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectPixelFields(item, `${label}[${index}]`));
    return;
  }
  if (value === null || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_PIXEL_KEY_PATTERN.test(key) || key.toLowerCase().includes("pixel")) {
      throw new Error(`${label}.${key} pixel fields are not allowed in editable layout geometry`);
    }
    rejectPixelFields(child, `${label}.${key}`);
  }
}

function requireUniqueIds(values: Array<{ id: string }>): void {
  const ids = values.map((value) => value.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("editable layout geometry IDs must be unique");
  }
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

function requireTuple2String(value: unknown, label: string): readonly [string, string] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`${label} must contain exactly two room ids`);
  }
  const first = requireString(value[0], `${label}[0]`);
  const second = requireString(value[1], `${label}[1]`);
  if (first === second) {
    throw new Error(`${label} must reference two distinct rooms`);
  }
  return [first, second];
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireRoomNumber(value: unknown, label: string): string {
  const roomNumber = requireString(value, label).trim();
  if (roomNumber.length === 0) {
    throw new Error(`${label} must be a non-empty room display label`);
  }
  if (FORBIDDEN_ROOM_NUMBER_TEXT_PATTERN.test(roomNumber)) {
    throw new Error(`${label} must be an operational room label, not a patient identifier`);
  }
  return roomNumber;
}

function requireRoomType(value: unknown, label: string): EditableRoomType {
  if (typeof value === "string" && FORBIDDEN_ROOM_TYPE_TEXT_PATTERN.test(value)) {
    throw new Error(`${label} must be an operational room type, not diagnosis or clinical text`);
  }
  return requireEnum(value, EDITABLE_ROOM_TYPES, label);
}

function requireNumber(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}
