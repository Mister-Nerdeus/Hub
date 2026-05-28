import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCanonicalCapacityCountReport,
  fourToOneRatioPreset,
  threeToOneRatioPreset,
  validateRatioPresetContract,
  validateRatioPresetPair
} from "../dist/index.js";

test("4:1 ratio preset is a planning assumption", () => {
  const preset = validateRatioPresetContract(fourToOneRatioPreset, buildCanonicalCapacityCountReport());
  assert.equal(preset.patientsPerNurse, 4);
  assert.equal(preset.sourceNote, "synthetic planning assumption");
  assert.equal(preset.complianceClaim, false);
  assert.equal(preset.clinicalSafetyClaim, false);
  assert.equal(preset.usesRawRoomCount, false);
});

test("3:1 ratio preset shares canonical assumptions with 4:1", () => {
  const [fourToOne, threeToOne] = validateRatioPresetPair(
    fourToOneRatioPreset,
    threeToOneRatioPreset,
    buildCanonicalCapacityCountReport()
  );
  assert.equal(threeToOne.patientsPerNurse, 3);
  assert.equal(fourToOne.canonicalScenarioSeedId, threeToOne.canonicalScenarioSeedId);
  assert.equal(fourToOne.capacityReportReference, threeToOne.capacityReportReference);
});

test("ratio presets reject raw counts and claim flags", () => {
  const report = buildCanonicalCapacityCountReport();
  assert.throws(
    () => validateRatioPresetContract({ ...fourToOneRatioPreset, usesRawRoomCount: true }, report),
    /selector-driven/
  );
  assert.throws(
    () => validateRatioPresetContract({ ...fourToOneRatioPreset, complianceClaim: true }, report),
    /claims/
  );
  assert.throws(
    () => validateRatioPresetContract({ ...fourToOneRatioPreset, clinicalSafetyClaim: true }, report),
    /claims/
  );
});

