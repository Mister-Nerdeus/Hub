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
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-212");

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
    mappingIds: new Set(["mapping-er-layout-plan-2"])
  };
}

function objectIds(plan) {
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

test("default ER layout plan 2 validates through wrapper and PlanContract", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-2.json")),
    references()
  );
  assert.equal(wrapper.defaultPlanRecordId, "default-plan-er-layout-plan-2");
  assert.equal(wrapper.sourcePlanId, "source-er-layout-plan-2");
  assert.equal(wrapper.mappingId, "mapping-er-layout-plan-2");
  assert.equal(wrapper.plan.planId, "default-er-layout-plan-2");

  writeEvidence("plan-2-default-fixture-output.json", {
    issue: "212",
    status: "passed",
    defaultPlanRecordId: wrapper.defaultPlanRecordId,
    planId: wrapper.plan.planId,
    nestedPlanValidated: true,
    wrapperValidated: true,
    readOnly: wrapper.readOnly,
    limitationCount: wrapper.limitations.length
  });
});

test("default ER layout plan 2 source mapping targets existing plan objects", () => {
  const wrapper = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-2.json")),
    references()
  );
  const mapping = validateSourceToPlanMappingContract(
    readJson(join(defaultPlansDir, "source-mappings", "mapping-er-layout-plan-2.json"))
  );
  const ids = objectIds(wrapper.plan);

  assert.equal(mapping.sourcePlanId, wrapper.sourcePlanId);
  assert.equal(mapping.targetPlanId, wrapper.plan.planId);
  assert.equal(mapping.objects.every((object) => ids.has(object.targetObjectId)), true);
  assert.equal(mapping.objects.every((object) => object.geometryApproximation === "manual"), true);

  writeEvidence("plan-2-source-mapping-output.json", {
    issue: "212",
    status: "passed",
    mappingId: mapping.mappingId,
    mappedObjectCount: mapping.objects.length,
    deferredSourceLabelCount: mapping.deferredSourceLabels.length,
    allTargetsResolved: true,
    approximateCoordinatesDocumented: true
  });
});

test("default ER layout plan 2 keeps Plan 1 ID conventions while documenting differences", () => {
  const plan1 = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    { sourcePlanIds: new Set(["source-er-layout-plan-1"]), mappingIds: new Set(["mapping-er-layout-plan-1"]) }
  ).plan;
  const plan2 = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-2.json")),
    references()
  ).plan;

  assert.ok(plan2.rooms.some((room) => room.id === "room-level-1-trauma"));
  assert.ok(plan2.nurseStations.some((station) => station.id === "station-primary"));
  assert.ok(plan2.zones.some((zone) => zone.id === "zone-provider-pharmacy"));
  assert.ok(plan2.hallways.some((hallway) => hallway.id === "hallway-north-spur"));
  assert.notEqual(plan1.rooms.length, plan2.rooms.length);
  assert.notEqual(plan1.nurseStations[0].x, plan2.nurseStations[0].x);

  writeEvidence("plan-2-object-count-summary.json", {
    issue: "212",
    status: "passed",
    rooms: plan2.rooms.length,
    hallways: plan2.hallways.length,
    doors: plan2.doors.length,
    nurseStations: plan2.nurseStations.length,
    zones: plan2.zones.length,
    pathNodes: plan2.pathNodes.length,
    pathEdges: plan2.pathEdges.length,
    preservesSharedIdConventions: true,
    differsFromPlan1: true
  });
});
