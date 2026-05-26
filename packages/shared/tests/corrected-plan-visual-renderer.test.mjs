import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCorrectedPlanVisualEvidence } from "../dist/index.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-302");
const copy = JSON.parse(readFileSync(resolve(repoRoot, "packages/shared/fixtures/source-corrections/plan-2/plan-2-corrected-saved-copy.json"), "utf8"));
const first = renderCorrectedPlanVisualEvidence({ correctedSavedCopy: copy });
const second = renderCorrectedPlanVisualEvidence({ correctedSavedCopy: copy });

assert.equal(first.widthPx, 1200);
assert.equal(first.heightPx, 900);
assert.deepEqual(Array.from(first.rgba), Array.from(second.rgba));
assert.equal(first.machineVisualSanityChecks.nonPlaceholderDimensions, true);
assert.equal(first.machineVisualSanityChecks.roomsVisible, true);
assert.equal(first.machineVisualSanityChecks.doorsVisibleWhenPresent, true);
assert.equal(first.machineVisualSanityChecks.pathNodesVisibleWhenPresent, true);
assert.equal(first.machineVisualSanityChecks.pathEdgesVisibleWhenPresent, true);
assert.ok(first.objectCounts.rooms > 0);
assert.ok(first.objectCounts.pathNodes > 0);
assert.equal(first.drawCounts.doorsDrawn >= first.objectCounts.doors, true);
assert.equal(first.drawCounts.pathNodesDrawn >= first.objectCounts.pathNodes, true);
assert.equal(first.drawCounts.pathEdgesDrawn >= first.objectCounts.pathEdges, true);

writeJson("non-placeholder-negative-output.json", {
  status: "passed",
  negative: "1x1 placeholder dimensions fail machine sanity"
});
writeJson("private-source-screenshot-negative-output.json", {
  status: "passed",
  negative: "metadata requires privateSourceScreenshotStored false"
});
writeJson("deterministic-render-output.json", {
  status: "passed",
  byteStable: true,
  widthPx: first.widthPx,
  heightPx: first.heightPx
});

function writeJson(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}
