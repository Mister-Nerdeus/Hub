import type { CanonicalCapacityCountReport } from "../floorplans/canonicalCapacityCountReport.js";

export const CANONICAL_SCENARIO_SEED_SCHEMA_VERSION = "1.0.0" as const;
export const CANONICAL_SCENARIO_SEED_ID = "scenario-seed-canonical-plan-1-foundation" as const;
export const CANONICAL_SCENARIO_FLOORPLAN_ID = "default-er-layout-plan-1" as const;
export const ADVANCED_EVIDENCE_FLOORPLAN_IDS = [
  "default-er-layout-plan-2",
  "default-er-layout-plan-3",
  "default-er-layout-plan-4",
  "default-er-layout-plan-5"
] as const;

export type CanonicalScenarioSeedContract = {
  schemaVersion: typeof CANONICAL_SCENARIO_SEED_SCHEMA_VERSION;
  scenarioSeedId: typeof CANONICAL_SCENARIO_SEED_ID;
  canonicalFloorplanId: typeof CANONICAL_SCENARIO_FLOORPLAN_ID;
  floorplanRole: "canonical_plan_1_only";
  referenceImageStatus: "image_backed_reference_ready";
  referenceOverlayStatus: "overlay_parity_ready";
  scaleModule: "canonical_plan_1_scale";
  capacityReportReference: "docs/verification/canonical-capacity-count-report.json";
  splitBayBridgeReference: "packages/shared/src/floorplans/splitBayFixtureBridge.ts";
  storageSupportExclusionReference: "packages/shared/src/floorplans/storageRawFieldGuard.ts";
  selectorCountSource: CanonicalCapacityCountReport["source"];
  usesCanonicalCapacityReport: true;
  usesSplitBayFixtureBridge: true;
  usesStorageRawFieldsForCounts: false;
  plansTwoThroughFiveScenarioEligible: false;
  manualVisualReviewRequired: true;
  promotionStatus: "blocked";
  scenarioStatus: "foundation_contract_only";
  fullShiftSimulationStatus: "not_started";
  optimizerStatus: "not_started";
  clinicalSafetyScoringStatus: "not_started";
  staffingComplianceStatus: "not_started";
  syntheticDataOnly: true;
};

export const canonicalScenarioSeedContract: CanonicalScenarioSeedContract = {
  schemaVersion: CANONICAL_SCENARIO_SEED_SCHEMA_VERSION,
  scenarioSeedId: CANONICAL_SCENARIO_SEED_ID,
  canonicalFloorplanId: CANONICAL_SCENARIO_FLOORPLAN_ID,
  floorplanRole: "canonical_plan_1_only",
  referenceImageStatus: "image_backed_reference_ready",
  referenceOverlayStatus: "overlay_parity_ready",
  scaleModule: "canonical_plan_1_scale",
  capacityReportReference: "docs/verification/canonical-capacity-count-report.json",
  splitBayBridgeReference: "packages/shared/src/floorplans/splitBayFixtureBridge.ts",
  storageSupportExclusionReference: "packages/shared/src/floorplans/storageRawFieldGuard.ts",
  selectorCountSource: "semantic_selectors",
  usesCanonicalCapacityReport: true,
  usesSplitBayFixtureBridge: true,
  usesStorageRawFieldsForCounts: false,
  plansTwoThroughFiveScenarioEligible: false,
  manualVisualReviewRequired: true,
  promotionStatus: "blocked",
  scenarioStatus: "foundation_contract_only",
  fullShiftSimulationStatus: "not_started",
  optimizerStatus: "not_started",
  clinicalSafetyScoringStatus: "not_started",
  staffingComplianceStatus: "not_started",
  syntheticDataOnly: true
};

