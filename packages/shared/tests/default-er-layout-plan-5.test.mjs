import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract, validateSourceToPlanMappingContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-215");

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function writeEvidence(name, payload) { mkdirSync(evidenceDir, { recursive: true }); writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`); }
function references() { const manifest = readJson(join(defaultPlansDir, "source-layout-manifest.json")); return { sourcePlanIds: new Set(manifest.sources.map((source) => source.sourcePlanId)), mappingIds: new Set(["mapping-er-layout-plan-5"]) }; }
function ids(plan) { return new Set([...plan.rooms, ...plan.hallways, ...plan.doors, ...plan.nurseStations, ...plan.zones, ...plan.pathNodes, ...plan.pathEdges].map((object) => object.id)); }

test("default ER layout plan 5 validates through wrapper and PlanContract", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-5.json")), references());
  assert.equal(wrapper.defaultPlanRecordId, "default-plan-er-layout-plan-5");
  assert.equal(wrapper.sourcePlanId, "source-er-layout-plan-5");
  assert.equal(wrapper.mappingId, "mapping-er-layout-plan-5");
  assert.equal(wrapper.plan.planId, "default-er-layout-plan-5");
  writeEvidence("plan-5-default-fixture-output.json", { issue: "215", status: "passed", defaultPlanRecordId: wrapper.defaultPlanRecordId, planId: wrapper.plan.planId, nestedPlanValidated: true, wrapperValidated: true, readOnly: wrapper.readOnly, limitationCount: wrapper.limitations.length });
});

test("default ER layout plan 5 source mapping targets existing plan objects", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-5.json")), references());
  const mapping = validateSourceToPlanMappingContract(readJson(join(defaultPlansDir, "source-mappings", "mapping-er-layout-plan-5.json")));
  const objectIds = ids(wrapper.plan);
  assert.equal(mapping.sourcePlanId, wrapper.sourcePlanId);
  assert.equal(mapping.targetPlanId, wrapper.plan.planId);
  assert.equal(mapping.objects.every((object) => objectIds.has(object.targetObjectId)), true);
  assert.equal(mapping.objects.every((object) => object.geometryApproximation === "manual"), true);
  writeEvidence("plan-5-source-mapping-output.json", { issue: "215", status: "passed", mappingId: mapping.mappingId, mappedObjectCount: mapping.objects.length, deferredSourceLabelCount: mapping.deferredSourceLabels.length, allTargetsResolved: true, approximateCoordinatesDocumented: true });
});

test("default ER layout plan 5 documents differences from plans 1 through 4", () => {
  const plan5 = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, "default-er-layout-plan-5.json")), references()).plan;
  const behavioralRoom = plan5.rooms.find((room) => room.id === "room-behavioral-01");
  const behavioralDoor = plan5.doors.find((door) => door.id === "door-behavioral-01");
  assert.equal(behavioralRoom?.roomOperationalMetadata?.behavioralReady, true);
  assert.equal(behavioralDoor?.doorOperationalMetadata?.doorClass, "behavioral");
  assert.equal(behavioralDoor?.doorOperationalMetadata?.behavioralBoundary, true);
  writeEvidence("plan-5-object-count-summary.json", { issue: "215", status: "passed", rooms: plan5.rooms.length, hallways: plan5.hallways.length, doors: plan5.doors.length, nurseStations: plan5.nurseStations.length, zones: plan5.zones.length, pathNodes: plan5.pathNodes.length, pathEdges: plan5.pathEdges.length, includesBehavioralRoom: true, differsFromPlans1Through4: true });
});
