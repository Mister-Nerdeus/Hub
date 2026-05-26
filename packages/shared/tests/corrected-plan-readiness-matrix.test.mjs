import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCorrectedPlanReadinessMatrix } from "../dist/index.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-307");
const manifest = JSON.parse(readFileSync(resolve(repoRoot, "docs/verification/corrected-plan-review-manifest.json"), "utf8"));
const matrix = buildCorrectedPlanReadinessMatrix(manifest);

assert.equal(matrix.length, 4);
assert.equal(matrix.every((entry) => entry.renderedEvidenceReady), true);
assert.equal(matrix.every((entry) => entry.privateSourceBoundaryPassed), true);
assert.equal(matrix.every((entry) => entry.sourceFixtureUnchanged), true);
assert.equal(matrix.every((entry) => entry.promotionCandidateStatus === "blocked_by_export_status"), true);

writeJson("corrected-plan-readiness-matrix-output.json", matrix);
writeJson("blocking-patterns-output.json", {
  status: "passed",
  commonBlocker: "blocked_path_sync",
  blockedPlans: matrix.filter((entry) => !entry.simulationExportReady).map((entry) => entry.planId)
});

function writeJson(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}
