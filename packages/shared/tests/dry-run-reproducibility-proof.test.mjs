import assert from "node:assert/strict";
import test from "node:test";

import { buildDryRunReproducibilityProof } from "../dist/index.js";

test("same dry-run inputs produce same artifact hash", () => {
  const proof = buildDryRunReproducibilityProof();

  assert.equal(proof.firstArtifactHash, proof.secondArtifactHash);
  assert.equal(proof.repeatedRunMatches, true);
});

test("same dry-run inputs produce equal timeline and queue placeholders", () => {
  const proof = buildDryRunReproducibilityProof();

  assert.equal(proof.taskTimelineEqual, true);
  assert.equal(proof.queuePlaceholderEqual, true);
});

test("changed seed changes artifact hash", () => {
  const proof = buildDryRunReproducibilityProof();

  assert.notEqual(proof.firstArtifactHash, proof.changedSeedArtifactHash);
  assert.equal(proof.changedSeedChangesHash, true);
});

test("reproducibility proof carries no hidden time/randomness or prohibited claims", () => {
  const proof = buildDryRunReproducibilityProof();

  assert.equal(proof.hiddenTimeInputStatus, "forbidden");
  assert.equal(proof.hiddenRandomnessStatus, "forbidden");
  assert.equal(proof.optimizerStatus, "not_started");
  assert.equal(proof.assignmentRecommendationStatus, "not_started");
  assert.equal(proof.clinicalSafetyClaim, false);
  assert.equal(proof.staffingComplianceClaim, false);
  assert.equal(proof.patientOutcomePredictionClaim, false);
});
