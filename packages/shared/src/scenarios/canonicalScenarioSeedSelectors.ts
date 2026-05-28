import type { CanonicalCapacityCountReport } from "../floorplans/canonicalCapacityCountReport.js";
import {
  ADVANCED_EVIDENCE_FLOORPLAN_IDS,
  CANONICAL_SCENARIO_FLOORPLAN_ID,
  CANONICAL_SCENARIO_SEED_ID,
  CANONICAL_SCENARIO_SEED_SCHEMA_VERSION,
  type CanonicalScenarioSeedContract
} from "./canonicalScenarioSeedContract.js";

export type CanonicalScenarioSeedDependencyState = {
  capacityReport: CanonicalCapacityCountReport | null;
  splitBayBridgeReady: boolean;
  imageBackedReferenceProofReady: boolean;
};

export function isCanonicalScenarioFloorplanId(floorplanId: string): floorplanId is typeof CANONICAL_SCENARIO_FLOORPLAN_ID {
  return floorplanId === CANONICAL_SCENARIO_FLOORPLAN_ID;
}

export function isAdvancedEvidenceOnlyFloorplanId(
  floorplanId: string
): floorplanId is (typeof ADVANCED_EVIDENCE_FLOORPLAN_IDS)[number] {
  return ADVANCED_EVIDENCE_FLOORPLAN_IDS.includes(
    floorplanId as (typeof ADVANCED_EVIDENCE_FLOORPLAN_IDS)[number]
  );
}

export function assertCanonicalScenarioFloorplanId(floorplanId: string): typeof CANONICAL_SCENARIO_FLOORPLAN_ID {
  if (!isCanonicalScenarioFloorplanId(floorplanId)) {
    throw new Error("scenario seed accepts only canonical Plan 1 as the floorplan source");
  }
  return CANONICAL_SCENARIO_FLOORPLAN_ID;
}

export function assertCanonicalScenarioSeedDependencies(
  state: CanonicalScenarioSeedDependencyState
): CanonicalCapacityCountReport {
  if (state.capacityReport == null || state.capacityReport.canonicalFloorplanId !== CANONICAL_SCENARIO_FLOORPLAN_ID) {
    throw new Error("scenario seed requires the canonical capacity count report");
  }
  if (state.capacityReport.source !== "semantic_selectors") {
    throw new Error("scenario seed capacity counts must come from semantic selectors");
  }
  if (!state.splitBayBridgeReady) {
    throw new Error("scenario seed requires the split-bay fixture bridge");
  }
  if (!state.imageBackedReferenceProofReady) {
    throw new Error("scenario seed requires image-backed reference proof");
  }
  return state.capacityReport;
}

export function validateCanonicalScenarioSeedContract(
  seed: CanonicalScenarioSeedContract,
  dependencies: CanonicalScenarioSeedDependencyState
): CanonicalScenarioSeedContract {
  if (seed.schemaVersion !== CANONICAL_SCENARIO_SEED_SCHEMA_VERSION) {
    throw new Error("canonical scenario seed schema version is unsupported");
  }
  if (seed.scenarioSeedId !== CANONICAL_SCENARIO_SEED_ID) {
    throw new Error("canonical scenario seed ID is unsupported");
  }
  assertCanonicalScenarioFloorplanId(seed.canonicalFloorplanId);
  assertCanonicalScenarioSeedDependencies(dependencies);
  if (
    seed.usesCanonicalCapacityReport !== true ||
    seed.usesSplitBayFixtureBridge !== true ||
    seed.usesStorageRawFieldsForCounts !== false ||
    seed.plansTwoThroughFiveScenarioEligible !== false
  ) {
    throw new Error("canonical scenario seed dependency flags are invalid");
  }
  if (
    seed.fullShiftSimulationStatus !== "not_started" ||
    seed.optimizerStatus !== "not_started" ||
    seed.clinicalSafetyScoringStatus !== "not_started" ||
    seed.staffingComplianceStatus !== "not_started"
  ) {
    throw new Error("canonical scenario seed must remain foundation-only");
  }
  return seed;
}
