import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract, validateSourceToPlanMappingContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-213");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function references() {
  const manifest = readJson(join(defaultPlansDir, "source-layout-manifest.json"));
  return { sourcePlanIds: new Set(manifest.sources.map((source) => source.sourcePlanId)), mappingIds: new Set(["mapping-er-layout-plan-3"]) };
}

function objectIds(plan) {
  return new Set([...plan.rooms, ...plan.hallways, ...plan.doors, ...plan.nurseStations, ...plan.zones, ...plan.pathNodes, ...plan.pathEdges].map((object) => object.id));
}

test("default ER layout plan 3 validates through wrapper and PlanContract", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-3.json")), references());
  assert.equal(wrapper.defaultPlanRecordId, "default-plan-er-layout-plan-3");
  assert.equal(wrapper.sourcePlanId, "source-er-layout-plan-3");
  assert.equal(wrapper.mappingId, "mapping-er-layout-plan-3");
  assert.equal(wrapper.plan.planId, "default-er-layout-plan-3");
  writeEvidence("plan-3-default-fixture-output.json", { issue: "213", status: "passed", defaultPlanRecordId: wrapper.defaultPlanRecordId, planId: wrapper.plan.planId, nestedPlanValidated: true, wrapperValidated: true, readOnly: wrapper.readOnly, limitationCount: wrapper.limitations.length });
});

test("default ER layout plan 3 source mapping targets existing plan objects", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-3.json")), references());
  const mapping = validateSourceToPlanMappingContract(readJson(join(defaultPlansDir, "source-mappings", "mapping-er-layout-plan-3.json")));
  const ids = objectIds(wrapper.plan);
  assert.equal(mapping.sourcePlanId, wrapper.sourcePlanId);
  assert.equal(mapping.targetPlanId, wrapper.plan.planId);
  assert.equal(mapping.objects.every((object) => ids.has(object.targetObjectId)), true);
  assert.equal(mapping.objects.every((object) => object.geometryApproximation === "manual"), true);
  writeEvidence("plan-3-source-mapping-output.json", { issue: "213", status: "passed", mappingId: mapping.mappingId, mappedObjectCount: mapping.objects.length, deferredSourceLabelCount: mapping.deferredSourceLabels.length, allTargetsResolved: true, approximateCoordinatesDocumented: true });
});

test("default ER layout plan 3 documents differences from plans 1 and 2", () => {
  const plan1 = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")), { sourcePlanIds: new Set(["source-er-layout-plan-1"]), mappingIds: new Set(["mapping-er-layout-plan-1"]) }).plan;
  const plan2 = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-2.json")), { sourcePlanIds: new Set(["source-er-layout-plan-2"]), mappingIds: new Set(["mapping-er-layout-plan-2"]) }).plan;
  const plan3 = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-3.json")), references()).plan;
  assert.ok(plan3.rooms.some((room) => room.id === "room-level-1-trauma"));
  assert.ok(plan3.zones.some((zone) => zone.id === "zone-provider-pharmacy"));
  assert.equal(plan3.rooms.length < plan1.rooms.length, true);
  assert.equal(plan3.rooms.length < plan2.rooms.length, true);
  assert.notEqual(plan3.nurseStations[0].x, plan1.nurseStations[0].x);
  assert.notEqual(plan3.nurseStations[0].x, plan2.nurseStations[0].x);
  writeEvidence("plan-3-object-count-summary.json", { issue: "213", status: "passed", rooms: plan3.rooms.length, hallways: plan3.hallways.length, doors: plan3.doors.length, nurseStations: plan3.nurseStations.length, zones: plan3.zones.length, pathNodes: plan3.pathNodes.length, pathEdges: plan3.pathEdges.length, differsFromPlans1And2: true });
});
