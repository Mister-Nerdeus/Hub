import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManualAssignmentScenarioBridgeInput,
  buildNurseRuntimeStatesFromManualBridge,
  calculateRatioAwareQueuePlaceholder,
  fourToOneRatioPreset,
  fourToOneRuntimeSeedContract,
  threeToOneRatioPreset,
  threeToOneRuntimeSeedContract,
  validateRatioAwareQueuePlaceholderSummary
} from "../dist/index.js";

test("same synthetic workload produces ratio-aware queue outputs", async () => {
  const shared = await import("../dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const baseRun = shared.executeInternalDryRun({ capacity });
  const fourRuntimeStates = buildNurseRuntimeStatesFromManualBridge(
    buildManualAssignmentScenarioBridgeInput(capacity, fourToOneRatioPreset),
    { ratioPreset: fourToOneRatioPreset }
  );
  const threeRuntimeStates = buildNurseRuntimeStatesFromManualBridge(
    buildManualAssignmentScenarioBridgeInput(capacity, threeToOneRatioPreset),
    { ratioPreset: threeToOneRatioPreset }
  );
  const four = validateRatioAwareQueuePlaceholderSummary(
    calculateRatioAwareQueuePlaceholder({
      taskSet: baseRun.taskSet,
      runtimeStates: fourRuntimeStates,
      ratioPreset: fourToOneRatioPreset,
      ratioRuntimeSeed: fourToOneRuntimeSeedContract,
      capacity
    })
  );
  const three = validateRatioAwareQueuePlaceholderSummary(
    calculateRatioAwareQueuePlaceholder({
      taskSet: baseRun.taskSet,
      runtimeStates: threeRuntimeStates,
      ratioPreset: threeToOneRatioPreset,
      ratioRuntimeSeed: threeToOneRuntimeSeedContract,
      capacity
    })
  );

  assert.equal(four.generatedTaskCount, three.generatedTaskCount);
  assert.notEqual(four.syntheticNurseRuntimeGroupCount, three.syntheticNurseRuntimeGroupCount);
  assert.notDeepEqual(
    [four.queuedPlaceholderCount, four.delayedPlaceholderCount],
    [three.queuedPlaceholderCount, three.delayedPlaceholderCount]
  );
});

test("ratio-aware queue output is deterministic", async () => {
  const shared = await import("../dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const run = shared.executeInternalDryRun({ capacity });
  const runtimeStates = buildNurseRuntimeStatesFromManualBridge(
    buildManualAssignmentScenarioBridgeInput(capacity, fourToOneRatioPreset),
    { ratioPreset: fourToOneRatioPreset }
  );
  const input = {
    taskSet: run.taskSet,
    runtimeStates,
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: fourToOneRuntimeSeedContract,
    capacity
  };

  assert.deepEqual(
    calculateRatioAwareQueuePlaceholder(input),
    calculateRatioAwareQueuePlaceholder(input)
  );
});

test("ratio-aware queue emits no outcome, safety, compliance, recommendation, or optimizer claim", async () => {
  const shared = await import("../dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const run = shared.executeInternalDryRun({ capacity });
  const runtimeStates = buildNurseRuntimeStatesFromManualBridge(
    buildManualAssignmentScenarioBridgeInput(capacity, fourToOneRatioPreset),
    { ratioPreset: fourToOneRatioPreset }
  );
  const summary = calculateRatioAwareQueuePlaceholder({
    taskSet: run.taskSet,
    runtimeStates,
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: fourToOneRuntimeSeedContract,
    capacity
  });

  assert.equal(summary.outcomeClaim, false);
  assert.equal(summary.clinicalSafetyClaim, false);
  assert.equal(summary.staffingComplianceClaim, false);
  assert.equal(summary.recommendationStatus, "not_started");
  assert.equal(summary.optimizerStatus, "not_started");
});
