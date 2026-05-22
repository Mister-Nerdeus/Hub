export const ROOM_TYPES = [
  "standard",
  "trauma",
  "isolation",
  "psych",
  "hall_bed",
  "procedure",
  "overflow"
] as const;

export const ZONE_TYPES = [
  "provider_area",
  "pharmacy",
  "ems_entry",
  "hallway",
  "waiting",
  "storage",
  "staff_only"
] as const;

export const PATH_NODE_TYPES = [
  "room_door",
  "hallway",
  "station",
  "entry",
  "zone"
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];
export type ZoneType = (typeof ZONE_TYPES)[number];
export type PathNodeType = (typeof PATH_NODE_TYPES)[number];

export type ScaleSettings = {
  unit: "feet";
  pixelsPerUnit: number;
  gridSizeFeet: number;
  snapToGrid: boolean;
  origin: "top-left";
};

export type Point = {
  x: number;
  y: number;
};

export type Room = {
  id: string;
  label: string;
  type: RoomType;
  x: number;
  y: number;
  widthFeet: number;
  lengthFeet: number;
  zoneId?: string | null;
  nearestStationId?: string | null;
  pathNodeId?: string | null;
};

export type Hallway = {
  id: string;
  label: string;
  widthFeet: number;
  points: Point[];
};

export type Door = {
  id: string;
  label: string;
  roomId: string;
  x: number;
  y: number;
  widthFeet: number;
  pathNodeId?: string | null;
};

export type NurseStation = {
  id: string;
  label: string;
  x: number;
  y: number;
  widthFeet: number;
  lengthFeet: number;
  pathNodeId: string;
};

export type Zone = {
  id: string;
  label: string;
  type: ZoneType;
  color: string;
  x: number;
  y: number;
  widthFeet: number;
  lengthFeet: number;
};

export type PathNode = {
  id: string;
  type: PathNodeType;
  x: number;
  y: number;
  linkedObjectId?: string | null;
};

export type PathEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  lengthFeet: number;
  hallwayWidthFeet: number;
  congestionFactor: number;
  doorPenaltySeconds: number;
  turnPenaltySeconds: number;
  blocked: boolean;
};

export type PlanContract = {
  schemaVersion: "1.0.0";
  planId: string;
  name: string;
  scale: ScaleSettings;
  rooms: Room[];
  hallways: Hallway[];
  doors: Door[];
  nurseStations: NurseStation[];
  zones: Zone[];
  pathNodes: PathNode[];
  pathEdges: PathEdge[];
};

export type RoomLoad = {
  roomId: string;
  occupied: boolean;
  acuityScore: number;
  traumaActive: boolean;
  isolationActive: boolean;
  behavioralRisk: boolean;
  fallRisk: boolean;
  sitterRequired: boolean;
  medicationFrequency: number;
  monitoringFrequency: number;
  procedureBurden: number;
  turnoverBurden: number;
};

export type ScenarioContract = {
  schemaVersion: "1.0.0";
  scenarioId: string;
  planId: string;
  name: string;
  shiftLengthMinutes: number;
  timestepMinutes: number;
  seed: number;
  roomLoads: RoomLoad[];
};

type IdSets = {
  roomIds: Set<string>;
  hallwayIds: Set<string>;
  doorIds: Set<string>;
  nurseStationIds: Set<string>;
  zoneIds: Set<string>;
  pathNodeIds: Set<string>;
};

export function validatePlanContract(value: unknown): PlanContract {
  const plan = requireRecord(value, "plan");
  requireExactKeys(plan, "plan", [
    "schemaVersion",
    "planId",
    "name",
    "scale",
    "rooms",
    "hallways",
    "doors",
    "nurseStations",
    "zones",
    "pathNodes",
    "pathEdges"
  ]);

  requireLiteral(plan.schemaVersion, "1.0.0", "schemaVersion");
  requireString(plan.planId, "planId");
  requireString(plan.name, "name");
  validateScale(plan.scale);

  const rooms = requireArray(plan.rooms, "rooms").map(validateRoom);
  const hallways = requireArray(plan.hallways, "hallways").map(validateHallway);
  const doors = requireArray(plan.doors, "doors").map(validateDoor);
  const nurseStations = requireArray(plan.nurseStations, "nurseStations").map(
    validateNurseStation
  );
  const zones = requireArray(plan.zones, "zones").map(validateZone);
  const pathNodes = requireArray(plan.pathNodes, "pathNodes").map(validatePathNode);
  const pathEdges = requireArray(plan.pathEdges, "pathEdges").map(validatePathEdge);

  const idSets = {
    roomIds: requireUnique("room ids", rooms.map((room) => room.id)),
    hallwayIds: requireUnique("hallway ids", hallways.map((hallway) => hallway.id)),
    doorIds: requireUnique("door ids", doors.map((door) => door.id)),
    nurseStationIds: requireUnique(
      "nurse station ids",
      nurseStations.map((station) => station.id)
    ),
    zoneIds: requireUnique("zone ids", zones.map((zone) => zone.id)),
    pathNodeIds: requireUnique("path node ids", pathNodes.map((node) => node.id))
  };
  requireUnique("path edge ids", pathEdges.map((edge) => edge.id));

  rooms.forEach((room, index) => validateRoomReferences(room, index, idSets));
  doors.forEach((door, index) => validateDoorReferences(door, index, idSets));
  nurseStations.forEach((station, index) => validateNurseStationReferences(station, index, idSets));
  pathNodes.forEach((node, index) => validatePathNodeReferences(node, index, idSets));
  pathEdges.forEach((edge, index) => validatePathEdgeReferences(edge, index, idSets));

  return plan as PlanContract;
}

export function validateScenarioContract(value: unknown): ScenarioContract {
  const scenario = requireRecord(value, "scenario");
  requireExactKeys(scenario, "scenario", [
    "schemaVersion",
    "scenarioId",
    "planId",
    "name",
    "shiftLengthMinutes",
    "timestepMinutes",
    "seed",
    "roomLoads"
  ]);

  requireLiteral(scenario.schemaVersion, "1.0.0", "schemaVersion");
  requireString(scenario.scenarioId, "scenarioId");
  requireString(scenario.planId, "planId");
  requireString(scenario.name, "name");
  const shiftLengthMinutes = requirePositiveInteger(
    scenario.shiftLengthMinutes,
    "shiftLengthMinutes"
  );
  const timestepMinutes = requirePositiveInteger(scenario.timestepMinutes, "timestepMinutes");
  requireInteger(scenario.seed, "seed", 0);

  if (shiftLengthMinutes % timestepMinutes !== 0) {
    throw new Error("shiftLengthMinutes must divide evenly by timestepMinutes");
  }

  const roomLoads = requireArray(scenario.roomLoads, "roomLoads");
  const roomLoadIds = roomLoads.map((roomLoad, index) => validateRoomLoad(roomLoad, index).roomId);
  requireUnique("room load ids", roomLoadIds);

  return scenario as ScenarioContract;
}

function validateScale(value: unknown): ScaleSettings {
  const scale = requireRecord(value, "scale");
  requireExactKeys(scale, "scale", [
    "unit",
    "pixelsPerUnit",
    "gridSizeFeet",
    "snapToGrid",
    "origin"
  ]);
  requireLiteral(scale.unit, "feet", "scale.unit");
  requirePositiveNumber(scale.pixelsPerUnit, "scale.pixelsPerUnit");
  requirePositiveNumber(scale.gridSizeFeet, "scale.gridSizeFeet");
  requireBoolean(scale.snapToGrid, "scale.snapToGrid");
  requireLiteral(scale.origin, "top-left", "scale.origin");
  return scale as ScaleSettings;
}

function validateRoom(value: unknown, index: number): Room {
  const room = requireRecord(value, `rooms[${index}]`);
  requireExactKeys(room, `rooms[${index}]`, [
    "id",
    "label",
    "type",
    "x",
    "y",
    "widthFeet",
    "lengthFeet",
    "zoneId",
    "nearestStationId",
    "pathNodeId"
  ]);
  requireString(room.id, `rooms[${index}].id`);
  requireString(room.label, `rooms[${index}].label`);
  requireEnum(room.type, ROOM_TYPES, `rooms[${index}].type`);
  requireNumber(room.x, `rooms[${index}].x`);
  requireNumber(room.y, `rooms[${index}].y`);
  requirePositiveNumber(room.widthFeet, `rooms[${index}].widthFeet`);
  requirePositiveNumber(room.lengthFeet, `rooms[${index}].lengthFeet`);
  requireOptionalString(room.zoneId, `rooms[${index}].zoneId`);
  requireOptionalString(room.nearestStationId, `rooms[${index}].nearestStationId`);
  requireOptionalString(room.pathNodeId, `rooms[${index}].pathNodeId`);
  return room as Room;
}

function validateHallway(value: unknown, index: number): Hallway {
  const hallway = requireRecord(value, `hallways[${index}]`);
  requireExactKeys(hallway, `hallways[${index}]`, ["id", "label", "widthFeet", "points"]);
  requireString(hallway.id, `hallways[${index}].id`);
  requireString(hallway.label, `hallways[${index}].label`);
  requirePositiveNumber(hallway.widthFeet, `hallways[${index}].widthFeet`);
  const points = requireArray(hallway.points, `hallways[${index}].points`);
  if (points.length < 2) {
    throw new Error(`hallways[${index}].points requires at least two points`);
  }
  points.forEach((point, pointIndex) =>
    validatePoint(point, `hallways[${index}].points[${pointIndex}]`)
  );
  return hallway as Hallway;
}

function validateDoor(value: unknown, index: number): Door {
  const door = requireRecord(value, `doors[${index}]`);
  requireExactKeys(door, `doors[${index}]`, [
    "id",
    "label",
    "roomId",
    "x",
    "y",
    "widthFeet",
    "pathNodeId"
  ]);
  requireString(door.id, `doors[${index}].id`);
  requireString(door.label, `doors[${index}].label`);
  requireString(door.roomId, `doors[${index}].roomId`);
  requireNumber(door.x, `doors[${index}].x`);
  requireNumber(door.y, `doors[${index}].y`);
  requirePositiveNumber(door.widthFeet, `doors[${index}].widthFeet`);
  requireOptionalString(door.pathNodeId, `doors[${index}].pathNodeId`);
  return door as Door;
}

function validateNurseStation(value: unknown, index: number): NurseStation {
  const station = requireRecord(value, `nurseStations[${index}]`);
  requireExactKeys(station, `nurseStations[${index}]`, [
    "id",
    "label",
    "x",
    "y",
    "widthFeet",
    "lengthFeet",
    "pathNodeId"
  ]);
  requireString(station.id, `nurseStations[${index}].id`);
  requireString(station.label, `nurseStations[${index}].label`);
  requireNumber(station.x, `nurseStations[${index}].x`);
  requireNumber(station.y, `nurseStations[${index}].y`);
  requirePositiveNumber(station.widthFeet, `nurseStations[${index}].widthFeet`);
  requirePositiveNumber(station.lengthFeet, `nurseStations[${index}].lengthFeet`);
  requireString(station.pathNodeId, `nurseStations[${index}].pathNodeId`);
  return station as NurseStation;
}

function validateZone(value: unknown, index: number): Zone {
  const zone = requireRecord(value, `zones[${index}]`);
  requireExactKeys(zone, `zones[${index}]`, [
    "id",
    "label",
    "type",
    "color",
    "x",
    "y",
    "widthFeet",
    "lengthFeet"
  ]);
  requireString(zone.id, `zones[${index}].id`);
  requireString(zone.label, `zones[${index}].label`);
  requireEnum(zone.type, ZONE_TYPES, `zones[${index}].type`);
  const color = requireString(zone.color, `zones[${index}].color`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error(`zones[${index}].color must be a hex color`);
  }
  requireNumber(zone.x, `zones[${index}].x`);
  requireNumber(zone.y, `zones[${index}].y`);
  requirePositiveNumber(zone.widthFeet, `zones[${index}].widthFeet`);
  requirePositiveNumber(zone.lengthFeet, `zones[${index}].lengthFeet`);
  return zone as Zone;
}

function validatePathNode(value: unknown, index: number): PathNode {
  const node = requireRecord(value, `pathNodes[${index}]`);
  requireExactKeys(node, `pathNodes[${index}]`, [
    "id",
    "type",
    "x",
    "y",
    "linkedObjectId"
  ]);
  requireString(node.id, `pathNodes[${index}].id`);
  requireEnum(node.type, PATH_NODE_TYPES, `pathNodes[${index}].type`);
  requireNumber(node.x, `pathNodes[${index}].x`);
  requireNumber(node.y, `pathNodes[${index}].y`);
  requireOptionalString(node.linkedObjectId, `pathNodes[${index}].linkedObjectId`);
  return node as PathNode;
}

function validatePathEdge(value: unknown, index: number): PathEdge {
  const edge = requireRecord(value, `pathEdges[${index}]`);
  requireExactKeys(edge, `pathEdges[${index}]`, [
    "id",
    "fromNodeId",
    "toNodeId",
    "lengthFeet",
    "hallwayWidthFeet",
    "congestionFactor",
    "doorPenaltySeconds",
    "turnPenaltySeconds",
    "blocked"
  ]);
  requireString(edge.id, `pathEdges[${index}].id`);
  requireString(edge.fromNodeId, `pathEdges[${index}].fromNodeId`);
  requireString(edge.toNodeId, `pathEdges[${index}].toNodeId`);
  requirePositiveNumber(edge.lengthFeet, `pathEdges[${index}].lengthFeet`);
  requirePositiveNumber(edge.hallwayWidthFeet, `pathEdges[${index}].hallwayWidthFeet`);
  requirePositiveNumber(edge.congestionFactor, `pathEdges[${index}].congestionFactor`);
  requireNonNegativeNumber(edge.doorPenaltySeconds, `pathEdges[${index}].doorPenaltySeconds`);
  requireNonNegativeNumber(edge.turnPenaltySeconds, `pathEdges[${index}].turnPenaltySeconds`);
  requireBoolean(edge.blocked, `pathEdges[${index}].blocked`);
  return edge as PathEdge;
}

function validateRoomReferences(room: Room, index: number, idSets: IdSets): void {
  if (room.zoneId != null && !idSets.zoneIds.has(room.zoneId)) {
    throw new Error(`rooms[${index}].zoneId references an unknown zone`);
  }
  if (room.nearestStationId != null && !idSets.nurseStationIds.has(room.nearestStationId)) {
    throw new Error(`rooms[${index}].nearestStationId references an unknown nurse station`);
  }
  if (room.pathNodeId != null && !idSets.pathNodeIds.has(room.pathNodeId)) {
    throw new Error(`rooms[${index}].pathNodeId references an unknown path node`);
  }
}

function validateDoorReferences(door: Door, index: number, idSets: IdSets): void {
  if (!idSets.roomIds.has(door.roomId)) {
    throw new Error(`doors[${index}].roomId references an unknown room`);
  }
  if (door.pathNodeId != null && !idSets.pathNodeIds.has(door.pathNodeId)) {
    throw new Error(`doors[${index}].pathNodeId references an unknown path node`);
  }
}

function validateNurseStationReferences(
  station: NurseStation,
  index: number,
  idSets: IdSets
): void {
  if (!idSets.pathNodeIds.has(station.pathNodeId)) {
    throw new Error(`nurseStations[${index}].pathNodeId references an unknown path node`);
  }
}

function validatePathNodeReferences(node: PathNode, index: number, idSets: IdSets): void {
  if (node.type === "entry") {
    if (node.linkedObjectId != null) {
      throw new Error(`pathNodes[${index}].linkedObjectId is not allowed for entry nodes`);
    }
    return;
  }

  const linkedObjectId = requireString(
    node.linkedObjectId,
    `pathNodes[${index}].linkedObjectId`
  );

  if (node.type === "room_door" && !idSets.doorIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown door`);
  }
  if (node.type === "hallway" && !idSets.hallwayIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown hallway`);
  }
  if (node.type === "station" && !idSets.nurseStationIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown nurse station`);
  }
  if (node.type === "zone" && !idSets.zoneIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown zone`);
  }
}

function validatePathEdgeReferences(edge: PathEdge, index: number, idSets: IdSets): void {
  if (!idSets.pathNodeIds.has(edge.fromNodeId)) {
    throw new Error(`pathEdges[${index}].fromNodeId references an unknown path node`);
  }
  if (!idSets.pathNodeIds.has(edge.toNodeId)) {
    throw new Error(`pathEdges[${index}].toNodeId references an unknown path node`);
  }
}

function validateRoomLoad(value: unknown, index: number): RoomLoad {
  const roomLoad = requireRecord(value, `roomLoads[${index}]`);
  requireExactKeys(roomLoad, `roomLoads[${index}]`, [
    "roomId",
    "occupied",
    "acuityScore",
    "traumaActive",
    "isolationActive",
    "behavioralRisk",
    "fallRisk",
    "sitterRequired",
    "medicationFrequency",
    "monitoringFrequency",
    "procedureBurden",
    "turnoverBurden"
  ]);
  requireString(roomLoad.roomId, `roomLoads[${index}].roomId`);
  requireBoolean(roomLoad.occupied, `roomLoads[${index}].occupied`);
  requireInteger(roomLoad.acuityScore, `roomLoads[${index}].acuityScore`, 1, 5);
  requireBoolean(roomLoad.traumaActive, `roomLoads[${index}].traumaActive`);
  requireBoolean(roomLoad.isolationActive, `roomLoads[${index}].isolationActive`);
  requireBoolean(roomLoad.behavioralRisk, `roomLoads[${index}].behavioralRisk`);
  requireBoolean(roomLoad.fallRisk, `roomLoads[${index}].fallRisk`);
  requireBoolean(roomLoad.sitterRequired, `roomLoads[${index}].sitterRequired`);
  requireInteger(roomLoad.medicationFrequency, `roomLoads[${index}].medicationFrequency`, 0);
  requireInteger(roomLoad.monitoringFrequency, `roomLoads[${index}].monitoringFrequency`, 0);
  requireInteger(roomLoad.procedureBurden, `roomLoads[${index}].procedureBurden`, 0);
  requireInteger(roomLoad.turnoverBurden, `roomLoads[${index}].turnoverBurden`, 0);
  return roomLoad as RoomLoad;
}

function validatePoint(value: unknown, label: string): Point {
  const point = requireRecord(value, label);
  requireExactKeys(point, label, ["x", "y"]);
  requireNumber(point.x, `${label}.x`);
  requireNumber(point.y, `${label}.y`);
  return point as Point;
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

function requireOptionalString(value: unknown, label: string): string | null | undefined {
  if (value == null) {
    return value;
  }
  return requireString(value, label);
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const numberValue = requireNumber(value, label);
  if (numberValue <= 0) {
    throw new Error(`${label} must be positive`);
  }
  return numberValue;
}

function requireNonNegativeNumber(value: unknown, label: string): number {
  const numberValue = requireNumber(value, label);
  if (numberValue < 0) {
    throw new Error(`${label} must be non-negative`);
  }
  return numberValue;
}

function requireInteger(value: unknown, label: string, min?: number, max?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new Error(`${label} must be less than or equal to ${max}`);
  }
  return value;
}

function requirePositiveInteger(value: unknown, label: string): number {
  const integerValue = requireInteger(value, label);
  if (integerValue <= 0) {
    throw new Error(`${label} must be positive`);
  }
  return integerValue;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
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

function requireUnique(label: string, values: string[]): Set<string> {
  const valueSet = new Set(values);
  if (valueSet.size !== values.length) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
  return valueSet;
}
