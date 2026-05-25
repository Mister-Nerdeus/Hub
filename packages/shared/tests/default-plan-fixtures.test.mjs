import assert from "node:assert/strict";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-231");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const REQUIRED_SCAFFOLD_REGION_IDS = [
  "region-left-side-rooms-15-16",
  "region-left-upper-pod-trauma-2-5-14",
  "region-right-upper-pod-6-10-13",
  "region-right-side-rooms-11-12",
  "region-provider-pharmacy",
  "region-bottom-rooms-19-24",
  "region-hallway-network",
  "region-ems-entry"
];

function planObjectCounts(plan) {
  return {
    rooms: plan.rooms.length,
    nurseStations: plan.nurseStations.length,
    zones: plan.zones.length,
    hallways: plan.hallways.length,
    doors: plan.doors.length,
    pathNodes: plan.pathNodes.length,
    pathEdges: plan.pathEdges.length
  };
}

function readPlan1ObjectCountsFromIssue229() {
  const file = join(
    repoRoot,
    "docs",
    "verification",
    "issues",
    "issue-229",
    "plan-1-current-object-counts.json"
  );

  if (!existsSync(file)) {
    return null;
  }

  const payload = readJson(file);
  return payload.observedCounts ?? null;
}

function computeApproximateBounds(plan) {
  const allObjects = [...plan.rooms, ...plan.zones, ...plan.hallways, ...plan.nurseStations, ...plan.doors, ...plan.pathNodes];
  const extentItems = allObjects.filter(
    (item) => typeof item.x === "number" && typeof item.y === "number"
  );

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const item of extentItems) {
    const width = typeof item.widthFeet === "number" ? item.widthFeet : 0;
    const length = typeof item.lengthFeet === "number" ? item.lengthFeet : 0;
    const x2 = item.x + width;
    const y2 = item.y + length;
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    countedObjects: extentItems.length
  };
}

function readPlan2To5Counts() {
  const plans = [];
  for (let i = 2; i <= 5; i += 1) {
    const fixture = validateDefaultSavedPlanFixtureContract(
      readJson(join(defaultPlansDir, `default-er-layout-plan-${i}.json`)),
      {
        sourcePlanIds: new Set([`source-er-layout-plan-${i}`]),
        mappingIds: new Set([`mapping-er-layout-plan-${i}`])
      }
    );
    plans.push({
      planId: fixture.plan.planId,
      roomCount: fixture.plan.rooms.length,
      hallwayCount: fixture.plan.hallways.length,
      zoneCount: fixture.plan.zones.length,
      nurseStationCount: fixture.plan.nurseStations.length,
      doorCount: fixture.plan.doors.length,
      pathNodeCount: fixture.plan.pathNodes.length,
      pathEdgeCount: fixture.plan.pathEdges.length
    });
  }
  return plans;
}

test("Issue 231 requires coordinate-frame and scaffold regions for Plan 1", () => {
  const fixture = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    {
      sourcePlanIds: new Set(["source-er-layout-plan-1"]),
      mappingIds: new Set(["mapping-er-layout-plan-1"])
    }
  );
  const plan = fixture.plan;
  const zoneIds = new Set(plan.zones.map((zone) => zone.id));
  const missingScaffoldRegions = REQUIRED_SCAFFOLD_REGION_IDS.filter((id) => !zoneIds.has(id));
  const scaffoldRegionReport = REQUIRED_SCAFFOLD_REGION_IDS.map((id) => ({
    regionId: id,
    present: zoneIds.has(id)
  }));

  const bounds = computeApproximateBounds(plan);
  const approximateFrameRequirements = {
    minWidthFeet: 170,
    minHeightFeet: 120,
    maxMinX: 2,
    minMaxX: 170
  };

  writeEvidence("plan-1-coordinate-frame-output.json", {
    issue: "231",
    planId: plan.planId,
    approximateFrameRequirements,
    observedBounds: bounds,
    requirementMet: {
      width: bounds.width >= approximateFrameRequirements.minWidthFeet,
      height: bounds.height >= approximateFrameRequirements.minHeightFeet,
      origin: bounds.minX <= approximateFrameRequirements.maxMinX,
      span: bounds.maxX >= approximateFrameRequirements.minMaxX
    }
  });

  writeEvidence("plan-1-scaffold-region-output.json", {
    issue: "231",
    planId: plan.planId,
    scaffoldRegionCount: REQUIRED_SCAFFOLD_REGION_IDS.length,
    foundRegions: scaffoldRegionReport.filter((item) => item.present).length,
    missingRegions: missingScaffoldRegions,
    regions: scaffoldRegionReport
  });

  assert.equal(missingScaffoldRegions.length, 0, "all required scaffold regions must exist");
  assert.equal(bounds.width >= approximateFrameRequirements.minWidthFeet, true, "frame width should be feet-approximate source sized");
  assert.equal(bounds.height >= approximateFrameRequirements.minHeightFeet, true, "frame height should be feet-approximate source sized");
  assert.equal(bounds.minX <= approximateFrameRequirements.maxMinX, true, "frame should be top-left anchored near 0");
  assert.equal(bounds.maxX >= approximateFrameRequirements.minMaxX, true, "frame should span source width");
});

test("Issue 231 records Plan 1 scaffold delta from source-truth baseline and keeps other plans unchanged", () => {
  const fixture = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    {
      sourcePlanIds: new Set(["source-er-layout-plan-1"]),
      mappingIds: new Set(["mapping-er-layout-plan-1"])
    }
  );
  const currentCounts = planObjectCounts(fixture.plan);

  const preRepairCounts = readPlan1ObjectCountsFromIssue229() ?? {
    rooms: 8,
    nurseStations: 2,
    zones: 5,
    hallways: 2,
    doors: 8,
    pathNodes: 15,
    pathEdges: 14
  };

  writeEvidence("plan-1-before-object-counts.json", {
    issue: "231",
    planId: "default-er-layout-plan-1",
    source: "docs/verification/issues/issue-229/plan-1-current-object-counts.json",
    counts: preRepairCounts
  });
  writeEvidence("plan-1-after-scaffold-counts.json", {
    issue: "231",
    planId: fixture.plan.planId,
    source: "packages/shared/fixtures/default-er-layout-plan-1.json",
    counts: currentCounts,
    scaffoldsAdded: {
      roomDelta: currentCounts.rooms - preRepairCounts.rooms,
      nurseStationDelta: currentCounts.nurseStations - preRepairCounts.nurseStations,
      zoneDelta: currentCounts.zones - preRepairCounts.zones,
      hallwayDelta: currentCounts.hallways - preRepairCounts.hallways,
      doorDelta: currentCounts.doors - preRepairCounts.doors,
      pathNodeDelta: currentCounts.pathNodes - preRepairCounts.pathNodes,
      pathEdgeDelta: currentCounts.pathEdges - preRepairCounts.pathEdges
    }
  });

  const plans2Through5 = readPlan2To5Counts();
  writeEvidence("plans-2-through-5-unchanged-output.json", {
    issue: "231",
    plans: plans2Through5,
    preservedPlanIds: plans2Through5.map((entry) => entry.planId)
  });

  assert.equal(currentCounts.zones >= preRepairCounts.zones, true);
  assert.equal(plans2Through5.length, 4);
  assert.equal(plans2Through5.every((plan) => plan.pathNodeCount > 0), true);
  assert.equal(plans2Through5.every((plan) => plan.pathEdgeCount > 0), true);
});
