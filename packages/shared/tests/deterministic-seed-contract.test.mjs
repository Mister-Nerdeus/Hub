import assert from "node:assert/strict";
import test from "node:test";

import {
  createDeterministicDryRunSequence,
  deterministicDryRunSeedContract,
  stableDryRunHash,
  validateDeterministicDryRunSeedContract
} from "../dist/index.js";

test("deterministic dry-run seed contract validates", () => {
  const contract = validateDeterministicDryRunSeedContract(deterministicDryRunSeedContract);

  assert.equal(contract.seedId, "deterministic-dry-run-seed-canonical-plan-1");
  assert.equal(contract.canonicalScenarioSeedId, "scenario-seed-canonical-plan-1-foundation");
  assert.equal(contract.syntheticDataOnly, true);
  assert.equal(contract.optimizerStatus, "not_started");
});

test("same seed input gives the same sequence", () => {
  assert.deepEqual(
    createDeterministicDryRunSequence(deterministicDryRunSeedContract, "task-order", 8),
    createDeterministicDryRunSequence(deterministicDryRunSeedContract, "task-order", 8)
  );
});

test("different seed value changes the sequence", () => {
  const changedSeed = {
    ...deterministicDryRunSeedContract,
    seedValue: "dry-run-seed-v0-canonical-plan-1-alt"
  };

  assert.notDeepEqual(
    createDeterministicDryRunSequence(deterministicDryRunSeedContract, "task-order", 8),
    createDeterministicDryRunSequence(changedSeed, "task-order", 8)
  );
});

test("activity profile and ratio preset are part of the seed binding", () => {
  const busy = { ...deterministicDryRunSeedContract, activityProfileId: "busy" };
  const threeToOne = { ...deterministicDryRunSeedContract, ratioPresetId: "three_to_one" };

  assert.notDeepEqual(
    createDeterministicDryRunSequence(deterministicDryRunSeedContract, "task-order", 8),
    createDeterministicDryRunSequence(busy, "task-order", 8)
  );
  assert.notDeepEqual(
    createDeterministicDryRunSequence(deterministicDryRunSeedContract, "task-order", 8),
    createDeterministicDryRunSequence(threeToOne, "task-order", 8)
  );
});

test("missing seed is rejected", () => {
  const missingSeed = { ...deterministicDryRunSeedContract };
  delete missingSeed.seedValue;

  assert.throws(() => validateDeterministicDryRunSeedContract(missingSeed), /seedValue/);
});

test("stable hash is deterministic and rejects empty input", () => {
  assert.equal(stableDryRunHash("same-input"), stableDryRunHash("same-input"));
  assert.notEqual(stableDryRunHash("same-input"), stableDryRunHash("different-input"));
  assert.throws(() => stableDryRunHash(""), /non-empty/);
});
