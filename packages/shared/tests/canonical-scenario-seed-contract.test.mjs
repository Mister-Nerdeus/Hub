import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_SCENARIO_FLOORPLAN_ID,
  ADVANCED_EVIDENCE_FLOORPLAN_IDS,
  buildCanonicalCapacityCountReport,
  canonicalScenarioSeedContract,
  assertCanonicalScenarioFloorplanId,
  validateCanonicalScenarioSeedContract
} from "../dist/index.js";

test("canonical scenario seed accepts Plan 1 only", () => {
  const report = buildCanonicalCapacityCountReport();
  const seed = validateCanonicalScenarioSeedContract(canonicalScenarioSeedContract, {
    capacityReport: report,
    splitBayBridgeReady: true,
    imageBackedReferenceProofReady: true
  });
  assert.equal(seed.canonicalFloorplanId, CANONICAL_SCENARIO_FLOORPLAN_ID);
  assert.equal(seed.plansTwoThroughFiveScenarioEligible, false);
  assert.equal(seed.usesCanonicalCapacityReport, true);
  assert.equal(seed.usesSplitBayFixtureBridge, true);
});

test("Plans 2 through 5 are rejected for scenario seed source", () => {
  for (const floorplanId of ADVANCED_EVIDENCE_FLOORPLAN_IDS) {
    assert.throws(() => assertCanonicalScenarioFloorplanId(floorplanId), /Plan 1/);
  }
});

test("scenario seed rejects missing hardening dependencies", () => {
  const report = buildCanonicalCapacityCountReport();
  assert.throws(
    () => validateCanonicalScenarioSeedContract(canonicalScenarioSeedContract, {
      capacityReport: null,
      splitBayBridgeReady: true,
      imageBackedReferenceProofReady: true
    }),
    /capacity count report/
  );
  assert.throws(
    () => validateCanonicalScenarioSeedContract(canonicalScenarioSeedContract, {
      capacityReport: report,
      splitBayBridgeReady: false,
      imageBackedReferenceProofReady: true
    }),
    /split-bay fixture bridge/
  );
  assert.throws(
    () => validateCanonicalScenarioSeedContract(canonicalScenarioSeedContract, {
      capacityReport: report,
      splitBayBridgeReady: true,
      imageBackedReferenceProofReady: false
    }),
    /image-backed reference proof/
  );
});

