import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  auditDefaultPlanPathEdgeCoverage,
  auditDefaultPlanPathNodeCoverage,
  buildRoutePreview,
  validateDefaultSavedPlanFixtureContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-235");

const requiredHallwayNodeIds = [
  "node-entry-ems",
  "node-hall-ems-entry",
  "node-hallway-top-horizontal",
  "node-hallway-left-vertical",
  "node-hallway-bottom-horizontal",
  "node-hallway-right-vertical",
  "node-hallway-right-upper"
];

const requiredSupportNodeIds = ["node-station-left", "node-station-right", "node-zone-provider-pharmacy"];

const requiredGraphEdgeIds = [
  "edge-entry-hall-west",
  "edge-hall-ems-entry-anchor",
  "edge-hallway-top-anchor",
  "edge-hallway-left-anchor",
  "edge-hallway-bottom-anchor",
  "edge-hallway-right-anchor",
  "edge-hallway-right-upper-anchor",
  "edge-ems-entry-bottom-hallway",
  "edge-left-vertical-bottom-hallway",
  "edge-top-hallway-right-upper",
  "edge-right-upper-right-vertical",
  "edge-bottom-hallway-right-vertical",
  "edge-station-left-hall",
  "edge-station-right-hall",
  "edge-provider-pharmacy-hall"
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function writeEvidenceText(name, content) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${content}\n`);
}

function readPlanFixture(planNumber) {
  return validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, `default-er-layout-plan-${planNumber}.json`)),
    {
      sourcePlanIds: new Set([`source-er-layout-plan-${planNumber}`]),
      mappingIds: new Set([`mapping-er-layout-plan-${planNumber}`])
    }
  );
}

function routeInput(plan, originPathNodeId, destinationPathNodeId) {
  return { schemaVersion: "1.0.0", planId: plan.planId, originPathNodeId, destinationPathNodeId };
}

function planCounts(plan) {
  return {
    rooms: plan.rooms.length,
    hallways: plan.hallways.length,
    doors: plan.doors.length,
    nurseStations: plan.nurseStations.length,
    zones: plan.zones.length,
    pathNodes: plan.pathNodes.length,
    pathEdges: plan.pathEdges.length
  };
}

test("Issue 235 provides required path nodes for operational Plan 1 objects", () => {
  const fixture = readPlanFixture(1);
  const plan = fixture.plan;
  const pathNodeIds = new Set(plan.pathNodes.map((node) => node.id));
  const requiredDoorNodeIds = plan.doors.map((door) => door.pathNodeId).filter(Boolean).sort();
  const requiredPathNodeIds = [...requiredHallwayNodeIds, ...requiredSupportNodeIds, ...requiredDoorNodeIds];
  const missingPathNodeIds = requiredPathNodeIds.filter((nodeId) => !pathNodeIds.has(nodeId));
  const nodeCoverage = auditDefaultPlanPathNodeCoverage(plan);

  writeEvidence("plan-1-path-node-output.json", {
    issue: "235",
    planId: plan.planId,
    pathNodeCount: plan.pathNodes.length,
    requiredPathNodeIds,
    missingPathNodeIds,
    nodeCoverageStatus: nodeCoverage.status,
    nodeCoverageGaps: nodeCoverage.gaps
  });

  assert.deepEqual(missingPathNodeIds, []);
  assert.equal(nodeCoverage.status, "passed");
});

test("Issue 235 connects required operational nodes through usable path edges", () => {
  const fixture = readPlanFixture(1);
  const plan = fixture.plan;
  const edgeIds = new Set(plan.pathEdges.map((edge) => edge.id));
  const missingEdgeIds = requiredGraphEdgeIds.filter((edgeId) => !edgeIds.has(edgeId));
  const edgeCoverage = auditDefaultPlanPathEdgeCoverage(plan);
  const unreachableRequiredNodes = edgeCoverage.gaps.filter((gap) => gap.code.includes("DISCONNECTED"));

  writeEvidence("plan-1-path-edge-output.json", {
    issue: "235",
    planId: plan.planId,
    pathEdgeCount: plan.pathEdges.length,
    requiredGraphEdgeIds,
    missingEdgeIds,
    edgeCoverageStatus: edgeCoverage.status,
    edgeCoverageGaps: edgeCoverage.gaps
  });
  writeEvidence("plan-1-connectivity-output.json", {
    issue: "235",
    planId: plan.planId,
    requiredOperationalNodes: edgeCoverage.counts.requiredOperationalNodes,
    connectedRequiredOperationalNodes: edgeCoverage.counts.connectedRequiredOperationalNodes,
    usablePathEdges: edgeCoverage.counts.usablePathEdges,
    blockedPathEdges: edgeCoverage.counts.blockedPathEdges
  });
  writeEvidence("plan-1-unreachable-node-output.json", {
    issue: "235",
    planId: plan.planId,
    unreachableRequiredNodes
  });

  assert.deepEqual(missingEdgeIds, []);
  assert.equal(edgeCoverage.status, "passed");
  assert.equal(edgeCoverage.counts.requiredOperationalNodes, edgeCoverage.counts.connectedRequiredOperationalNodes);
  assert.deepEqual(unreachableRequiredNodes, []);
});

test("Issue 235 route probes and unchanged proof are captured", () => {
  const fixture = readPlanFixture(1);
  const plan = fixture.plan;
  const emsNode = plan.pathNodes.find((node) => node.id === "node-entry-ems");
  const traumaRoom = plan.rooms.find((room) => room.id === "room-level-1-trauma");
  const leftStation = plan.nurseStations.find((station) => station.id === "station-left");
  const rightStation = plan.nurseStations.find((station) => station.id === "station-right");
  const providerNode = plan.pathNodes.find((node) => node.id === "node-zone-provider-pharmacy");
  assert.ok(emsNode);
  assert.ok(traumaRoom?.pathNodeId);
  assert.ok(leftStation?.pathNodeId);
  assert.ok(rightStation?.pathNodeId);
  assert.ok(providerNode);

  const probes = [
    ["ems-entry-to-trauma", emsNode.id, traumaRoom.pathNodeId],
    ["left-station-to-room-15", leftStation.pathNodeId, "node-door-room-15"],
    ["right-station-to-room-12", rightStation.pathNodeId, "node-door-room-12"],
    ["provider-pharmacy-to-room-17", providerNode.id, "node-door-room-17"]
  ].map(([probeId, originPathNodeId, destinationPathNodeId]) => {
    const route = buildRoutePreview(plan, routeInput(plan, originPathNodeId, destinationPathNodeId));
    return {
      probeId,
      originPathNodeId,
      destinationPathNodeId,
      status: route.status,
      totalDistanceFeet: route.totalDistanceFeet,
      routeEdgeIds: route.routeEdgeIds
    };
  });
  const plans = [];
  for (let index = 2; index <= 5; index += 1) {
    const otherFixture = readPlanFixture(index);
    plans.push({ planId: otherFixture.plan.planId, counts: planCounts(otherFixture.plan) });
  }

  writeEvidence("plan-1-path-coverage-output.json", {
    issue: "235",
    planId: plan.planId,
    probes
  });
  writeEvidence("plans-2-through-5-unchanged-output.json", {
    issue: "235",
    plans,
    preservedPlanIds: plans.map((entry) => entry.planId)
  });
  writeEvidenceText(
    "plan-1-path-known-approximations.md",
    [
      "# Plan 1 Path Graph Known Approximations",
      "",
      "- Path nodes and edges are approximate operational routing links.",
      "- Distances are feet-based estimates from fixture geometry, not measured walking truth.",
      "- Walking baseline route groups are rebuilt in Issue 236.",
      "- No exact CAD geometry is claimed."
    ].join("\n")
  );

  assert.equal(probes.every((probe) => probe.status === "reachable"), true);
  assert.equal(plans.length, 4);
  assert.equal(plans.every((entry) => entry.counts.pathNodes > 0), true);
});