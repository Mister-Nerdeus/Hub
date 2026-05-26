import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readJson(path) {
  return JSON.parse(readFileSync(join(repoRoot, path), "utf8"));
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(join(repoRoot, path))).digest("hex");
}

test("final human review hash references match actual local artifacts", () => {
  const intake = readJson("docs/verification/human-review-intake-manifest.json");
  const ux = readJson("docs/verification/plan-builder-ux-review-flow-manifest.json");
  const snapshot = readJson("apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json");
  assert.equal(intake.manualVisualReviewManifestHash, hashFile("docs/verification/manual-visual-review-manifest.json"));
  assert.equal(intake.planBuilderUxReviewFlowManifestHash, hashFile("docs/verification/plan-builder-ux-review-flow-manifest.json"));
  assert.equal(intake.uiSnapshotHash, hashFile("apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json"));
  assert.equal(ux.manualVisualReviewManifestHash, hashFile("docs/verification/manual-visual-review-manifest.json"));
  assert.equal(ux.routeRepairManifestHash, hashFile("docs/verification/corrected-plan-route-repair-manifest.json"));
  assert.equal(ux.uiSnapshotHash, hashFile("apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json"));
  const sources = new Map(snapshot.generatedFromManifests.map((entry) => [entry.manifestName, entry.sha256]));
  assert.equal(sources.get("manual-visual-review"), hashFile("docs/verification/manual-visual-review-manifest.json"));
  assert.equal(sources.get("corrected-plan-route-repair"), hashFile("docs/verification/corrected-plan-route-repair-manifest.json"));
});
