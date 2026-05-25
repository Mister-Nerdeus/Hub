import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  annotateRoutePreviewWithPathMetadata,
  buildRoutePreview
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-225");

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

function firstRoomPathNodeId(plan) {
  const room = plan.rooms.find((entry) => entry.pathNodeId != null);
  assert.ok(room?.pathNodeId);
  return room.pathNodeId;
}

test("metadata adapter annotates route edges without changing route selection or totals", () => {
  const plan = readPlan(1);
  const route = buildRoutePreview(plan, input(plan, "node-station-primary", firstRoomPathNodeId(plan)));
  const annotated = annotateRoutePreviewWithPathMetadata(plan, route);

  assert.deepEqual(annotated.routePreview.routeEdgeIds, route.routeEdgeIds);
  assert.deepEqual(annotated.routePreview.routeNodeIds, route.routeNodeIds);
  assert.equal(annotated.routePreview.totalDistanceFeet, route.totalDistanceFeet);
  assert.equal(annotated.routePreview.totalTravelSeconds, route.totalTravelSeconds);
  assert.equal(annotated.metadataAnnotations.length, route.routeEdgeIds.length);
  assert.equal(annotated.metadataAnnotations.some((annotation) => annotation.hallwayId != null), true);
  assert.equal(annotated.metadataAnnotations.some((annotation) => annotation.doorId != null), true);

  writeEvidence("metadata-travel-adapter-output.json", {
    issue: "225",
    status: "passed",
    annotationCount: annotated.metadataAnnotations.length,
    annotations: annotated.metadataAnnotations
  });
  writeEvidence("route-selection-stability-output.json", {
    issue: "225",
    status: "passed",
    routeEdgeIdsUnchanged: true,
    routeNodeIdsUnchanged: true,
    totalDistanceFeetUnchanged: true,
    totalTravelSecondsUnchanged: true
  });
});

test("metadata adapter handles missing metadata safely and remains deterministic", () => {
  const plan = clone(readPlan(1));
  for (const hallway of plan.hallways) {
    hallway.hallwayOperationalMetadata = null;
  }
  for (const door of plan.doors) {
    door.doorOperationalMetadata = null;
  }
  const route = buildRoutePreview(plan, input(plan, "node-station-primary", firstRoomPathNodeId(plan)));
  const first = annotateRoutePreviewWithPathMetadata(plan, route);
  const second = annotateRoutePreviewWithPathMetadata(plan, route);

  assert.deepEqual(first, second);
  assert.equal(first.metadataAnnotations.every((annotation) => annotation.limitations.length > 0), true);
  assert.equal(first.metadataAnnotations.some((annotation) => annotation.hallwayClass != null), false);
  assert.equal(first.metadataAnnotations.some((annotation) => annotation.doorClass != null), false);

  writeEvidence("metadata-adapter-limitations-output.json", {
    issue: "225",
    status: "passed",
    deterministic: true,
    missingMetadataHandled: true,
    limitations: first.limitations
  });
});
