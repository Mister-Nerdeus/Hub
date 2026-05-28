import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStableArtifactHash,
  executeInternalDryRun,
  generateDryRunArtifactBundle
} from "../dist/index.js";

test("dry-run event artifact bundle includes required sections", () => {
  const bundle = generateDryRunArtifactBundle(executeInternalDryRun());

  assert.equal(bundle.eventArtifact.artifactType, "event_timeline");
  assert.equal(bundle.taskSummaryArtifact.artifactType, "task_summary");
  assert.equal(bundle.nurseRuntimeSummaryArtifact.artifactType, "nurse_runtime_summary");
  assert.equal(bundle.queuePlaceholderSummaryArtifact.artifactType, "queue_placeholder_summary");
  assert.ok(bundle.limitationsMarkdown.includes("Internal Dry-Run Limitations"));
});

test("dry-run stable artifact hash is deterministic", () => {
  const first = generateDryRunArtifactBundle(executeInternalDryRun());
  const second = generateDryRunArtifactBundle(executeInternalDryRun());

  assert.equal(first.stableArtifactHash, second.stableArtifactHash);
});

test("stable artifact hash excludes nondeterministic metadata keys", () => {
  const base = { a: 1, generatedAt: "one", nested: { createdAt: "two", b: 2 } };
  const changed = { a: 1, generatedAt: "changed", nested: { createdAt: "changed", b: 2 } };

  assert.equal(buildStableArtifactHash(base), buildStableArtifactHash(changed));
});

test("artifact bundle emits no optimizer, recommendation, clinical, staffing, or outcome claim", () => {
  const bundle = generateDryRunArtifactBundle(executeInternalDryRun());

  assert.equal(bundle.optimizerStatus, "not_started");
  assert.equal(bundle.assignmentRecommendationStatus, "not_started");
  assert.equal(bundle.clinicalSafetyClaim, false);
  assert.equal(bundle.staffingComplianceClaim, false);
  assert.equal(bundle.patientOutcomePredictionClaim, false);
});
