import {
  authoringRoomTypeToPlanRoomType,
  editableRoomTypeToAuthoringRoomType,
  makeStalePathSyncWarning,
  validatePlanContract,
  type EditableDoorGeometry,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry,
  type PlanContract,
  type Plan1StalePathSyncWarning
} from "@nerdeus/shared";

export type EditableLayoutToPlanContractInput = {
  sourcePlan: PlanContract;
  editableLayout: EditableLayoutGeometryContract;
};

export type EditableLayoutToPlanContractResult = {
  plan: PlanContract;
  deferredSync: {
    doors: "preserved_from_source_plan";
    pathNodes: "preserved_from_source_plan";
    pathEdges: "preserved_from_source_plan";
  };
  routingWarning: Plan1StalePathSyncWarning;
};

export function editableLayoutToPlanContract({
  sourcePlan,
  editableLayout
}: EditableLayoutToPlanContractInput): EditableLayoutToPlanContractResult {
  const source = validatePlanContract(sourcePlan);
  const stationGeometryById = new Map(editableLayout.stations.map((station) => [station.id, station]));
  const zoneGeometryById = new Map(editableLayout.zones.map((zone) => [zone.id, zone]));
  const sourceRoomsById = new Map(source.rooms.map((room) => [room.id, room]));
  const sourceDoorsById = new Map(source.doors.map((door) => [door.id, door]));
  const sourceHallwaysById = new Map(source.hallways.map((hallway) => [hallway.id, hallway]));
  const rooms = editableLayout.rooms.map((geometry) => {
    const room = sourceRoomsById.get(geometry.id);
    return room == null
        ? editableRoomToPlanRoom(geometry)
        : {
            ...room,
            label: geometry.label,
            roomType: editableRoomToPlanRoomType(geometry),
            traumaCapable: geometry.roomType === "trauma",
            x: geometry.xFeet,
            y: geometry.yFeet,
            widthFeet: geometry.widthFeet,
            lengthFeet: geometry.heightFeet,
            roomOperationalMetadata:
              room.roomOperationalMetadata == null
                ? room.roomOperationalMetadata
                : {
                    ...room.roomOperationalMetadata,
                    roomNumber: geometry.roomNumber
                  }
          };
  });
  const doors = editableLayout.doors.map((door) => {
    const sourceDoor = sourceDoorsById.get(door.id);
    const projected = editableDoorToPlanDoor(door, editableLayout);
    return sourceDoor == null
      ? projected
      : {
          ...sourceDoor,
          roomId: projected.roomId,
          x: projected.x,
          y: projected.y,
          widthFeet: projected.widthFeet
        };
  });
  const doorIds = new Set(doors.map((door) => door.id));
  const pathNodes = source.pathNodes.filter((node) => {
    if (node.nodeType !== "room_door" || node.linkedObjectId == null) {
      return true;
    }
    return doorIds.has(node.linkedObjectId);
  });
  const pathNodeIds = new Set(pathNodes.map((node) => node.id));

  const plan = validatePlanContract({
    ...clonePlan(source),
    rooms: rooms.map((room) =>
      room.pathNodeId != null && !pathNodeIds.has(room.pathNodeId)
        ? { ...room, pathNodeId: null }
        : room
    ),
    doors: doors.map((door) =>
      door.pathNodeId != null && !pathNodeIds.has(door.pathNodeId)
        ? { ...door, pathNodeId: null }
        : door
    ),
    supportAccessPoints: editableLayout.supportAccessPoints ?? [],
    hallways: editableLayout.hallways.map((hallway) => {
      const sourceHallway = sourceHallwaysById.get(hallway.id);
      const points = [
        { x: hallway.xFeet, y: hallway.yFeet },
        { x: hallway.xFeet + hallway.widthFeet, y: hallway.yFeet },
        { x: hallway.xFeet + hallway.widthFeet, y: hallway.yFeet + hallway.heightFeet },
        { x: hallway.xFeet, y: hallway.yFeet + hallway.heightFeet }
      ];
      return sourceHallway == null
        ? {
            id: hallway.id,
            label: hallway.label,
            widthFeet: Math.min(hallway.widthFeet, hallway.heightFeet),
            points,
            hallwayOperationalMetadata: hallway.id.startsWith("generated-hallway-")
              ? generatedHallwayOperationalMetadata()
              : null
          }
        : {
            ...sourceHallway,
            label: hallway.label,
            widthFeet: Math.min(hallway.widthFeet, hallway.heightFeet),
            points
          };
    }),
    nurseStations: source.nurseStations.map((station) => {
      const geometry = stationGeometryById.get(station.id);
      if (geometry == null) {
        return station;
      }
      return {
        ...station,
        label: geometry.label,
        x: geometry.xFeet,
        y: geometry.yFeet,
        widthFeet: geometry.widthFeet,
        lengthFeet: geometry.heightFeet
      };
    }),
    zones: source.zones.map((zone) => {
      const geometry = zoneGeometryById.get(zone.id);
      if (geometry == null) {
        return zone;
      }
      return {
        ...zone,
        label: geometry.label,
        x: geometry.xFeet,
        y: geometry.yFeet,
        widthFeet: geometry.widthFeet,
        lengthFeet: geometry.heightFeet
      };
    }),
    perimeterWalls: editableLayout.perimeterWalls ?? [],
    entryExits: editableLayout.entryExits ?? [],
    doorDestinations: editableLayout.doorDestinations ?? [],
    splitRooms: editableLayout.splitRooms ?? [],
    splitBays: editableLayout.splitBays ?? [],
    pathNodes,
    pathEdges: source.pathEdges.filter(
      (edge) => pathNodeIds.has(edge.fromNodeId) && pathNodeIds.has(edge.toNodeId)
    )
  });

  return {
    plan,
    deferredSync: {
      doors: "preserved_from_source_plan",
      pathNodes: "preserved_from_source_plan",
      pathEdges: "preserved_from_source_plan"
    },
    routingWarning: makeStalePathSyncWarning()
  };
}

function generatedHallwayOperationalMetadata(): NonNullable<PlanContract["hallways"][number]["hallwayOperationalMetadata"]> {
  return {
    hallwayClass: "side",
    allowsBedMovement: false,
    allowsPublicTraffic: true,
    staffOnly: false,
    congestionLevel: "moderate",
    bottleneck: false,
    throughRoute: true
  };
}

function editableRoomToPlanRoom(room: EditableRoomGeometry): PlanContract["rooms"][number] {
  const roomType = editableRoomToPlanRoomType(room);
  return {
    id: room.id,
    label: room.label,
    roomType,
    x: room.xFeet,
    y: room.yFeet,
    widthFeet: room.widthFeet,
    lengthFeet: room.heightFeet,
    maxPatients: room.capacityType === "double" ? 2 : 1,
    traumaCapable: roomType === "trauma",
    isolationCapable: roomType === "isolation",
    doorPoint: null,
    zoneId: null,
    nearestStationId: null,
    pathNodeId: null,
    roomOperationalMetadata: null,
    overflowOperationalMetadata: null,
    adjacencyOperationalMetadata: null
  };
}

function editableRoomToPlanRoomType(room: EditableRoomGeometry): PlanContract["rooms"][number]["roomType"] {
  return authoringRoomTypeToPlanRoomType(editableRoomTypeToAuthoringRoomType(room.roomType));
}

function editableDoorToPlanDoor(
  door: EditableDoorGeometry,
  layout: EditableLayoutGeometryContract
): PlanContract["doors"][number] {
  const room = layout.rooms.find((candidate) => candidate.id === door.ownerId);
  if (room == null) {
    throw new Error(`door ${door.id} owner must reference an exported room`);
  }
  const position = doorPositionFeet(door, room);
  return {
    id: door.id,
    label: door.label,
    roomId: door.ownerId,
    x: position.x,
    y: position.y,
    widthFeet: door.widthFeet,
    pathNodeId: null,
    doorOperationalMetadata: null
  };
}

function doorPositionFeet(
  door: EditableDoorGeometry,
  room: EditableRoomGeometry
): { x: number; y: number } {
  switch (door.wall) {
    case "north":
      return { x: room.xFeet + door.offsetFeet + door.widthFeet / 2, y: room.yFeet };
    case "south":
      return { x: room.xFeet + door.offsetFeet + door.widthFeet / 2, y: room.yFeet + room.heightFeet };
    case "east":
      return { x: room.xFeet + room.widthFeet, y: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
    case "west":
      return { x: room.xFeet, y: room.yFeet + door.offsetFeet + door.widthFeet / 2 };
  }
}

function clonePlan(plan: PlanContract): PlanContract {
  return JSON.parse(JSON.stringify(plan)) as PlanContract;
}
