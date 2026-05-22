export type UnitSettings = {
  unit: "feet";
  pixelsPerUnit: number;
  gridSizeUnits: number;
  origin: "top-left";
};

export type Point = {
  x: number;
  y: number;
};

export type Room = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zoneId?: string | null;
};

export type Hallway = {
  id: string;
  points: Point[];
};

export type Door = {
  id: string;
  roomId: string;
  x: number;
  y: number;
};

export type Station = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type Zone = {
  id: string;
  label: string;
  color: string;
};

export type PathNode = {
  id: string;
  x: number;
  y: number;
};

export type PathEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  lengthUnits?: number | null;
};

export type PlanContract = {
  schemaVersion: "1.0.0";
  planId: string;
  name: string;
  units: UnitSettings;
  rooms: Room[];
  hallways: Hallway[];
  doors: Door[];
  stations: Station[];
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

export function validatePlanContract(value: unknown): PlanContract {
  const plan = requireRecord(value, "plan");

  requireLiteral(plan.schemaVersion, "1.0.0", "schemaVersion");
  requireString(plan.planId, "planId");
  requireString(plan.name, "name");
  validateUnits(plan.units);

  const rooms = requireArray(plan.rooms, "rooms");
  const hallways = requireArray(plan.hallways, "hallways");
  const doors = requireArray(plan.doors, "doors");
  const stations = requireArray(plan.stations, "stations");
  const zones = requireArray(plan.zones, "zones");
  const pathNodes = requireArray(plan.pathNodes, "pathNodes");
  const pathEdges = requireArray(plan.pathEdges, "pathEdges");

  const zoneIds = new Set(zones.map((zone, index) => validateZone(zone, index).id));
  const roomIds = new Set(rooms.map((room, index) => validateRoom(room, index, zoneIds).id));
  const pathNodeIds = new Set(pathNodes.map((node, index) => validatePathNode(node, index).id));

  requireUnique("room ids", [...roomIds], rooms.length);
  requireUnique("zone ids", [...zoneIds], zones.length);
  requireUnique("path node ids", [...pathNodeIds], pathNodes.length);

  hallways.forEach(validateHallway);
  doors.forEach((door, index) => validateDoor(door, index, roomIds));
  stations.forEach(validateStation);
  pathEdges.forEach((edge, index) => validatePathEdge(edge, index, pathNodeIds));

  return plan as PlanContract;
}

export function validateScenarioContract(value: unknown): ScenarioContract {
  const scenario = requireRecord(value, "scenario");

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
  requireUnique("room load ids", roomLoadIds, roomLoads.length);

  return scenario as ScenarioContract;
}

function validateUnits(value: unknown): UnitSettings {
  const units = requireRecord(value, "units");
  requireLiteral(units.unit, "feet", "units.unit");
  requirePositiveNumber(units.pixelsPerUnit, "units.pixelsPerUnit");
  requirePositiveNumber(units.gridSizeUnits, "units.gridSizeUnits");
  requireLiteral(units.origin, "top-left", "units.origin");
  return units as UnitSettings;
}

function validateRoom(value: unknown, index: number, zoneIds: Set<string>): Room {
  const room = requireRecord(value, `rooms[${index}]`);
  requireString(room.id, `rooms[${index}].id`);
  requireString(room.label, `rooms[${index}].label`);
  requireNumber(room.x, `rooms[${index}].x`);
  requireNumber(room.y, `rooms[${index}].y`);
  requirePositiveNumber(room.width, `rooms[${index}].width`);
  requirePositiveNumber(room.height, `rooms[${index}].height`);
  if (room.zoneId != null && !zoneIds.has(requireString(room.zoneId, `rooms[${index}].zoneId`))) {
    throw new Error(`rooms[${index}].zoneId references an unknown zone`);
  }
  return room as Room;
}

function validateHallway(value: unknown, index: number): Hallway {
  const hallway = requireRecord(value, `hallways[${index}]`);
  requireString(hallway.id, `hallways[${index}].id`);
  const points = requireArray(hallway.points, `hallways[${index}].points`);
  if (points.length < 2) {
    throw new Error(`hallways[${index}].points requires at least two points`);
  }
  points.forEach((point, pointIndex) => validatePoint(point, `hallways[${index}].points[${pointIndex}]`));
  return hallway as Hallway;
}

function validateDoor(value: unknown, index: number, roomIds: Set<string>): Door {
  const door = requireRecord(value, `doors[${index}]`);
  requireString(door.id, `doors[${index}].id`);
  const roomId = requireString(door.roomId, `doors[${index}].roomId`);
  requireNumber(door.x, `doors[${index}].x`);
  requireNumber(door.y, `doors[${index}].y`);
  if (!roomIds.has(roomId)) {
    throw new Error(`doors[${index}].roomId references an unknown room`);
  }
  return door as Door;
}

function validateStation(value: unknown, index: number): Station {
  const station = requireRecord(value, `stations[${index}]`);
  requireString(station.id, `stations[${index}].id`);
  requireString(station.label, `stations[${index}].label`);
  requireNumber(station.x, `stations[${index}].x`);
  requireNumber(station.y, `stations[${index}].y`);
  return station as Station;
}

function validateZone(value: unknown, index: number): Zone {
  const zone = requireRecord(value, `zones[${index}]`);
  requireString(zone.id, `zones[${index}].id`);
  requireString(zone.label, `zones[${index}].label`);
  const color = requireString(zone.color, `zones[${index}].color`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error(`zones[${index}].color must be a hex color`);
  }
  return zone as Zone;
}

function validatePathNode(value: unknown, index: number): PathNode {
  const node = requireRecord(value, `pathNodes[${index}]`);
  requireString(node.id, `pathNodes[${index}].id`);
  requireNumber(node.x, `pathNodes[${index}].x`);
  requireNumber(node.y, `pathNodes[${index}].y`);
  return node as PathNode;
}

function validatePathEdge(value: unknown, index: number, pathNodeIds: Set<string>): PathEdge {
  const edge = requireRecord(value, `pathEdges[${index}]`);
  requireString(edge.id, `pathEdges[${index}].id`);
  const fromNodeId = requireString(edge.fromNodeId, `pathEdges[${index}].fromNodeId`);
  const toNodeId = requireString(edge.toNodeId, `pathEdges[${index}].toNodeId`);
  if (!pathNodeIds.has(fromNodeId) || !pathNodeIds.has(toNodeId)) {
    throw new Error(`pathEdges[${index}] references an unknown path node`);
  }
  if (edge.lengthUnits != null) {
    requirePositiveNumber(edge.lengthUnits, `pathEdges[${index}].lengthUnits`);
  }
  return edge as PathEdge;
}

function validateRoomLoad(value: unknown, index: number): RoomLoad {
  const roomLoad = requireRecord(value, `roomLoads[${index}]`);
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

function requireUnique(label: string, values: string[], expectedLength: number): void {
  if (new Set(values).size !== expectedLength) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
}
