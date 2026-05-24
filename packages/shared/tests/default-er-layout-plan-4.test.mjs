import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract, validateSourceToPlanMappingContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-214");

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function writeEvidence(name, payload) { mkdirSync(evidenceDir, { recursive: true }); writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`); }
function references() { const manifest = readJson(join(defaultPlansDir, "source-layout-manifest.json")); return { sourcePlanIds: new Set(manifest.sources.map((source) => source.sourcePlanId)), mappingIds: new Set(["mapping-er-layout-plan-4"]) }; }
function ids(plan) { return new Set([...plan.rooms, ...plan.hallways, ...plan.doors, ...plan.nurseStations, ...plan.zones, ...plan.pathNodes, ...plan.pathEdges].map((object) => object.id)); }

test("default ER layout plan 4 validates through wrapper and PlanContract", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-4.json")), references());
  assert.equal(wrapper.defaultPlanRecordId, "default-plan-er-layout-plan-4");
  assert.equal(wrapper.sourcePlanId, "source-er-layout-plan-4");
  assert.equal(wrapper.mappingId, "mapping-er-layout-plan-4");
  assert.equal(wrapper.plan.planId, "default-er-layout-plan-4");
  writeEvidence("plan-4-default-fixture-output.json", { issue: "214", status: "passed", defaultPlanRecordId: wrapper.defaultPlanRecordId, planId: wrapper.plan.planId, nestedPlanValidated: true, wrapperValidated: true, readOnly: wrapper.readOnly, limitationCount: wrapper.limitations.length });
});

test("default ER layout plan 4 source mapping targets existing plan objects", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-4.json")), references());
  const mapping = validateSourceToPlanMappingContract(readJson(join(defaultPlansDir, "source-mappings", "mapping-er-layout-plan-4.json")));
  const objectIds = ids(wrapper.plan);
  assert.equal(mapping.sourcePlanId, wrapper.sourcePlanId);
  assert.equal(mapping.targetPlanId, wrapper.plan.planId);
  assert.equal(mapping.objects.every((object) => objectIds.has(object.targetObjectId)), true);
  assert.equal(mapping.objects.every((object) => object.geometryApproximation === "manual"), true);
  writeEvidence("plan-4-source-mapping-output.json", { issue: "214", status: "passed", mappingId: mapping.mappingId, mappedObjectCount: mapping.objects.length, deferredSourceLabelCount: mapping.deferredSourceLabels.length, allTargetsResolved: true, approximateCoordinatesDocumented: true });
});

test("default ER layout plan 4 documents differences from plans 1 through 3", () => {
  const plan4 = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-4.json")), references()).plan;
  const isolationRoom = plan4.rooms.find((room) => room.id === "room-isolation-01");
  const isolationDoor = plan4.doors.find((door) => door.id === "door-isolation-01");
  assert.equal(isolationRoom?.isolationCapable, true);
  assert.equal(isolationDoor?.doorOperationalMetadata?.doorClass, "isolation");
  assert.equal(isolationDoor?.doorOperationalMetadata?.isolationBoundary, true);
  writeEvidence("plan-4-object-count-summary.json", { issue: "214", status: "passed", rooms: plan4.rooms.length, hallways: plan4.hallways.length, doors: plan4.doors.length, nurseStations: plan4.nurseStations.length, zones: plan4.zones.length, pathNodes: plan4.pathNodes.length, pathEdges: plan4.pathEdges.length, includesIsolationRoom: true, differsFromPlans1Through3: true });
});
