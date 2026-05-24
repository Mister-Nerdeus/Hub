import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateRoutePreviewInput,
  validateRoutePreviewOutput,
  ROUTE_PREVIEW_LIMITATIONS
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-220");

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function reachableOutput() {
  return {
    schemaVersion: "1.0.0",
    planId: "default-er-layout-plan-1",
    originPathNodeId: "node-entry-ems",
    destinationPathNodeId: "node-door-level-1-trauma",
    status: "reachable",
    routeNodeIds: ["node-entry-ems", "node-hall-west", "node-door-level-1-trauma"],
    routeEdgeIds: ["edge-entry-hall-west", "edge-trauma-hall-west"],
    totalDistanceFeet: 62,
    totalTravelSeconds: 14.091,
    warnings: [
      {
        code: "APPROXIMATE_GRAPH_ONLY",
        message: "Route preview uses approximate fixture graph edges."
      }
    ],
    limitations: [...ROUTE_PREVIEW_LIMITATIONS]
  };
}

test("route preview input and reachable output validate", () => {
  const input = validateRoutePreviewInput({
    schemaVersion: "1.0.0",
    planId: "default-er-layout-plan-1",
    originPathNodeId: "node-entry-ems",
    destinationPathNodeId: "node-door-level-1-trauma"
  });
  const output = validateRoutePreviewOutput(reachableOutput());

  assert.equal(input.schemaVersion, "1.0.0");
  assert.equal(output.status, "reachable");

  writeEvidence("route-preview-contract-output.json", {
    issue: "220",
    status: "passed",
    inputValidated: true,
    reachableOutputValidated: true,
    requiredStatusValues: ["reachable", "unreachable", "invalid"]
  });
});

test("unreachable and invalid route preview outputs validate with limitations", () => {
  const unreachable = validateRoutePreviewOutput({
    ...reachableOutput(),
    status: "unreachable",
    routeNodeIds: [],
    routeEdgeIds: [],
    totalDistanceFeet: 0,
    totalTravelSeconds: 0,
    warnings: [
      {
        code: "UNREACHABLE_ROUTE",
        message: "No usable graph route connects the selected path nodes."
      }
    ]
  });
  const invalid = validateRoutePreviewOutput({
    ...reachableOutput(),
    originPathNodeId: "node-missing",
    status: "invalid",
    routeNodeIds: [],
    routeEdgeIds: [],
    totalDistanceFeet: 0,
    totalTravelSeconds: 0,
    warnings: [
      {
        code: "MISSING_ORIGIN_NODE",
        message: "Origin path node is missing from the plan graph."
      }
    ]
  });

  assert.equal(unreachable.status, "unreachable");
  assert.equal(invalid.status, "invalid");

  writeEvidence("route-preview-limitations-output.json", {
    issue: "220",
    status: "passed",
    limitationsRequired: true,
    unreachableValidated: true,
    invalidValidated: true
  });
});

test("route preview validators reject missing fields, negative totals, empty limitations, and malformed warnings", () => {
  assert.throws(
    () => validateRoutePreviewInput({ schemaVersion: "1.0.0", planId: "plan" }),
    /originPathNodeId/
  );
  assert.throws(
    () => validateRoutePreviewOutput({ ...reachableOutput(), totalDistanceFeet: -1 }),
    /totalDistanceFeet must be greater than or equal to 0/
  );
  assert.throws(
    () => validateRoutePreviewOutput({ ...reachableOutput(), totalTravelSeconds: -1 }),
    /totalTravelSeconds must be greater than or equal to 0/
  );
  assert.throws(
    () => validateRoutePreviewOutput({ ...reachableOutput(), routeNodeIds: [], routeEdgeIds: [] }),
    /reachable route preview requires/
  );
  assert.throws(
    () => validateRoutePreviewOutput({ ...reachableOutput(), limitations: [] }),
    /limitations requires at least one entry/
  );
  assert.throws(
    () => validateRoutePreviewOutput({ ...reachableOutput(), warnings: [{ code: "APPROXIMATE_GRAPH_ONLY" }] }),
    /warnings\[0\]\.message/
  );

  writeEvidence("route-preview-negative-output.json", {
    issue: "220",
    status: "passed",
    rejectedMissingFields: true,
    rejectedNegativeDistance: true,
    rejectedNegativeTime: true,
    rejectedEmptyLimitations: true,
    rejectedMalformedWarnings: true
  });
});
