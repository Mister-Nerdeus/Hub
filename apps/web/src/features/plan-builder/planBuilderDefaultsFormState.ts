import {
  validatePlanBuilderDefaultsContract,
  type DoorWall,
  type EdgeLengthStrategy,
  type PlanBuilderDefaultsContract,
  type RoomType,
  type StationPlacementMode,
  type StationType,
  type ZoneType
} from "@nerdeus/shared";

import type { PlanBuilderValidationResult } from "./planBuilderValidation";

export type PlanBuilderDefaultsFormState = {
  defaultsId: string;
  name: string;
  description: string;
  planName: string;
  planDescription: string;
  pixelsPerFoot: string;
  gridSizeFeet: string;
  snapToGrid: boolean;
  originX: string;
  originY: string;
  roomCount: string;
  roomsPerRow: string;
  defaultRoomWidthFeet: string;
  defaultRoomLengthFeet: string;
  roomSpacingFeet: string;
  roomLabelPrefix: string;
  defaultRoomType: RoomType;
  defaultMaxPatients: string;
  defaultTraumaCapable: boolean;
  defaultIsolationCapable: boolean;
  startX: string;
  startY: string;
  autoCreateDoors: boolean;
  defaultDoorWidthFeet: string;
  doorWall: DoorWall;
  doorOffsetFeet: string;
  doorPenaltySeconds: string;
  autoCreateDoorPathNodes: boolean;
  defaultHallwayWidthFeet: string;
  mainHallwayLengthFeet: string;
  mainHallwayStartX: string;
  mainHallwayStartY: string;
  congestionFactor: string;
  defaultBlocked: boolean;
  nurseStationCount: string;
  defaultStationWidthFeet: string;
  defaultStationLengthFeet: string;
  stationType: StationType;
  stationPlacementMode: StationPlacementMode;
  autoCreateStationPathNodes: boolean;
  autoCreatePathEdges: boolean;
  autoConnectRoomsToHallway: boolean;
  defaultEdgeLengthStrategy: EdgeLengthStrategy;
  defaultHallwayEdgeWidthFeet: string;
  defaultCongestionFactor: string;
  defaultTurnPenaltySeconds: string;
  pathGraphDefaultBlocked: boolean;
  createDefaultZone: boolean;
  defaultZoneLabel: string;
  defaultZoneType: ZoneType;
  defaultZoneTravelBlocked: boolean;
  defaultZoneTravelPenalty: string;
};

export function createDefaultPlanBuilderDefaultsFormState(): PlanBuilderDefaultsFormState {
  return {
    defaultsId: "plan-builder-defaults-basic",
    name: "Basic ER Pod Defaults",
    description: "Synthetic operational plan-builder defaults.",
    planName: "Generated ER Pod",
    planDescription: "Synthetic generated operational layout.",
    pixelsPerFoot: "10",
    gridSizeFeet: "1",
    snapToGrid: true,
    originX: "0",
    originY: "0",
    roomCount: "6",
    roomsPerRow: "3",
    defaultRoomWidthFeet: "12",
    defaultRoomLengthFeet: "10",
    roomSpacingFeet: "2",
    roomLabelPrefix: "Room",
    defaultRoomType: "standard",
    defaultMaxPatients: "1",
    defaultTraumaCapable: false,
    defaultIsolationCapable: false,
    startX: "0",
    startY: "0",
    autoCreateDoors: true,
    defaultDoorWidthFeet: "3",
    doorWall: "bottom",
    doorOffsetFeet: "4",
    doorPenaltySeconds: "4",
    autoCreateDoorPathNodes: true,
    defaultHallwayWidthFeet: "8",
    mainHallwayLengthFeet: "48",
    mainHallwayStartX: "0",
    mainHallwayStartY: "26",
    congestionFactor: "1",
    defaultBlocked: false,
    nurseStationCount: "1",
    defaultStationWidthFeet: "10",
    defaultStationLengthFeet: "6",
    stationType: "primary",
    stationPlacementMode: "centered_on_hallway",
    autoCreateStationPathNodes: true,
    autoCreatePathEdges: true,
    autoConnectRoomsToHallway: true,
    defaultEdgeLengthStrategy: "manhattan",
    defaultHallwayEdgeWidthFeet: "8",
    defaultCongestionFactor: "1",
    defaultTurnPenaltySeconds: "2",
    pathGraphDefaultBlocked: false,
    createDefaultZone: true,
    defaultZoneLabel: "Default Pod Zone",
    defaultZoneType: "provider_area",
    defaultZoneTravelBlocked: false,
    defaultZoneTravelPenalty: "1"
  };
}

export function updatePlanBuilderDefaultsFormState<K extends keyof PlanBuilderDefaultsFormState>(
  state: PlanBuilderDefaultsFormState,
  key: K,
  value: PlanBuilderDefaultsFormState[K]
): PlanBuilderDefaultsFormState {
  return { ...state, [key]: value };
}

export function planBuilderDefaultsFormStateToContract(
  state: PlanBuilderDefaultsFormState
): PlanBuilderValidationResult<PlanBuilderDefaultsContract> {
  try {
    return { ok: true, value: validatePlanBuilderDefaultsContract(buildDefaults(state)), error: null };
  } catch (error) {
    return {
      ok: false,
      value: null,
      error: error instanceof Error ? error.message : "Invalid plan builder defaults."
    };
  }
}

export function buildDefaults(state: PlanBuilderDefaultsFormState): PlanBuilderDefaultsContract {
  return {
    schemaVersion: "1.0.0",
    defaultsId: state.defaultsId,
    name: state.name,
    description: state.description.length === 0 ? null : state.description,
    createdAt: "2026-05-23T00:00:00Z",
    updatedAt: "2026-05-23T00:00:00Z",
    planSetup: {
      planName: state.planName,
      planDescription: state.planDescription.length === 0 ? null : state.planDescription,
      pixelsPerFoot: numberValue(state.pixelsPerFoot),
      gridSizeFeet: numberValue(state.gridSizeFeet),
      snapToGrid: state.snapToGrid,
      originX: numberValue(state.originX),
      originY: numberValue(state.originY)
    },
    roomDefaults: {
      roomCount: integerValue(state.roomCount),
      roomsPerRow: integerValue(state.roomsPerRow),
      defaultRoomWidthFeet: numberValue(state.defaultRoomWidthFeet),
      defaultRoomLengthFeet: numberValue(state.defaultRoomLengthFeet),
      roomSpacingFeet: numberValue(state.roomSpacingFeet),
      roomLabelPrefix: state.roomLabelPrefix,
      defaultRoomType: state.defaultRoomType,
      defaultMaxPatients: integerValue(state.defaultMaxPatients),
      defaultTraumaCapable: state.defaultTraumaCapable,
      defaultIsolationCapable: state.defaultIsolationCapable,
      startX: numberValue(state.startX),
      startY: numberValue(state.startY)
    },
    hallwayDefaults: {
      defaultHallwayWidthFeet: numberValue(state.defaultHallwayWidthFeet),
      mainHallwayLengthFeet: numberValue(state.mainHallwayLengthFeet),
      mainHallwayStartX: numberValue(state.mainHallwayStartX),
      mainHallwayStartY: numberValue(state.mainHallwayStartY),
      congestionFactor: numberValue(state.congestionFactor),
      defaultBlocked: state.defaultBlocked
    },
    doorDefaults: {
      autoCreateDoors: state.autoCreateDoors,
      defaultDoorWidthFeet: numberValue(state.defaultDoorWidthFeet),
      doorWall: state.doorWall,
      doorOffsetFeet: numberValue(state.doorOffsetFeet),
      doorPenaltySeconds: numberValue(state.doorPenaltySeconds),
      autoCreateDoorPathNodes: state.autoCreateDoorPathNodes
    },
    nurseStationDefaults: {
      nurseStationCount: integerValue(state.nurseStationCount),
      defaultStationWidthFeet: numberValue(state.defaultStationWidthFeet),
      defaultStationLengthFeet: numberValue(state.defaultStationLengthFeet),
      stationType: state.stationType,
      stationPlacementMode: state.stationPlacementMode,
      autoCreateStationPathNodes: state.autoCreateStationPathNodes
    },
    pathGraphDefaults: {
      autoCreatePathEdges: state.autoCreatePathEdges,
      autoConnectRoomsToHallway: state.autoConnectRoomsToHallway,
      defaultEdgeLengthStrategy: state.defaultEdgeLengthStrategy,
      defaultHallwayEdgeWidthFeet: numberValue(state.defaultHallwayEdgeWidthFeet),
      defaultCongestionFactor: numberValue(state.defaultCongestionFactor),
      defaultTurnPenaltySeconds: numberValue(state.defaultTurnPenaltySeconds),
      defaultBlocked: state.pathGraphDefaultBlocked
    },
    zoneDefaults: {
      createDefaultZone: state.createDefaultZone,
      defaultZoneLabel: state.defaultZoneLabel,
      defaultZoneType: state.defaultZoneType,
      defaultZoneTravelBlocked: state.defaultZoneTravelBlocked,
      defaultZoneTravelPenalty:
        state.defaultZoneTravelPenalty.length === 0
          ? null
          : numberValue(state.defaultZoneTravelPenalty)
    }
  };
}

function numberValue(value: string): number {
  return Number(value);
}

function integerValue(value: string): number {
  return Number(value);
}
