import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { auditDefaultPlanPathEdgeCoverage } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-219");

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

test("all default plans pass path-edge coverage audit", () => {
  const audits = [1, 2, 3, 4, 5].map((index) => auditDefaultPlanPathEdgeCoverage(readPlan(index)));
  for (const audit of audits) {
    assert.equal(audit.status, "passed", `${audit.planId} gaps: ${JSON.stringify(audit.gaps)}`);
    assert.equal(audit.gaps.length, 0);
    assert.ok(audit.counts.usablePathEdges > 0);
    assert.equal(audit.counts.requiredOperationalNodes, audit.counts.connectedRequiredOperationalNodes);
  }

  writeEvidence("default-plan-path-edge-coverage-output.json", {
    issue: "219",
    status: "passed",
    audits
  });
});

test("path-edge coverage audit reports broken, isolated, disconnected, and blocked graph cases", () => {
  const cases = [];

  const brokenFromNode = clone(readPlan(1));
  brokenFromNode.pathEdges[0].fromNodeId = "node-missing";
  cases.push(["broken fromNodeId", brokenFromNode, "BROKEN_FROM_NODE"]);

  const brokenToNode = clone(readPlan(1));
  brokenToNode.pathEdges[0].toNodeId = "node-missing";
  cases.push(["broken toNodeId", brokenToNode, "BROKEN_TO_NODE"]);

  const plan1 = readPlan(1);
  const firstRoomPathNodeId = plan1.rooms.find((room) => room.pathNodeId != null)?.pathNodeId;
  assert.ok(firstRoomPathNodeId);
  const isolatedRoomDoor = removeIncidentUsableEdges(plan1, firstRoomPathNodeId);
  cases.push(["isolated room door", isolatedRoomDoor, "REQUIRED_NODE_WITHOUT_USABLE_EDGE"]);

  const isolatedStation = removeIncidentUsableEdges(readPlan(1), "node-station-primary");
  cases.push(["isolated station", isolatedStation, "REQUIRED_NODE_WITHOUT_USABLE_EDGE"]);

  const isolatedEntry = removeIncidentUsableEdges(readPlan(1), "node-entry-ems");
  cases.push(["isolated EMS entry", isolatedEntry, "REQUIRED_NODE_WITHOUT_USABLE_EDGE"]);

  const disconnectedHallway = removeIncidentUsableEdges(readPlan(1), "node-hall-ems-entry");
  cases.push(["disconnected hallway component", disconnectedHallway, "REQUIRED_NODE_WITHOUT_USABLE_EDGE"]);

  const blockedBetweenComponents = clone(readPlan(1));
  for (const edge of blockedBetweenComponents.pathEdges) {
    if (edge.id === "edge-hall-west-mid") {
      edge.blocked = true;
    }
  }
  cases.push(["all paths blocked between components", blockedBetweenComponents, "REQUIRED_NODE_DISCONNECTED"]);

  const negativeResults = cases.map(([name, plan, expectedCode]) => {
    const audit = auditDefaultPlanPathEdgeCoverage(plan);
    assert.equal(audit.status, "failed", name);
    assert.equal(audit.gaps.some((gap) => gap.code === expectedCode), true, name);
    return {
      name,
      expectedCode,
      blockedPathEdges: audit.counts.blockedPathEdges,
      gapCodes: audit.gaps.map((gap) => gap.code)
    };
  });

  writeEvidence("disconnected-graph-negative-output.json", {
    issue: "219",
    status: "passed",
    negativeResults
  });
  writeEvidence("blocked-edge-connectivity-output.json", {
    issue: "219",
    status: "passed",
    blockedCase: negativeResults.find((result) => result.name === "all paths blocked between components")
  });
});

function removeIncidentUsableEdges(planValue, nodeId) {
  const plan = clone(planValue);
  plan.pathEdges = plan.pathEdges.filter(
    (edge) => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId
  );
  return plan;
}
