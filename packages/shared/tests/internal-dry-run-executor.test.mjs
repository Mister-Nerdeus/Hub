import assert from "node:assert/strict";
import test from "node:test";

import {
  executeInternalDryRun,
  validateInternalDryRunExecutorOutput
} from "../dist/index.js";

test("internal dry-run executor produces one synthetic run", () => {
  const run = validateInternalDryRunExecutorOutput(executeInternalDryRun());

  assert.equal(run.schemaVersion, "1.0.0");
  assert.equal(run.canonicalFloorplanId, "default-er-layout-plan-1");
  assert.equal(run.neutralWorkloadSeedId, "neutral-workload-seed-canonical-plan-1");
  assert.equal(run.summaryCounts.generatedTaskCount, run.taskSet.instances.length);
  assert.ok(run.timeline.length > 0);
});

test("internal dry-run timeline is deterministic", () => {
  const first = executeInternalDryRun();
  const second = executeInternalDryRun();

  assert.deepEqual(first.timeline, second.timeline);
  assert.deepEqual(first.summaryCounts, second.summaryCounts);
});

test("internal dry-run events use placeholder labels only", () => {
  const run = executeInternalDryRun();
  const labels = new Set(run.timeline.map((event) => event.eventLabel));

  assert.ok(labels.has("task_placeholder_ready"));
  assert.ok(labels.has("task_placeholder_started"));
  assert.ok(labels.has("task_placeholder_completed"));
  assert.equal([...labels].every((label) => label.startsWith("task_placeholder_")), true);
});

test("full event contract remains dormant and no claim flags are emitted", () => {
  const run = executeInternalDryRun();

  assert.equal(run.dormantFullEventContractStatus, "dormant");
  assert.equal(run.optimizerStatus, "not_started");
  assert.equal(run.assignmentRecommendationStatus, "not_started");
  assert.equal(run.clinicalSafetyClaim, false);
  assert.equal(run.staffingComplianceClaim, false);
  assert.equal(run.patientOutcomePredictionClaim, false);
});
