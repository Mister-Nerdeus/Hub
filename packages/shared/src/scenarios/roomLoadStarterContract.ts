import type { ScenarioCapacityIntegration } from "./scenarioCapacityIntegration.js";

export const ROOM_LOAD_STARTER_SCHEMA_VERSION = "1.0.0" as const;
export const ROOM_LOAD_OCCUPANCY_STATES = ["unoccupied", "occupied"] as const;
export const ROOM_LOAD_BANDS = ["placeholder_low", "placeholder_medium", "placeholder_high"] as const;
export type RoomLoadOccupancyState = (typeof ROOM_LOAD_OCCUPANCY_STATES)[number];
export type RoomLoadBand = (typeof ROOM_LOAD_BANDS)[number];

export type RoomLoadStarterEntry = {
  loadableBedPositionId: string;
  occupancyState: RoomLoadOccupancyState;
  acuityBandPlaceholder: RoomLoadBand;
  complexityBandPlaceholder: RoomLoadBand;
  supportNeedPlaceholder: RoomLoadBand;
  source: "synthetic planning input";
  fullShiftSimulationStatus: "not_started";
  syntheticDataOnly: true;
};

export type RoomLoadStarterContract = {
  schemaVersion: typeof ROOM_LOAD_STARTER_SCHEMA_VERSION;
  contractId: "room-load-starter-canonical-plan-1";
  canonicalScenarioSeedId: ScenarioCapacityIntegration["canonicalScenarioSeedId"];
  entries: readonly RoomLoadStarterEntry[];
  source: "synthetic planning input";
  fullShiftSimulationStatus: "not_started";
  patientOutcomeStatus: "not_started";
  clinicalSafetyScoringStatus: "not_started";
  syntheticDataOnly: true;
};

