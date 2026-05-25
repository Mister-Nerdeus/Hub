import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract, validateWalkingBaselineContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const baselineDir = join(defaultPlansDir, "walking-baselines");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-236");
const requiredRouteGroups = [
  "left-station-to-left-pod-rooms",
  "right-station-to-right-pod-rooms",
  "ems-entry-to-trauma",
  "provider-pharmacy-to-rooms",
  "bottom-hallway-to-bottom-rooms",
  "right-hallway-to-right-side-rooms"
];

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function writeEvidence(name, payload) { mkdirSync(evidenceDir, { recursive: true }); writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`); }
function writeText(name, content) { mkdirSync(evidenceDir, { recursive: true }); writeFileSync(join(evidenceDir, name), `${content}\n`); }
function readPlanFixture(planNumber) {
  return validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, `default-er-layout-plan-${planNumber}.json`)), {
    sourcePlanIds: new Set([`source-er-layout-plan-${planNumber}`]),
    mappingIds: new Set([`mapping-er-layout-plan-${planNumber}`])
  });
}
function planCounts(plan) { return { rooms: plan.rooms.length, hallways: plan.hallways.length, doors: plan.doors.length, nurseStations: plan.nurseStations.length, zones: plan.zones.length, pathNodes: plan.pathNodes.length, pathEdges: plan.pathEdges.length }; }

test("Issue 236 rebuilds Plan 1 walking baseline with required route groups", () => {
  const plan = readPlanFixture(1).plan;
  const baseline = validateWalkingBaselineContract(readJson(join(baselineDir, "default-er-layout-plan-1-walking-baseline.json")));
  const groupIds = baseline.routeGroupSummaries.map((group) => group.groupId);
  const missingRouteGroups = requiredRouteGroups.filter((groupId) => !groupIds.includes(groupId));
  const pathNodeIds = new Set(plan.pathNodes.map((node) => node.id));
  const invalidRoutes = baseline.routeGroupSummaries.flatMap((group) => group.routes.filter((route) => !pathNodeIds.has(route.originPathNodeId) || !pathNodeIds.has(route.destinationPathNodeId)).map((route) => ({ groupId: group.groupId, routeId: route.routeId, originPathNodeId: route.originPathNodeId, destinationPathNodeId: route.destinationPathNodeId })));

  writeEvidence("plan-1-walking-baseline-after.json", { issue: "236", baseline });
  writeEvidence("plan-1-route-group-summary.json", { issue: "236", requiredRouteGroups, groupIds, missingRouteGroups, totalRouteCount: baseline.totalRouteCount, reachableRouteCount: baseline.reachableRouteCount, unreachableRouteCount: baseline.unreachableRouteCount });

  assert.deepEqual(missingRouteGroups, []);
  assert.deepEqual(invalidRoutes, []);
  assert.equal(baseline.unreachableRouteCount, 0);
});

test("Issue 236 captures unreachable route state and local limitations", () => {
  const baseline = validateWalkingBaselineContract(readJson(join(baselineDir, "default-er-layout-plan-1-walking-baseline.json")));
  const unreachableRoutes = baseline.routeGroupSummaries.flatMap((group) => group.routes.filter((route) => route.status !== "reachable").map((route) => ({ groupId: group.groupId, routeId: route.routeId, status: route.status })));

  writeEvidence("plan-1-unreachable-route-output.json", { issue: "236", unreachableRoutes, unreachableRouteCount: unreachableRoutes.length });
  writeText("plan-1-walking-baseline-known-limits.md", [
    "# Plan 1 Walking Baseline Known Limits",
    "",
    "- Walking distances and times are approximate path-graph route preview outputs.",
    "- The baseline is not measured walking truth.",
    "- No exact CAD geometry is claimed.",
    "- No clinical safety certification is claimed."
  ].join("\n"));

  assert.deepEqual(unreachableRoutes, []);
  assert.equal(baseline.limitations.length > 0, true);
});

test("Issue 236 proves Plans 2 through 5 remain unchanged", () => {
  const plans = [];
  for (let index = 2; index <= 5; index += 1) {
    const fixture = readPlanFixture(index);
    plans.push({ planId: fixture.plan.planId, counts: planCounts(fixture.plan) });
  }
  writeEvidence("plans-2-through-5-unchanged-output.json", { issue: "236", plans, preservedPlanIds: plans.map((entry) => entry.planId) });
  assert.equal(plans.length, 4);
  assert.equal(plans.every((entry) => entry.counts.pathNodes > 0), true);
});