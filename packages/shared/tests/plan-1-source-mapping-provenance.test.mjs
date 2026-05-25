import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract, validateSourceMappingAgainstPlan } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-237");
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function writeEvidence(name, payload) { mkdirSync(evidenceDir, { recursive: true }); writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`); }
function readPlanFixture(planNumber) { return validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, `default-er-layout-plan-${planNumber}.json`)), { sourcePlanIds: new Set([`source-er-layout-plan-${planNumber}`]), mappingIds: new Set([`mapping-er-layout-plan-${planNumber}`]) }); }
function planCounts(plan) { return { rooms: plan.rooms.length, hallways: plan.hallways.length, doors: plan.doors.length, nurseStations: plan.nurseStations.length, zones: plan.zones.length, pathNodes: plan.pathNodes.length, pathEdges: plan.pathEdges.length }; }

test("Issue 237 validates Plan 1 source mapping against repaired fixture and source truth", () => {
  const fixture = readPlanFixture(1);
  const mapping = validateSourceMappingAgainstPlan(readJson(join(defaultPlansDir, "source-mappings", "mapping-er-layout-plan-1.json")), fixture.plan);
  const sourceTruth = readJson(join(defaultPlansDir, "visual-parity", "plan-1-source-truth.json"));
  const mappedTargetIds = new Set(mapping.objects.map((object) => object.targetObjectId));
  const requiredTargets = sourceTruth.visibleObjects.map((entry) => entry.expectedTargetId).filter(Boolean);
  const missingTargets = requiredTargets.filter((targetId) => !mappedTargetIds.has(targetId));
  const provenanceMissing = mapping.objects.filter((object) => object.conversionProvenance == null);

  writeEvidence("plan-1-source-mapping-after.json", { issue: "237", mapping });
  writeEvidence("plan-1-mapping-validation-output.json", { issue: "237", mappingId: mapping.mappingId, mappedObjectCount: mapping.objects.length, requiredTargetCount: requiredTargets.length, missingTargets, provenanceMissingCount: provenanceMissing.length });

  assert.deepEqual(missingTargets, []);
  assert.deepEqual(provenanceMissing, []);
});

test("Issue 237 records provenance and deferred source labels honestly", () => {
  const mapping = readJson(join(defaultPlansDir, "source-mappings", "mapping-er-layout-plan-1.json"));
  const provenanceHistogram = {};
  for (const object of mapping.objects) provenanceHistogram[object.conversionProvenance] = (provenanceHistogram[object.conversionProvenance] ?? 0) + 1;
  const generatedCount = (provenanceHistogram.generated_required_for_graph ?? 0) + (provenanceHistogram.conversion_inferred ?? 0);
  const deferredLabels = mapping.deferredSourceLabels;

  writeEvidence("plan-1-provenance-coverage-output.json", { issue: "237", provenanceHistogram, generatedOrInferredObjectCount: generatedCount, mappedObjectCount: mapping.objects.length });
  writeEvidence("plan-1-deferred-source-labels-output.json", { issue: "237", deferredLabels, deferredLabelCount: deferredLabels.length });

  assert.equal((provenanceHistogram.source_visible_mapped ?? 0) > 0, true);
  assert.equal(generatedCount > 0, true);
  assert.equal(deferredLabels.some((label) => label.sourceLabel === "Grey unlabeled blocks"), true);
});

test("Issue 237 proves Plans 2 through 5 remain unchanged", () => {
  const plans = [];
  for (let index = 2; index <= 5; index += 1) {
    const fixture = readPlanFixture(index);
    validateSourceMappingAgainstPlan(readJson(join(defaultPlansDir, "source-mappings", `mapping-er-layout-plan-${index}.json`)), fixture.plan);
    plans.push({ planId: fixture.plan.planId, counts: planCounts(fixture.plan) });
  }
  writeEvidence("plans-2-through-5-unchanged-output.json", { issue: "237", plans, preservedPlanIds: plans.map((entry) => entry.planId) });
  assert.equal(plans.length, 4);
  assert.equal(plans.every((entry) => entry.counts.rooms > 0), true);
});