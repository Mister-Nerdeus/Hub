import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSimulationV0ComparisonArtifact,
  validateSimulationV0ComparisonArtifact
} from "../dist/index.js";

test("Simulation v0 comparison artifact shares the same workload", () => {
  const artifact = validateSimulationV0ComparisonArtifact(buildSimulationV0ComparisonArtifact());

  assert.equal(artifact.sharedWorkload.neutralWorkloadSeedId, "neutral-workload-seed-canonical-plan-1");
  assert.equal(artifact.sharedWorkload.sameWorkloadForRatios, true);
  assert.equal(artifact.runs[0].generatedTaskCount, artifact.runs[1].generatedTaskCount);
});

test("Simulation v0 comparison artifact uses ratio-specific runtime", () => {
  const artifact = buildSimulationV0ComparisonArtifact();

  assert.notEqual(
    artifact.ratioRuntime.fourToOneRuntimeSeedId,
    artifact.ratioRuntime.threeToOneRuntimeSeedId
  );
  assert.notEqual(
    artifact.runs[0].syntheticNurseRuntimeGroupCount,
    artifact.runs[1].syntheticNurseRuntimeGroupCount
  );
});

test("Simulation v0 comparison artifact has queue placeholder differences", () => {
  const artifact = buildSimulationV0ComparisonArtifact();

  assert.notDeepEqual(
    [artifact.runs[0].queuedPlaceholderCount, artifact.runs[0].delayedPlaceholderCount],
    [artifact.runs[1].queuedPlaceholderCount, artifact.runs[1].delayedPlaceholderCount]
  );
});

test("Simulation v0 comparison artifact carries no optimizer, recommendation, safety, compliance, or outcome claim", () => {
  const artifact = buildSimulationV0ComparisonArtifact();

  assert.equal(artifact.optimizerStatus, "not_started");
  assert.equal(artifact.assignmentRecommendationStatus, "not_started");
  assert.equal(artifact.clinicalSafetyClaim, false);
  assert.equal(artifact.staffingComplianceClaim, false);
  assert.equal(artifact.patientOutcomePredictionClaim, false);
});
