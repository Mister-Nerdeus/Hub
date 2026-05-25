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
  if (plan.planId === "default-er-layout-plan-1") {
    return buildPlan1WalkingBaseline(plan);
  }

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

function buildPlan1WalkingBaseline(plan) {
  const roomById = new Map(plan.rooms.map((room) => [room.id, room]));
  const groups = [
    {
      groupId: "left-station-to-left-pod-rooms",
      label: "Left station to left pod rooms",
      routePreviews: roomRoutes(plan, roomById, "node-station-left", [
        "room-level-1-trauma",
        "room-02",
        "room-03",
        "room-04",
        "room-05",
        "room-14",
        "room-15",
        "room-16"
      ])
    },
    {
      groupId: "right-station-to-right-pod-rooms",
      label: "Right station to right pod rooms",
      routePreviews: roomRoutes(plan, roomById, "node-station-right", [
        "room-06",
        "room-07",
        "room-08",
        "room-09",
        "room-10",
        "room-11",
        "room-12",
        "room-13"
      ])
    },
    {
      groupId: "ems-entry-to-trauma",
      label: "EMS entry to trauma",
      routePreviews: roomRoutes(plan, roomById, "node-entry-ems", ["room-level-1-trauma"])
    },
    {
      groupId: "provider-pharmacy-to-rooms",
      label: "Provider pharmacy to rooms",
      routePreviews: roomRoutes(plan, roomById, "node-zone-provider-pharmacy", [
        "room-17",
        "room-level-1-trauma",
        "room-02",
        "room-06",
        "room-10",
        "room-12",
        "room-19",
        "room-24"
      ])
    },
    {
      groupId: "bottom-hallway-to-bottom-rooms",
      label: "Bottom hallway to bottom rooms",
      routePreviews: roomRoutes(plan, roomById, "node-hallway-bottom-horizontal", [
        "room-19",
        "room-20",
        "room-21",
        "room-22",
        "room-23",
        "room-24"
      ])
    },
    {
      groupId: "right-hallway-to-right-side-rooms",
      label: "Right hallway to right side rooms",
      routePreviews: roomRoutes(plan, roomById, "node-hallway-right-vertical", [
        "room-11",
        "room-12",
        "room-10",
        "room-13"
      ])
    }
  ];

  return buildWalkingBaseline({
    baselineId: `${plan.planId}-walking-baseline`,
    planId: plan.planId,
    groups
  });
}

function roomRoutes(plan, roomById, originPathNodeId, roomIds) {
  return roomIds.map((roomId) => {
    const room = roomById.get(roomId);
    assert.ok(room?.pathNodeId);
    return buildRoutePreview(plan, input(plan, originPathNodeId, room.pathNodeId));
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
