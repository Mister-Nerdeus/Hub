import {
  type Door,
  type DoorGenerationDefaults,
  type Hallway,
  type HallwayGenerationDefaults,
  type NurseStation,
  type NurseStationGenerationDefaults,
  type PathEdge,
  type PathGraphGenerationDefaults,
  type PathNode,
  type PlanBuilderDefaultsContract,
  type PlanContract,
  type Point,
  type Room,
  type RoomGenerationDefaults,
  type Zone,
  type ZoneGenerationDefaults,
  validatePlanBuilderDefaultsContract,
  validatePlanContract
} from "../contracts.js";

const MAIN_HALLWAY_ID = "hallway-main";
const MAIN_HALLWAY_LABEL = "Main Hallway";
const MAIN_HALLWAY_START_NODE_ID = "node-hall-start";
const MAIN_HALLWAY_MID_NODE_ID = "node-hall-mid";
const MAIN_HALLWAY_END_NODE_ID = "node-hall-end";
const DEFAULT_ZONE_ID = "zone-default-pod";
const DEFAULT_ZONE_COLOR = "#4f8a67";

export type PlanGenerationSummary = {
  roomCount: number;
  hallwayCount: number;
  doorCount: number;
  nurseStationCount: number;
  zoneCount: number;
  pathNodeCount: number;
  pathEdgeCount: number;
};

export function generatePlanFromDefaults(defaults: PlanBuilderDefaultsContract): PlanContract {
  const validatedDefaults = validatePlanBuilderDefaultsContract(defaults);
  const hallways = generateHallways(validatedDefaults.hallwayDefaults);
  const mainHallway = hallways[0];
  if (mainHallway == null) {
    throw new Error("main hallway generation failed");
  }
  const rooms = generateRooms(validatedDefaults.roomDefaults, validatedDefaults.zoneDefaults);
  const doors = generateDoors(validatedDefaults.doorDefaults, rooms);
  const nurseStations = generateStations(
    validatedDefaults.nurseStationDefaults,
    validatedDefaults.hallwayDefaults,
    validatedDefaults.roomDefaults
  );
  const pathNodes = generatePathNodes(
    validatedDefaults.doorDefaults,
    doors,
    validatedDefaults.nurseStationDefaults,
    nurseStations,
    validatedDefaults.pathGraphDefaults,
    mainHallway
  );
  const linkedRooms = linkRooms(rooms, doors, pathNodes, nurseStations);
  const linkedDoors = linkDoors(doors, pathNodes);
  const linkedStations = linkStations(nurseStations, pathNodes);
  const zones = generateZones(
    validatedDefaults.zoneDefaults,
    mainHallway,
    linkedRooms,
    linkedStations
  );
  const pathEdges = generatePathEdges(
    validatedDefaults.pathGraphDefaults,
    linkedDoors,
    linkedStations,
    pathNodes,
    validatedDefaults.doorDefaults
  );

  return validatePlanContract({
    schemaVersion: "1.0.0",
    planId: validatedDefaults.defaultsId,
    name: validatedDefaults.planSetup.planName,
    description: validatedDefaults.planSetup.planDescription ?? validatedDefaults.description ?? null,
    createdAt: validatedDefaults.createdAt,
    updatedAt: validatedDefaults.updatedAt,
    scale: {
      unit: "feet",
      pixelsPerUnit: validatedDefaults.planSetup.pixelsPerFoot,
      gridSizeFeet: validatedDefaults.planSetup.gridSizeFeet,
      snapToGrid: validatedDefaults.planSetup.snapToGrid,
      origin: "top-left"
    },
    rooms: linkedRooms.map((room) => ({
      ...room,
      zoneId: zones[0]?.id ?? null
    })),
    hallways,
    doors: linkedDoors,
    nurseStations: linkedStations,
    zones,
    pathNodes,
    pathEdges
  });
}

export function buildPlanGenerationPreview(
  defaults: PlanBuilderDefaultsContract
): { plan: PlanContract; summary: PlanGenerationSummary } {
  const plan = generatePlanFromDefaults(defaults);
  return {
    plan,
    summary: {
      roomCount: plan.rooms.length,
      hallwayCount: plan.hallways.length,
      doorCount: plan.doors.length,
      nurseStationCount: plan.nurseStations.length,
      zoneCount: plan.zones.length,
      pathNodeCount: plan.pathNodes.length,
      pathEdgeCount: plan.pathEdges.length
    }
  };
}

function generateRooms(
  roomDefaults: RoomGenerationDefaults,
  zoneDefaults: ZoneGenerationDefaults
): Room[] {
  return Array.from({ length: roomDefaults.roomCount }, (_, index) => {
    const row = Math.floor(index / roomDefaults.roomsPerRow);
    const column = index % roomDefaults.roomsPerRow;
    return {
      id: `room-${formatSequenceId(index + 1)}`,
      label: `${roomDefaults.roomLabelPrefix} ${formatLabelIndex(index + 1)}`,
      roomType: roomDefaults.defaultRoomType,
      x: roomDefaults.startX + column * (roomDefaults.defaultRoomWidthFeet + roomDefaults.roomSpacingFeet),
      y: roomDefaults.startY + row * (roomDefaults.defaultRoomLengthFeet + roomDefaults.roomSpacingFeet),
      widthFeet: roomDefaults.defaultRoomWidthFeet,
      lengthFeet: roomDefaults.defaultRoomLengthFeet,
      maxPatients: roomDefaults.defaultMaxPatients,
      traumaCapable: roomDefaults.defaultTraumaCapable,
      isolationCapable: roomDefaults.defaultIsolationCapable,
      doorPoint: null,
      zoneId: zoneDefaults.createDefaultZone ? DEFAULT_ZONE_ID : null,
      nearestStationId: null,
      pathNodeId: null
    };
  });
}

function generateDoors(doorDefaults: DoorGenerationDefaults, rooms: Room[]): Door[] {
  if (!doorDefaults.autoCreateDoors) {
    return [];
  }

  return rooms.map((room) => {
    const point = calculateDoorCoordinates(room, doorDefaults);
    return {
      id: `door-${room.id}`,
      label: `Door ${room.label}`,
      roomId: room.id,
      x: point.x,
      y: point.y,
      widthFeet: doorDefaults.defaultDoorWidthFeet,
      pathNodeId: null
    };
  });
}

function generateHallways(hallwayDefaults: HallwayGenerationDefaults): Hallway[] {
  return [
    {
      id: MAIN_HALLWAY_ID,
      label: MAIN_HALLWAY_LABEL,
      widthFeet: hallwayDefaults.defaultHallwayWidthFeet,
      points: [
        { x: hallwayDefaults.mainHallwayStartX, y: hallwayDefaults.mainHallwayStartY },
        {
          x: hallwayDefaults.mainHallwayStartX + hallwayDefaults.mainHallwayLengthFeet,
          y: hallwayDefaults.mainHallwayStartY
        }
      ]
    }
  ];
}

function generateStations(
  stationDefaults: NurseStationGenerationDefaults,
  hallwayDefaults: HallwayGenerationDefaults,
  roomDefaults: RoomGenerationDefaults
): NurseStation[] {
  if (stationDefaults.nurseStationCount === 0) {
    return [];
  }

  const spacing = Math.max(roomDefaults.roomSpacingFeet, 1);
  const totalWidth =
    stationDefaults.nurseStationCount * stationDefaults.defaultStationWidthFeet +
    (stationDefaults.nurseStationCount - 1) * spacing;
  const hallwayStartX = hallwayDefaults.mainHallwayStartX;
  const hallwayEndX = hallwayDefaults.mainHallwayStartX + hallwayDefaults.mainHallwayLengthFeet;
  const baseX =
    stationDefaults.stationPlacementMode === "near_hallway_end"
      ? hallwayEndX - totalWidth
      : stationDefaults.stationPlacementMode === "centered_on_hallway"
        ? hallwayStartX + (hallwayDefaults.mainHallwayLengthFeet - totalWidth) / 2
        : hallwayStartX;

  return Array.from({ length: stationDefaults.nurseStationCount }, (_, index) => ({
    id: `station-${formatSequenceId(index + 1)}`,
    label: `Station ${formatLabelIndex(index + 1)}`,
    stationType: stationDefaults.stationType,
    x: baseX + index * (stationDefaults.defaultStationWidthFeet + spacing),
    y: hallwayDefaults.mainHallwayStartY + hallwayDefaults.defaultHallwayWidthFeet,
    widthFeet: stationDefaults.defaultStationWidthFeet,
    lengthFeet: stationDefaults.defaultStationLengthFeet,
    pathNodeId: `node-station-${formatSequenceId(index + 1)}`
  }));
}

function generatePathNodes(
  doorDefaults: DoorGenerationDefaults,
  doors: Door[],
  stationDefaults: NurseStationGenerationDefaults,
  stations: NurseStation[],
  pathGraphDefaults: PathGraphGenerationDefaults,
  hallway: Hallway
): PathNode[] {
  const nodes: PathNode[] = [];
  if (pathGraphDefaults.autoCreatePathEdges) {
    const start = hallway.points[0];
    const end = hallway.points[1];
    if (start == null || end == null) {
      throw new Error("main hallway requires start and end points");
    }
    nodes.push(
      hallwayNode(MAIN_HALLWAY_START_NODE_ID, start, hallway.id),
      hallwayNode(MAIN_HALLWAY_MID_NODE_ID, { x: start.x + (end.x - start.x) / 2, y: start.y }, hallway.id),
      hallwayNode(MAIN_HALLWAY_END_NODE_ID, end, hallway.id)
    );
  }

  if (doorDefaults.autoCreateDoorPathNodes) {
    nodes.push(
      ...doors.map((door) => ({
        id: `node-${door.id}`,
        nodeType: "room_door" as const,
        x: door.x,
        y: door.y,
        linkedObjectId: door.id
      }))
    );
  }

  if (stationDefaults.autoCreateStationPathNodes) {
    nodes.push(
      ...stations.map((station) => ({
        id: station.pathNodeId,
        nodeType: "station" as const,
        x: station.x + station.widthFeet / 2,
        y: station.y,
        linkedObjectId: station.id
      }))
    );
  }

  return nodes;
}

function linkRooms(rooms: Room[], doors: Door[], nodes: PathNode[], stations: NurseStation[]): Room[] {
  return rooms.map((room) => {
    const door = doors.find((candidate) => candidate.roomId === room.id);
    const pathNode = door == null ? null : nodes.find((node) => node.linkedObjectId === door.id) ?? null;
    return {
      ...room,
      doorPoint: door == null ? null : { x: door.x, y: door.y },
      nearestStationId: stations[0]?.id ?? null,
      pathNodeId: pathNode?.id ?? null
    };
  });
}

function linkDoors(doors: Door[], nodes: PathNode[]): Door[] {
  return doors.map((door) => ({
    ...door,
    pathNodeId: nodes.find((node) => node.linkedObjectId === door.id)?.id ?? null
  }));
}

function linkStations(stations: NurseStation[], nodes: PathNode[]): NurseStation[] {
  return stations.map((station) => {
    const node = nodes.find((candidate) => candidate.linkedObjectId === station.id);
    if (node == null) {
      return station;
    }
    return { ...station, pathNodeId: node.id };
  });
}

function generateZones(
  zoneDefaults: ZoneGenerationDefaults,
  hallway: Hallway,
  rooms: Room[],
  stations: NurseStation[]
): Zone[] {
  if (!zoneDefaults.createDefaultZone) {
    return [];
  }

  const bounds = [...rooms, ...stations].reduce(
    (acc, item) => ({
      minX: Math.min(acc.minX, item.x),
      minY: Math.min(acc.minY, item.y),
      maxX: Math.max(acc.maxX, item.x + item.widthFeet),
      maxY: Math.max(acc.maxY, item.y + item.lengthFeet)
    }),
    {
      minX: Math.min(hallway.points[0]?.x ?? 0, hallway.points[1]?.x ?? 0),
      minY: (hallway.points[0]?.y ?? 0) - hallway.widthFeet / 2,
      maxX: Math.max(hallway.points[0]?.x ?? 0, hallway.points[1]?.x ?? 0),
      maxY: (hallway.points[0]?.y ?? 0) + hallway.widthFeet / 2
    }
  );

  return [
    {
      id: DEFAULT_ZONE_ID,
      label: zoneDefaults.defaultZoneLabel,
      zoneType: zoneDefaults.defaultZoneType,
      color: DEFAULT_ZONE_COLOR,
      x: bounds.minX,
      y: bounds.minY,
      widthFeet: Math.max(1, bounds.maxX - bounds.minX),
      lengthFeet: Math.max(1, bounds.maxY - bounds.minY),
      travelBlocked: zoneDefaults.defaultZoneTravelBlocked,
      travelPenalty: zoneDefaults.defaultZoneTravelPenalty ?? null
    }
  ];
}

function generatePathEdges(
  pathGraphDefaults: PathGraphGenerationDefaults,
  doors: Door[],
  stations: NurseStation[],
  nodes: PathNode[],
  doorDefaults: DoorGenerationDefaults
): PathEdge[] {
  if (!pathGraphDefaults.autoCreatePathEdges) {
    return [];
  }

  const start = getNode(nodes, MAIN_HALLWAY_START_NODE_ID);
  const mid = getNode(nodes, MAIN_HALLWAY_MID_NODE_ID);
  const end = getNode(nodes, MAIN_HALLWAY_END_NODE_ID);
  const edges: PathEdge[] = [
    createEdge("edge-hall-start-mid", start, mid, pathGraphDefaults, 0),
    createEdge("edge-hall-mid-end", mid, end, pathGraphDefaults, 0)
  ];

  if (pathGraphDefaults.autoConnectRoomsToHallway) {
    for (const door of doors) {
      const roomNode = nodes.find((node) => node.id === door.pathNodeId);
      if (roomNode == null) {
        continue;
      }
      edges.push(
        createEdge(
          `edge-${door.roomId}-hall`,
          roomNode,
          chooseHallwayAnchor(roomNode, start, mid, end),
          pathGraphDefaults,
          doorDefaults.doorPenaltySeconds
        )
      );
    }
  }

  for (const station of stations) {
    const stationNode = nodes.find((node) => node.id === station.pathNodeId);
    if (stationNode == null) {
      continue;
    }
    edges.push(
      createEdge(
        `edge-${station.id}-hall`,
        stationNode,
        chooseHallwayAnchor(stationNode, start, mid, end),
        pathGraphDefaults,
        0
      )
    );
  }

  return edges;
}

function calculateDoorCoordinates(room: Room, doorDefaults: DoorGenerationDefaults): Point {
  const wallLength =
    doorDefaults.doorWall === "top" || doorDefaults.doorWall === "bottom"
      ? room.widthFeet
      : room.lengthFeet;
  if (doorDefaults.doorOffsetFeet + doorDefaults.defaultDoorWidthFeet > wallLength) {
    throw new Error(`door offset is outside room boundary for ${room.id}`);
  }

  if (doorDefaults.doorWall === "top") {
    return { x: room.x + doorDefaults.doorOffsetFeet, y: room.y };
  }
  if (doorDefaults.doorWall === "bottom") {
    return { x: room.x + doorDefaults.doorOffsetFeet, y: room.y + room.lengthFeet };
  }
  if (doorDefaults.doorWall === "left") {
    return { x: room.x, y: room.y + doorDefaults.doorOffsetFeet };
  }
  return { x: room.x + room.widthFeet, y: room.y + doorDefaults.doorOffsetFeet };
}

function hallwayNode(id: string, point: Point, hallwayId: string): PathNode {
  return {
    id,
    nodeType: "hallway",
    x: point.x,
    y: point.y,
    linkedObjectId: hallwayId
  };
}

function createEdge(
  id: string,
  fromNode: PathNode,
  toNode: PathNode,
  pathGraphDefaults: PathGraphGenerationDefaults,
  doorPenaltySeconds: number
): PathEdge {
  return {
    id,
    fromNodeId: fromNode.id,
    toNodeId: toNode.id,
    lengthFeet: edgeLength(fromNode, toNode, pathGraphDefaults.defaultEdgeLengthStrategy),
    hallwayWidthFeet: pathGraphDefaults.defaultHallwayEdgeWidthFeet,
    congestionFactor: pathGraphDefaults.defaultCongestionFactor,
    doorPenaltySeconds,
    turnPenaltySeconds: pathGraphDefaults.defaultTurnPenaltySeconds,
    blocked: pathGraphDefaults.defaultBlocked
  };
}

function edgeLength(fromNode: PathNode, toNode: PathNode, strategy: "manhattan" | "straight_line"): number {
  const xDistance = Math.abs(toNode.x - fromNode.x);
  const yDistance = Math.abs(toNode.y - fromNode.y);
  const length = strategy === "manhattan" ? xDistance + yDistance : Math.hypot(xDistance, yDistance);
  return Number(Math.max(0.000001, length).toFixed(6));
}

function chooseHallwayAnchor(node: PathNode, start: PathNode, mid: PathNode, end: PathNode): PathNode {
  const startDistance = Math.abs(node.x - start.x);
  const midDistance = Math.abs(node.x - mid.x);
  const endDistance = Math.abs(node.x - end.x);
  if (startDistance <= midDistance && startDistance <= endDistance) {
    return start;
  }
  if (endDistance <= midDistance) {
    return end;
  }
  return mid;
}

function getNode(nodes: PathNode[], id: string): PathNode {
  const node = nodes.find((candidate) => candidate.id === id);
  if (node == null) {
    throw new Error(`${id} is required when path edges are enabled`);
  }
  return node;
}

function formatSequenceId(value: number): string {
  return String(value).padStart(3, "0");
}

function formatLabelIndex(value: number): string {
  return String(value).padStart(2, "0");
}
