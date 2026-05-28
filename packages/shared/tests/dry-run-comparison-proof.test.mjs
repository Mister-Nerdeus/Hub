import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDryRunComparisonProof,
  validateDryRunComparisonProof
} from "../dist/index.js";

test("dry-run comparison proof validates 4:1 and 3:1 runs", () => {
  const proof = validateDryRunComparisonProof(buildDryRunComparisonProof());

  assert.equal(proof.proofId, "dry-run-ratio-comparison-proof-canonical-plan-1");
  assert.deepEqual(proof.runs.map((run) => run.ratioPresetId), ["four_to_one", "three_to_one"]);
  assert.ok(proof.runs.every((run) => run.generatedTaskCount > 0));
});

test("dry-run comparison proof reflects ratio group-count difference", () => {
  const proof = validateDryRunComparisonProof(buildDryRunComparisonProof());
  const four = proof.runs.find((run) => run.ratioPresetId === "four_to_one");
  const three = proof.runs.find((run) => run.ratioPresetId === "three_to_one");

  assert.ok(four);
  assert.ok(three);
  assert.ok(three.syntheticNurseRuntimeGroupCount > four.syntheticNurseRuntimeGroupCount);
});

test("dry-run comparison proof uses shared canonical base inputs", () => {
  const proof = validateDryRunComparisonProof(buildDryRunComparisonProof());

  assert.equal(new Set(proof.runs.map((run) => run.canonicalScenarioSeedId)).size, 1);
  assert.equal(new Set(proof.runs.map((run) => run.activityProfileId)).size, 1);
  assert.equal(new Set(proof.runs.map((run) => run.deterministicSeedId)).size, 1);
  assert.equal(proof.sharedInputs.usesRawRoomCounts, false);
  assert.equal(proof.sharedInputs.usesStorageOrSupportForTasks, false);
});

test("dry-run comparison proof is deterministic", () => {
  assert.deepEqual(buildDryRunComparisonProof(), buildDryRunComparisonProof());
});

test("dry-run comparison proof rejects claims and recommendation status changes", () => {
  const proof = buildDryRunComparisonProof();

  assert.throws(
    () => validateDryRunComparisonProof({ ...proof, clinicalSafetyClaim: true }),
    /clinicalSafetyClaim/
  );
  assert.throws(
    () => validateDryRunComparisonProof({ ...proof, staffingComplianceClaim: true }),
    /staffingComplianceClaim/
  );
  assert.throws(
    () => validateDryRunComparisonProof({ ...proof, patientOutcomeClaim: true }),
    /patientOutcomeClaim/
  );
  assert.throws(
    () => validateDryRunComparisonProof({ ...proof, assignmentRecommendationStatus: "started" }),
    /assignmentRecommendationStatus/
  );
});
