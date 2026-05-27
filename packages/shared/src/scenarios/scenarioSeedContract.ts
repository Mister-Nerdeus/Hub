import type { AcuityPatternId } from "./acuityPatternContract.js";
import type { ErActivityPresetId } from "./erActivityPresetContract.js";
import type { NurseRatioId } from "./nurseRatioContract.js";
import type { OutcomeMetricPlaceholderSet } from "./outcomeMetricPlaceholderContract.js";
import type { PatientLoadPatternId } from "./patientLoadPatternContract.js";
import type { PlanContract } from "../contracts.js";
import { summarizeRoomLoadEligibility } from "./roomLoadValidation.js";

export const SCENARIO_SEED_SCHEMA_VERSION = "1.0.0" as const;
export const CANONICAL_ER_POD_FLOORPLAN_ID = "default-er-layout-plan-1" as const;

export type ScenarioSeedContract = {
  schemaVersion: typeof SCENARIO_SEED_SCHEMA_VERSION;
  scenarioSeedId: string;
  scenarioName: string;
  canonicalFloorplanId: typeof CANONICAL_ER_POD_FLOORPLAN_ID;
  ratioConfigurationId: NurseRatioId;
  assignmentTemplateId: string;
  erActivityPresetId: ErActivityPresetId;
  patientLoadPatternId: PatientLoadPatternId;
  acuityPatternId: AcuityPatternId;
  outcomePlaceholderSetId: OutcomeMetricPlaceholderSet["outcomePlaceholderSetId"];
  syntheticDataOnly: true;
};

export function selectScenarioSeedRoomLoadRoomIds(plan: PlanContract): string[] {
  return summarizeRoomLoadEligibility(plan).eligibleRoomIds;
}
