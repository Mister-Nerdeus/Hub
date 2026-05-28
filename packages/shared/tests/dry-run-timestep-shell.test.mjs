import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDryRunTimesteps,
  dryRunTimestepContract,
  validateDryRunTimestepContract
} from "../dist/index.js";

test("dry-run timestep shell contract validates", () => {
  const contract = validateDryRunTimestepContract(dryRunTimestepContract);

  assert.equal(contract.timestepContractId, "dry-run-timestep-shell-canonical-plan-1");
  assert.equal(contract.syntheticDataOnly, true);
  assert.equal(contract.realTimeAccuracyClaim, false);
});

test("dry-run timestep shell has a bounded window", () => {
  assert.throws(
    () =>
      validateDryRunTimestepContract({
        ...dryRunTimestepContract,
        maxDurationMinutes: 30
      }),
    /bounded/
  );
});

test("dry-run timesteps are deterministic ordered synthetic offsets", () => {
  const first = buildDryRunTimesteps(dryRunTimestepContract);
  const second = buildDryRunTimesteps(dryRunTimestepContract);

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.slice(0, 4).map((tick) => [tick.tickIndex, tick.syntheticMinuteOffset]),
    [
      [0, 0],
      [1, 15],
      [2, 30],
      [3, 45]
    ]
  );
  assert.ok(first.every((tick) => tick.dryRunStatus === "internal_dry_run_shell_only"));
});

test("dry-run timestep shell rejects real-time or clinical timing claims", () => {
  assert.throws(
    () =>
      validateDryRunTimestepContract({
        ...dryRunTimestepContract,
        realTimeAccuracyClaim: true
      }),
    /realTimeAccuracyClaim/
  );
  assert.throws(
    () =>
      validateDryRunTimestepContract({
        ...dryRunTimestepContract,
        clinicalTimingClaim: true
      }),
    /clinicalTimingClaim/
  );
});
