import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildWalkingBaseline,
  validateWalkingBaselineContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-223");

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function routePreview(status, destinationPathNodeId, distance = 10, seconds = 5) {
  return {
    schemaVersion: "1.0.0",
    planId: "default-er-layout-plan-1",
    originPathNodeId: "node-station-primary",
    destinationPathNodeId,
    status,
    routeNodeIds: status === "reachable" ? ["node-station-primary", destinationPathNodeId] : [],
    routeEdgeIds: status === "reachable" ? [`edge-${destinationPathNodeId}`] : [],
    totalDistanceFeet: status === "reachable" ? distance : 0,
    totalTravelSeconds: status === "reachable" ? seconds : 0,
    warnings: status === "reachable" ? [] : [{ code: "UNREACHABLE_ROUTE", message: "No usable graph route connects the selected path nodes." }],
    limitations: ["Approximate operational graph preview only."]
  };
}

test("walking baseline builder derives deterministic summaries from route previews", () => {
  const baseline = buildWalkingBaseline({
    baselineId: "baseline-default-er-layout-plan-1",
    planId: "default-er-layout-plan-1",
    groups: [
      {
        groupId: "primary-station-to-rooms",
        label: "Primary station to rooms",
        routePreviews: [routePreview("reachable", "node-door-room-01"), routePreview("reachable", "node-door-room-02", 20, 9)]
      }
    ]
  });
  const repeated = buildWalkingBaseline({
    baselineId: "baseline-default-er-layout-plan-1",
    planId: "default-er-layout-plan-1",
    groups: [
      {
        groupId: "primary-station-to-rooms",
        label: "Primary station to rooms",
        routePreviews: [routePreview("reachable", "node-door-room-01"), routePreview("reachable", "node-door-room-02", 20, 9)]
      }
    ]
  });

  assert.deepEqual(baseline, repeated);
  assert.equal(baseline.totalRouteCount, 2);
  assert.equal(baseline.reachableRouteCount, 2);
  assert.equal(baseline.totalDistanceFeet, 30);
  assert.equal(baseline.totalTravelSeconds, 14);

  writeEvidence("walking-baseline-contract-output.json", {
    issue: "223",
    status: "passed",
    deterministic: true,
    totalRouteCount: baseline.totalRouteCount,
    totalDistanceFeet: baseline.totalDistanceFeet
  });
});

test("walking baseline counts unreachable routes and requires limitations", () => {
  const baseline = buildWalkingBaseline({
    baselineId: "baseline-default-er-layout-plan-1",
    planId: "default-er-layout-plan-1",
    groups: [
      {
        groupId: "mixed-routes",
        label: "Mixed routes",
        routePreviews: [routePreview("reachable", "node-door-room-01"), routePreview("unreachable", "node-door-room-99")]
      }
    ]
  });

  assert.equal(baseline.totalRouteCount, 2);
  assert.equal(baseline.reachableRouteCount, 1);
  assert.equal(baseline.unreachableRouteCount, 1);
  assert.ok(baseline.limitations.length > 0);
  assert.ok(baseline.warnings.length > 0);

  writeEvidence("walking-baseline-limitations-output.json", {
    issue: "223",
    status: "passed",
    unreachableRouteCount: baseline.unreachableRouteCount,
    limitationsRequired: true,
    warningCodes: baseline.warnings.map((warning) => warning.code)
  });
});

test("walking baseline validator rejects inconsistent counts, distances, and missing limitations", () => {
  const valid = buildWalkingBaseline({
    baselineId: "baseline-default-er-layout-plan-1",
    planId: "default-er-layout-plan-1",
    groups: [
      {
        groupId: "primary-station-to-rooms",
        label: "Primary station to rooms",
        routePreviews: [routePreview("reachable", "node-door-room-01")]
      }
    ]
  });

  assert.throws(
    () => validateWalkingBaselineContract({ ...valid, totalRouteCount: 99 }),
    /totalRouteCount must equal/
  );
  assert.throws(
    () => validateWalkingBaselineContract({ ...valid, totalDistanceFeet: 99 }),
    /totalDistanceFeet must equal/
  );
  assert.throws(
    () => validateWalkingBaselineContract({ ...valid, limitations: [] }),
    /limitations requires at least one entry/
  );

  writeEvidence("walking-baseline-negative-output.json", {
    issue: "223",
    status: "passed",
    rejectedInconsistentCounts: true,
    rejectedInconsistentDistance: true,
    rejectedMissingLimitations: true
  });
});
