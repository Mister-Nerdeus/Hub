import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildRoutePreview,
  buildWalkingBaseline,
  validateWalkingBaselineContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const baselineDir = join(defaultPlansDir, "walking-baselines");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-224");

function readPlan(index) {
  return JSON.parse(
    readFileSync(join(defaultPlansDir, `default-er-layout-plan-${index}.json`), "utf8")
  ).plan;
}

function readBaseline(index) {
  return JSON.parse(
    readFileSync(join(baselineDir, `default-er-layout-plan-${index}-walking-baseline.json`), "utf8")
  );
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("default plan walking baseline fixtures validate and resolve to plan path nodes", () => {
  const summaries = [];
  for (let index = 1; index <= 5; index += 1) {
    const plan = readPlan(index);
    const baseline = validateWalkingBaselineContract(readBaseline(index));
    assert.equal(baseline.planId, plan.planId);
    const pathNodeIds = new Set(plan.pathNodes.map((node) => node.id));
    for (const group of baseline.routeGroupSummaries) {
      for (const route of group.routes) {
        assert.equal(pathNodeIds.has(route.originPathNodeId), true, route.originPathNodeId);
        assert.equal(pathNodeIds.has(route.destinationPathNodeId), true, route.destinationPathNodeId);
      }
    }
    assert.ok(baseline.limitations.length > 0);
    summaries.push({
      planId: baseline.planId,
      totalRouteCount: baseline.totalRouteCount,
      reachableRouteCount: baseline.reachableRouteCount,
      totalDistanceFeet: baseline.totalDistanceFeet
    });
  }

  writeEvidence("default-plan-walking-baselines-output.json", {
    issue: "224",
    status: "passed",
    summaries
  });
});

test("default walking baseline fixtures are deterministic canonical outputs", () => {
  const deterministic = [];
  for (let index = 1; index <= 5; index += 1) {
    const plan = readPlan(index);
    const fixture = readBaseline(index);
    const regenerated = buildDefaultPlanWalkingBaseline(plan);
    assert.deepEqual(regenerated, fixture, plan.planId);
    deterministic.push({
      planId: plan.planId,
      baselineId: regenerated.baselineId,
      canonicalMatch: true
    });
  }

  writeEvidence("walking-baseline-determinism-output.json", {
    issue: "224",
    status: "passed",
    deterministic
  });
});

function buildDefaultPlanWalkingBaseline(plan) {
  const groups = [];
  const entryNode = plan.pathNodes.find((node) => node.nodeType === "entry");
  const traumaRoom = plan.rooms.find((room) => room.traumaCapable && room.pathNodeId != null);
  if (entryNode && traumaRoom) {
    groups.push({
      groupId: "ems-entry-to-trauma",
      label: "EMS entry to trauma",
      routePreviews: [buildRoutePreview(plan, input(plan, entryNode.id, traumaRoom.pathNodeId))]
    });
  }

  const primaryStation = plan.nurseStations.find(
    (station) => station.stationOperationalMetadata?.defaultWalkingOrigin
  );
  if (primaryStation) {
    groups.push({
      groupId: "primary-station-to-rooms",
      label: "Primary station to rooms",
      routePreviews: plan.rooms
        .filter((room) => room.pathNodeId != null)
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((room) => buildRoutePreview(plan, input(plan, primaryStation.pathNodeId, room.pathNodeId)))
    });
  }

  const providerStation = plan.nurseStations.find(
    (station) => station.stationOperationalMetadata?.supportsProvider
  );
  if (providerStation) {
    groups.push({
      groupId: "provider-pharmacy-to-rooms",
      label: "Provider pharmacy to rooms",
      routePreviews: plan.rooms
        .filter((room) => room.pathNodeId != null)
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((room) => buildRoutePreview(plan, input(plan, providerStation.pathNodeId, room.pathNodeId)))
    });
  }

  return buildWalkingBaseline({
    baselineId: `${plan.planId}-walking-baseline`,
    planId: plan.planId,
    groups
  });
}

function input(plan, originPathNodeId, destinationPathNodeId) {
  return {
    schemaVersion: "1.0.0",
    planId: plan.planId,
    originPathNodeId,
    destinationPathNodeId
  };
}
