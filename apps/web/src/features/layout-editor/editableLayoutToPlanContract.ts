import {
  makeStalePathSyncWarning,
  validatePlanContract,
  type EditableLayoutGeometryContract,
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
  const roomGeometryById = new Map(editableLayout.rooms.map((room) => [room.id, room]));
  const stationGeometryById = new Map(editableLayout.stations.map((station) => [station.id, station]));
  const zoneGeometryById = new Map(editableLayout.zones.map((zone) => [zone.id, zone]));

  const plan = validatePlanContract({
    ...clonePlan(source),
    rooms: source.rooms.map((room) => {
      const geometry = roomGeometryById.get(room.id);
      if (geometry == null) {
        return room;
      }
      return {
        ...room,
        x: geometry.xFeet,
        y: geometry.yFeet,
        widthFeet: geometry.widthFeet,
        lengthFeet: geometry.heightFeet
      };
    }),
    nurseStations: source.nurseStations.map((station) => {
      const geometry = stationGeometryById.get(station.id);
      if (geometry == null) {
        return station;
      }
      return {
        ...station,
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
        x: geometry.xFeet,
        y: geometry.yFeet,
        widthFeet: geometry.widthFeet,
        lengthFeet: geometry.heightFeet
      };
    })
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

function clonePlan(plan: PlanContract): PlanContract {
  return JSON.parse(JSON.stringify(plan)) as PlanContract;
}
