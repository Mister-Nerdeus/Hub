import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateDefaultSavedPlanFixtureContract,
  validateSourceToPlanMappingContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-211");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function references() {
  const manifest = readJson(join(defaultPlansDir, "source-layout-manifest.json"));
  return {
    sourcePlanIds: new Set(manifest.sources.map((source) => source.sourcePlanId)),
    mappingIds: new Set(["mapping-er-layout-plan-1"])
  };
}

function planObjectIds(plan) {
  return new Set([
    ...plan.rooms.map((room) => room.id),
    ...plan.hallways.map((hallway) => hallway.id),
    ...plan.doors.map((door) => door.id),
    ...plan.nurseStations.map((station) => station.id),
    ...plan.zones.map((zone) => zone.id),
    ...plan.pathNodes.map((node) => node.id),
    ...plan.pathEdges.map((edge) => edge.id)
  ]);
}

test("default ER layout plan 1 validates through wrapper and PlanContract", () => {
  const fixture = readJson(join(defaultPlansDir, "default-er-layout-plan-1.json"));
  const wrapper = validateDefaultSavedPlanFixtureContract(fixture, references());

  assert.equal(wrapper.defaultPlanRecordId, "default-plan-er-layout-plan-1");
  assert.equal(wrapper.sourcePlanId, "source-er-layout-plan-1");
  assert.equal(wrapper.mappingId, "mapping-er-layout-plan-1");
  assert.equal(wrapper.plan.planId, "default-er-layout-plan-1");
  assert.equal(wrapper.readOnly, true);

  writeEvidence("plan-1-default-fixture-output.json", {
    issue: "211",
    status: "passed",
    defaultPlanRecordId: wrapper.defaultPlanRecordId,
    planId: wrapper.plan.planId,
    nestedPlanValidated: true,
    wrapperValidated: true,
    readOnly: wrapper.readOnly,
    limitationCount: wrapper.limitations.length
  });
});

test("default ER layout plan 1 source mapping targets existing plan objects", () => {
  const fixture = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    references()
  );
  const mapping = validateSourceToPlanMappingContract(
    readJson(join(defaultPlansDir, "source-mappings", "mapping-er-layout-plan-1.json"))
  );
  const objectIds = planObjectIds(fixture.plan);

  assert.equal(mapping.sourcePlanId, fixture.sourcePlanId);
  assert.equal(mapping.targetPlanId, fixture.plan.planId);
  for (const object of mapping.objects) {
    assert.equal(objectIds.has(object.targetObjectId), true, object.targetObjectId);
    assert.equal(object.geometryApproximation, "manual");
  }
  assert.ok(mapping.deferredSourceLabels.length > 0);

  writeEvidence("plan-1-source-mapping-output.json", {
    issue: "211",
    status: "passed",
    mappingId: mapping.mappingId,
    mappedObjectCount: mapping.objects.length,
    deferredSourceLabelCount: mapping.deferredSourceLabels.length,
    allTargetsResolved: true,
    approximateCoordinatesDocumented: true
  });
});

test("default ER layout plan 1 includes visible operational source intent", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    references()
  );
  const plan = wrapper.plan;

  assert.ok(plan.zones.some((zone) => zone.id === "zone-level-1-trauma"));
  assert.ok(plan.zones.some((zone) => zone.id === "zone-hall-ems-entry"));
  assert.ok(plan.zones.some((zone) => zone.id === "zone-provider-pharmacy"));
  assert.ok(plan.nurseStations.length >= 1);
  assert.ok(plan.hallways.length >= 2);
  assert.ok(plan.doors.length >= 8);
  assert.ok(plan.rooms.some((room) => room.id === "room-level-1-trauma"));
  assert.ok(plan.rooms.filter((room) => /^room-\d\d$/.test(room.id)).length >= 6);

  const traumaDoor = plan.doors.find((door) => door.id === "door-level-1-trauma");
  assert.equal(traumaDoor?.doorOperationalMetadata?.doorClass, "trauma");
  assert.equal(traumaDoor?.doorOperationalMetadata?.traumaAccess, true);
  assert.equal(traumaDoor?.doorOperationalMetadata?.isolationBoundary, false);
  assert.equal(traumaDoor?.doorOperationalMetadata?.behavioralBoundary, false);

  writeEvidence("plan-1-object-count-summary.json", {
    issue: "211",
    status: "passed",
    rooms: plan.rooms.length,
    hallways: plan.hallways.length,
    doors: plan.doors.length,
    nurseStations: plan.nurseStations.length,
    zones: plan.zones.length,
    pathNodes: plan.pathNodes.length,
    pathEdges: plan.pathEdges.length,
    includesTrauma: true,
    includesEmsHallEntry: true,
    includesProviderPharmacy: true,
    includesNumberedRooms: true
  });
});
