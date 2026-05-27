import type { NurseRatioId } from "./nurseRatioContract.js";
import type { CANONICAL_ER_POD_FLOORPLAN_ID } from "./scenarioSeedContract.js";

export const ASSIGNMENT_TEMPLATE_SCHEMA_VERSION = "1.0.0" as const;
export const CANONICAL_SCENARIO_ROOM_IDS = [
  "room-level-1-trauma",
  "room-02",
  "room-03",
  "room-04",
  "room-05",
  "room-06",
  "room-07",
  "room-08",
  "room-09",
  "room-10",
  "room-11",
  "room-12",
  "room-13",
  "room-14",
  "room-15",
  "room-16",
  "room-17",
  "room-19",
  "room-20",
  "room-21",
  "room-22",
  "room-23",
  "room-24"
] as const;

export type CanonicalScenarioRoomId = (typeof CANONICAL_SCENARIO_ROOM_IDS)[number];

export type AssignmentScenarioNurseGroup = {
  nurseGroupId: string;
  syntheticNurseLabel: string;
  roomIds: CanonicalScenarioRoomId[];
  syntheticDataOnly: true;
};

export type AssignmentScenarioTemplateContract = {
  schemaVersion: typeof ASSIGNMENT_TEMPLATE_SCHEMA_VERSION;
  assignmentTemplateId: string;
  label: string;
  canonicalFloorplanId: typeof CANONICAL_ER_POD_FLOORPLAN_ID;
  ratioConfigurationId: NurseRatioId;
  nurseGroups: AssignmentScenarioNurseGroup[];
  syntheticDataOnly: true;
};
