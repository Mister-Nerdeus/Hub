import { OUTCOME_PLACEHOLDER_SET_ID } from "./outcomeMetricPlaceholderContract.js";
import {
  CANONICAL_ER_POD_FLOORPLAN_ID,
  SCENARIO_SEED_SCHEMA_VERSION,
  type ScenarioSeedContract
} from "./scenarioSeedContract.js";

export const fourToOneScenarioSeedFixture: ScenarioSeedContract = {
  schemaVersion: SCENARIO_SEED_SCHEMA_VERSION,
  scenarioSeedId: "scenario-seed-canonical-er-pod-4-to-1",
  scenarioName: "Canonical ER pod 4:1 configuration seed",
  canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
  ratioConfigurationId: "four_to_one",
  assignmentTemplateId: "assignment-template-canonical-er-pod-4-to-1",
  erActivityPresetId: "busy",
  patientLoadPatternId: "typical_load",
  acuityPatternId: "typical_load_acuity",
  outcomePlaceholderSetId: OUTCOME_PLACEHOLDER_SET_ID,
  syntheticDataOnly: true
};

export const threeToOneScenarioSeedFixture: ScenarioSeedContract = {
  schemaVersion: SCENARIO_SEED_SCHEMA_VERSION,
  scenarioSeedId: "scenario-seed-canonical-er-pod-3-to-1",
  scenarioName: "Canonical ER pod 3:1 configuration seed",
  canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
  ratioConfigurationId: "three_to_one",
  assignmentTemplateId: "assignment-template-canonical-er-pod-3-to-1",
  erActivityPresetId: "busy",
  patientLoadPatternId: "typical_load",
  acuityPatternId: "typical_load_acuity",
  outcomePlaceholderSetId: OUTCOME_PLACEHOLDER_SET_ID,
  syntheticDataOnly: true
};

export const scenarioSeedFixtures = [
  fourToOneScenarioSeedFixture,
  threeToOneScenarioSeedFixture
] as const;
