import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDryRunComparisonProof,
  buildRoomLoadStarterContract,
  buildScenarioCapacityIntegration,
  createDeterministicRatioRuntimeSequence,
  createDeterministicWorkloadSequence,
  dryRunTaskTemplates,
  fourToOneRuntimeSeedContract,
  generateDryRunTaskInstances,
  neutralWorkloadSeedContract,
  threeToOneRuntimeSeedContract,
  typicalActivityProfile,
  validateDryRunComparisonProof,
  validateNeutralWorkloadSeedContract,
  validateRatioRuntimeSeedContract
} from "../dist/index.js";

test("neutral workload seed validates as ratio-neutral", () => {
  const seed = validateNeutralWorkloadSeedContract(neutralWorkloadSeedContract);

  assert.equal(seed.seedId, "neutral-workload-seed-canonical-plan-1");
  assert.equal(seed.ratioPresetBinding, "ratio_neutral");
  assert.equal(seed.hiddenRandomnessStatus, "forbidden");
  assert.equal(seed.currentTimeDependencyStatus, "forbidden");
});

test("same neutral workload seed yields the same workload for both ratio views", () => {
  const capacity = buildScenarioCapacityIntegration();
  const roomLoad = buildRoomLoadStarterContract(capacity, 4);
  const input = {
    roomLoad,
    activityProfile: typicalActivityProfile,
    seedContract: neutralWorkloadSeedContract,
    templates: dryRunTaskTemplates,
    capacity
  };

  const fourToOneWorkload = generateDryRunTaskInstances(input);
  const threeToOneWorkload = generateDryRunTaskInstances(input);

  assert.deepEqual(fourToOneWorkload.instances, threeToOneWorkload.instances);
  assert.equal(fourToOneWorkload.deterministicSeedId, "neutral-workload-seed-canonical-plan-1");
});

test("ratio runtime seeds are distinct and deterministic", () => {
  const fourSeed = validateRatioRuntimeSeedContract(fourToOneRuntimeSeedContract);
  const threeSeed = validateRatioRuntimeSeedContract(threeToOneRuntimeSeedContract);
  const fourFirst = createDeterministicRatioRuntimeSequence(fourSeed, "runtime-proof", 8);
  const fourSecond = createDeterministicRatioRuntimeSequence(fourSeed, "runtime-proof", 8);
  const three = createDeterministicRatioRuntimeSequence(threeSeed, "runtime-proof", 8);

  assert.equal(fourSeed.ratioPresetId, "four_to_one");
  assert.equal(threeSeed.ratioPresetId, "three_to_one");
  assert.notEqual(fourSeed.seedId, threeSeed.seedId);
  assert.deepEqual(fourFirst, fourSecond);
  assert.notDeepEqual(fourFirst, three);
});

test("workload namespace does not include ratio material", () => {
  const first = createDeterministicWorkloadSequence(
    neutralWorkloadSeedContract,
    "shared-workload-proof",
    8
  );
  const second = createDeterministicWorkloadSequence(
    neutralWorkloadSeedContract,
    "shared-workload-proof",
    8
  );

  assert.deepEqual(first, second);
});

test("dry-run comparison proof uses neutral workload and ratio-specific runtime seeds", () => {
  const proof = validateDryRunComparisonProof(buildDryRunComparisonProof());
  const [four, three] = proof.runs;

  assert.equal(proof.sharedInputs.sharedWorkloadGeneration, "ratio_neutral");
  assert.equal(four.neutralWorkloadSeedId, three.neutralWorkloadSeedId);
  assert.notEqual(four.ratioRuntimeSeedId, three.ratioRuntimeSeedId);
});
