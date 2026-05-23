export const EDITABLE_LAYOUT_GEOMETRY_SCHEMA_VERSION = "1.0.0" as const;

export const EDITABLE_LAYOUT_UNITS = ["feet"] as const;
export const EDITABLE_DOOR_WALLS = ["north", "south", "east", "west"] as const;
export const EDITABLE_STATION_TYPES = ["nurse_station", "desk"] as const;
export const EDITABLE_ZONE_TYPES = ["ems_entry", "trauma", "provider_pharmacy"] as const;
export const EDITABLE_DOOR_OWNER_KINDS = ["room", "hallway"] as const;

export type EditableLayoutUnits = (typeof EDITABLE_LAYOUT_UNITS)[number];
export type EditableDoorWall = (typeof EDITABLE_DOOR_WALLS)[number];
export type EditableStationType = (typeof EDITABLE_STATION_TYPES)[number];
export type EditableZoneType = (typeof EDITABLE_ZONE_TYPES)[number];
export type EditableDoorOwnerKind = (typeof EDITABLE_DOOR_OWNER_KINDS)[number];

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

export type EditableLayoutGeometryContract = {
  schemaVersion: typeof EDITABLE_LAYOUT_GEOMETRY_SCHEMA_VERSION;
  layoutId: string;
  units: EditableLayoutUnits;
  rooms: EditableRoomGeometry[];
  doors: EditableDoorGeometry[];
  stations: EditableStationGeometry[];
  hallways: EditableHallwayGeometry[];
  zones: EditableZoneGeometry[];
  limitations: string[];
};

const MIN_ROOM_SIZE_FEET = 4;
const MIN_STATION_SIZE_FEET = 2;
const MIN_HALLWAY_SIZE_FEET = 1;
const MIN_ZONE_SIZE_FEET = 1;
const MIN_DOOR_WIDTH_FEET = 2;

const FORBIDDEN_PIXEL_KEY_PATTERN = /(^|_)(px|pixel|pixels)$/i;

export function validateEditableLayoutGeometryContract(
  value: unknown
): EditableLayoutGeometryContract {
  rejectPixelFields(value, "editableLayoutGeometry");
  const layout = requireRecord(value, "editableLayoutGeometry");
  requireExactKeys(layout, "editableLayoutGeometry", [
    "schemaVersion",
    "layoutId",
    "units",
    "rooms",
    "doors",
    "stations",
    "hallways",
    "zones",
    "limitations"
  ]);

  const rooms = requireArray(layout.rooms, "rooms").map(validateRoom);
  const hallways = requireArray(layout.hallways, "hallways").map(validateHallway);
  const doors = requireArray(layout.doors, "doors").map(validateDoor);
  const stations = requireArray(layout.stations, "stations").map(validateStation);
  const zones = requireArray(layout.zones, "zones").map(validateZone);
  const limitations = requireArray(layout.limitations, "limitations").map((limitation, index) =>
    requireString(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  requireUniqueIds([
    ...rooms,
    ...doors,
    ...stations,
    ...hallways,
    ...zones
  ]);
  validateDoorWallSpans(doors, rooms, hallways);

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
    stations,
    hallways,
    zones,
    limitations
  };
}

function validateRoom(value: unknown, index: number): EditableRoomGeometry {
  const room = validateBasicRect(value, `rooms[${index}]`, "room", MIN_ROOM_SIZE_FEET);
  return { ...room, objectType: "room" };
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
  objectType: "room" | "station" | "hallway" | "zone",
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
  hallways: EditableHallwayGeometry[]
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
    const wallLengthFeet = door.wall === "north" || door.wall === "south"
      ? owner.widthFeet
      : owner.heightFeet;
    if (door.widthFeet > wallLengthFeet || door.offsetFeet + door.widthFeet > wallLengthFeet) {
      throw new Error(`door ${door.id} must remain within the referenced wall length`);
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

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
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
