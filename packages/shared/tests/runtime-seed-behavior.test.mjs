import assert from "node:assert/strict";
import test from "node:test";

import {
  executeInternalDryRun,
  fourToOneRatioPreset,
  fourToOneRuntimeSeedContract
} from "../dist/index.js";

function changedRuntimeSeed() {
  return {
    ...fourToOneRuntimeSeedContract,
    seedValue: `${fourToOneRuntimeSeedContract.seedValue}-changed`
  };
}

test("runtime seed preserves neutral workload task ids", () => {
  const base = executeInternalDryRun({
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: fourToOneRuntimeSeedContract
  });
  const changed = executeInternalDryRun({
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: changedRuntimeSeed()
  });

  assert.deepEqual(
    base.taskSet.instances.map((task) => task.taskInstanceId),
    changed.taskSet.instances.map((task) => task.taskInstanceId)
  );
});

test("runtime seed changes operational runtime fields", () => {
  const base = executeInternalDryRun({
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: fourToOneRuntimeSeedContract
  });
  const changed = executeInternalDryRun({
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: changedRuntimeSeed()
  });
  const baseStarted = startedMinutesByTask(base);
  const changedStarted = startedMinutesByTask(changed);
  const startMinuteChanged = Object.keys(baseStarted).some(
    (taskId) => baseStarted[taskId] !== changedStarted[taskId]
  );
  const nurseProcessingOrderChanged = JSON.stringify(nurseProcessingOrder(base)) !== JSON.stringify(nurseProcessingOrder(changed));

  assert.equal(startMinuteChanged || nurseProcessingOrderChanged, true);
});

test("runtime seed path emits no prohibited claims", () => {
  const run = executeInternalDryRun({
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: fourToOneRuntimeSeedContract
  });

  assert.equal(run.optimizerStatus, "not_started");
  assert.equal(run.assignmentRecommendationStatus, "not_started");
  assert.equal(run.clinicalSafetyClaim, false);
  assert.equal(run.staffingComplianceClaim, false);
  assert.equal(run.patientOutcomePredictionClaim, false);
});

function startedMinutesByTask(run) {
  return Object.fromEntries(
    run.timeline
      .filter((event) => event.eventLabel === "task_placeholder_started")
      .map((event) => [event.taskInstanceId, event.syntheticMinuteOffset])
  );
}

function nurseProcessingOrder(run) {
  return run.nurseRuntimeSnapshots.map((snapshot) => [
    snapshot.syntheticNurseId,
    snapshot.activePlaceholderTaskIds
  ]);
}
