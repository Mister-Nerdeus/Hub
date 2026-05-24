import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { buildRoutePreview } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-221");

function readPlan(index) {
  return JSON.parse(
    readFileSync(join(defaultPlansDir, `default-er-layout-plan-${index}.json`), "utf8")
  ).plan;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function input(plan, originPathNodeId, destinationPathNodeId) {
  return {
    schemaVersion: "1.0.0",
    planId: plan.planId,
    originPathNodeId,
    destinationPathNodeId
  };
}

test("route preview builder produces default route examples for all five plans", () => {
  const summaries = [];
  for (let index = 1; index <= 5; index += 1) {
    const plan = readPlan(index);
    const entryNode = plan.pathNodes.find((node) => node.nodeType === "entry");
    const traumaRoom = plan.rooms.find((room) => room.traumaCapable);
    const primaryStation = plan.nurseStations.find(
      (station) => station.stationOperationalMetadata?.defaultWalkingOrigin
    );
    const providerStation = plan.nurseStations.find(
      (station) => station.stationOperationalMetadata?.supportsProvider
    );

    assert.ok(entryNode);
    assert.ok(traumaRoom?.pathNodeId);
    assert.ok(primaryStation);

    const entryToTrauma = buildRoutePreview(plan, input(plan, entryNode.id, traumaRoom.pathNodeId));
    assert.equal(entryToTrauma.status, "reachable");

    const stationRoutes = plan.rooms.map((room) =>
      buildRoutePreview(plan, input(plan, primaryStation.pathNodeId, room.pathNodeId))
    );
    assert.equal(stationRoutes.every((route) => route.status === "reachable"), true);

    let providerToTrauma = null;
    if (providerStation != null) {
      providerToTrauma = buildRoutePreview(plan, input(plan, providerStation.pathNodeId, traumaRoom.pathNodeId));
      assert.equal(providerToTrauma.status, "reachable");
    }

    summaries.push({
      planId: plan.planId,
      entryToTraumaDistanceFeet: entryToTrauma.totalDistanceFeet,
      primaryStationRoomRouteCount: stationRoutes.length,
      providerToTraumaStatus: providerToTrauma?.status ?? "not_present"
    });
  }

  writeEvidence("default-plan-route-preview-output.json", {
    issue: "221",
    status: "passed",
    summaries
  });
});

test("route preview builder is deterministic and does not mutate plans", () => {
  const plan = readPlan(1);
  const before = JSON.stringify(plan);
  const routeInput = input(plan, "node-entry-ems", "node-door-room-01");
  const first = buildRoutePreview(plan, routeInput);
  const second = buildRoutePreview(plan, routeInput);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(plan), before);

  writeEvidence("route-preview-determinism-output.json", {
    issue: "221",
    status: "passed",
    deterministic: true,
    routeEdgeIds: first.routeEdgeIds
  });
  writeEvidence("nonmutation-output.json", {
    issue: "221",
    status: "passed",
    planJsonUnchanged: true
  });
});

test("route preview builder returns structured invalid and unreachable outputs", () => {
  const plan = readPlan(1);
  const invalid = buildRoutePreview(plan, input(plan, "node-missing", "node-door-room-01"));
  assert.equal(invalid.status, "invalid");
  assert.equal(invalid.warnings.some((warning) => warning.code === "MISSING_ORIGIN_NODE"), true);

  const disconnected = clone(plan);
  disconnected.pathEdges = disconnected.pathEdges.filter(
    (edge) => edge.fromNodeId !== "node-door-room-01" && edge.toNodeId !== "node-door-room-01"
  );
  const unreachable = buildRoutePreview(
    disconnected,
    input(disconnected, "node-entry-ems", "node-door-room-01")
  );
  assert.equal(unreachable.status, "unreachable");
  assert.equal(unreachable.warnings.some((warning) => warning.code === "UNREACHABLE_ROUTE"), true);

  writeEvidence("unreachable-route-output.json", {
    issue: "221",
    status: "passed",
    invalidStatus: invalid.status,
    unreachableStatus: unreachable.status,
    invalidWarningCodes: invalid.warnings.map((warning) => warning.code),
    unreachableWarningCodes: unreachable.warnings.map((warning) => warning.code)
  });
});

test("route preview builder excludes blocked edges", () => {
  const plan = clone(readPlan(1));
  plan.pathEdges.push({
    id: "edge-blocked-shortcut",
    fromNodeId: "node-station-primary",
    toNodeId: "node-door-room-01",
    lengthFeet: 1,
    hallwayWidthFeet: 10,
    congestionFactor: 1,
    doorPenaltySeconds: 0,
    turnPenaltySeconds: 0,
    blocked: true
  });

  const route = buildRoutePreview(plan, input(plan, "node-station-primary", "node-door-room-01"));
  assert.equal(route.status, "reachable");
  assert.equal(route.routeEdgeIds.includes("edge-blocked-shortcut"), false);
  assert.equal(route.warnings.some((warning) => warning.code === "BLOCKED_EDGE_EXCLUDED"), true);

  writeEvidence("blocked-edge-route-output.json", {
    issue: "221",
    status: "passed",
    blockedEdgeExcluded: true,
    routeEdgeIds: route.routeEdgeIds,
    warningCodes: route.warnings.map((warning) => warning.code)
  });
});
