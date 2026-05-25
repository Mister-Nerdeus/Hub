import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  auditPlan1VisualParityGaps,
  validateDefaultSavedPlanFixtureContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-230");
const sourceTruthPath = join(defaultPlansDir, "visual-parity", "plan-1-source-truth.json");
const requiredScaffoldRegionIds = new Set([
  "region-left-side-rooms-15-16",
  "region-left-upper-pod-trauma-2-5-14",
  "region-right-upper-pod-6-10-13",
  "region-right-side-rooms-11-12",
  "region-provider-pharmacy",
  "region-bottom-rooms-19-24",
  "region-hallway-network",
  "region-ems-entry"
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function planInventory(plan) {
  return {
    planId: plan.planId,
    createdAt: plan.createdAt,
    rooms: plan.rooms.map((room) => ({
      id: room.id,
      label: room.label,
      roomNumber: room.roomOperationalMetadata?.roomNumber ?? null,
      zoneId: room.zoneId,
      pathNodeId: room.pathNodeId,
      doorId: room.id.replace("room-", "door-room-")
    })),
    nurseStations: plan.nurseStations.map((station) => ({
      id: station.id,
      label: station.label,
      stationType: station.stationType,
      pathNodeId: station.pathNodeId
    })),
    zones: plan.zones.map((zone) => ({
      id: zone.id,
      label: zone.label,
      zoneType: zone.zoneType
    })),
    hallways: plan.hallways.map((hallway) => ({
      id: hallway.id,
      label: hallway.label,
      widthFeet: hallway.widthFeet
    })),
    doors: plan.doors.map((door) => ({
      id: door.id,
      label: door.label,
      roomId: door.roomId,
      pathNodeId: door.pathNodeId
    })),
    pathNodes: {
      total: plan.pathNodes.length,
      entries: plan.pathNodes.filter((node) => node.nodeType === "entry").length,
      stationNodes: plan.pathNodes.filter((node) => node.nodeType === "station").length,
      hallwayNodes: plan.pathNodes.filter((node) => node.nodeType === "hallway").length,
      roomDoorNodes: plan.pathNodes.filter((node) => node.nodeType === "room_door").length
    },
    pathEdges: {
      total: plan.pathEdges.length,
      blocked: plan.pathEdges.filter((edge) => edge.blocked).length
    }
  };
}

function contractPlanCoverageSnapshot(contract) {
  return contract.visibleObjects.map((entry) => ({
    sourceLabel: entry.sourceLabel,
    objectKind: entry.objectKind,
    required: entry.required,
    expectedTargetId: entry.expectedTargetId ?? null,
    expectedRegionId: entry.expectedRegionId ?? null,
    coverageStatus: entry.coverageStatus
  }));
}

function readPlan2To5Fingerprints() {
  const plans = [];
  for (let index = 2; index <= 5; index += 1) {
    const fixture = validateDefaultSavedPlanFixtureContract(readJson(join(defaultPlansDir, `default-er-layout-plan-${index}.json`)), {
      sourcePlanIds: new Set([`source-er-layout-plan-${index}`]),
      mappingIds: new Set([`mapping-er-layout-plan-${index}`])
    });
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

test("Issue 230 emits Plan 1 source-truth gap report", () => {
  const sourceTruth = readJson(sourceTruthPath);
  const fixture = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    {
      sourcePlanIds: new Set(["source-er-layout-plan-1"]),
      mappingIds: new Set(["mapping-er-layout-plan-1"])
    }
  );
  const audit = auditPlan1VisualParityGaps(
    sourceTruth,
    fixture.plan,
    "packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json"
  );

  writeEvidence("plan-1-source-visible-inventory.json", {
    issue: "230",
    planId: sourceTruth.planId,
    sourceTruthRoomCount: audit.sourceTruthRoomCount,
    sourceTruthMinimumExpectedCounts: audit.sourceTruthMinimumExpectedCounts,
    visibleObjects: contractPlanCoverageSnapshot(sourceTruth)
  });

  writeEvidence("plan-1-current-fixture-inventory.json", {
    issue: "230",
    planId: fixture.plan.planId,
    auditMinimumCounts: audit.currentCounts,
    inventory: planInventory(fixture.plan)
  });

  writeEvidence("plan-1-missing-object-report.json", {
    issue: "230",
    planId: fixture.plan.planId,
    count: audit.missingRequiredObjects.length,
    report: audit.missingRequiredObjects
  });

  writeEvidence("plan-1-extra-object-report.json", {
    issue: "230",
    planId: fixture.plan.planId,
    count: audit.extraCurrentObjects.length,
    report: audit.extraCurrentObjects
  });

  writeEvidence("plan-1-mismatched-object-report.json", {
    issue: "230",
    planId: fixture.plan.planId,
    count: audit.mismatchedObjects.length,
    report: audit.mismatchedObjects
  });

  writeEvidence("plan-1-minimum-count-failure-output.json", {
    issue: "230",
    planId: fixture.plan.planId,
    observed: audit.currentCounts,
    required: audit.sourceTruthMinimumExpectedCounts,
    minimumCountFailures: audit.minimumCountFailures,
    providerPharmacyModelingFailures: audit.providerPharmacyModelingFailures,
    nurseStationCountFailures: audit.nurseStationCountFailures
  });

  writeEvidence("plan-1-provider-pharmacy-failure-output.json", {
    issue: "230",
    planId: fixture.plan.planId,
    providerPharmacyModelingFailures: audit.providerPharmacyModelingFailures,
    providerPharmacyZoneCount: fixture.plan.zones.filter((zone) => zone.id === "zone-provider-pharmacy").length,
    providerPharmacyStationIds: fixture.plan.nurseStations
      .filter((station) => station.id === "station-provider-pharmacy")
      .map((station) => station.id)
  });

  writeEvidence("plan-1-nurse-station-failure-output.json", {
    issue: "230",
    planId: fixture.plan.planId,
    nurseStationCountFailures: audit.nurseStationCountFailures,
    currentNurseStationIds: fixture.plan.nurseStations.map((station) => station.id),
    expectedMinimum: sourceTruth.minimumExpectedCounts.nurseStations
  });

  writeEvidence("plan-1-legacy-label-failure-output.json", {
    issue: "230",
    planId: fixture.plan.planId,
    unsupportedLegacyLabels: audit.unsupportedLegacyLabels,
    legacyObjectCount: audit.unsupportedLegacyLabels.length
  });

  const gapReportLines = [];
  gapReportLines.push(`# Plan 1 Gap Report (Issue 230)`);
  gapReportLines.push(`Plan ID: ${fixture.plan.planId}`);
  gapReportLines.push(`Current room count: ${fixture.plan.rooms.length}`);
  gapReportLines.push(`Current hallways: ${fixture.plan.hallways.length}`);
  gapReportLines.push(`Current nurse stations: ${fixture.plan.nurseStations.length}`);
  gapReportLines.push(`Current provider/pharmacy zones: ${fixture.plan.zones.filter((zone) => zone.id === "zone-provider-pharmacy").length}`);
  gapReportLines.push(`Current access points: ${fixture.plan.doors.length}`);
  gapReportLines.push(`Minimum count failures:`);
  for (const failure of audit.minimumCountFailures) {
    gapReportLines.push(
      `- ${failure.category}: minimum=${failure.minimum}, observed=${failure.observed}, shortfall=${failure.shortfall}`
    );
  }

  gapReportLines.push(`Missing required objects:`);
  for (const item of audit.missingRequiredObjects) {
    gapReportLines.push(`- ${item.sourceLabel} (${item.objectKind}): ${item.issue}`);
  }

  gapReportLines.push(`Extra objects in current fixture:`);
  for (const item of audit.extraCurrentObjects) {
    gapReportLines.push(`- ${item.objectKind} ${item.objectId} (${item.label})`);
  }

  gapReportLines.push(`Mismatches:`);
  for (const item of audit.mismatchedObjects) {
    gapReportLines.push(
      `- ${item.sourceLabel} (${item.objectKind}): expected=${item.expectedTargetId}, actual=${item.actualTargetId}, issue=${item.issue}`
    );
  }
  gapReportLines.push(`Unsupported legacy labels:`);
  for (const item of audit.unsupportedLegacyLabels) {
    gapReportLines.push(`- ${item.objectKind} ${item.objectId} (${item.label})`);
  }
  gapReportLines.push(`Provider/pharmacy modeling failures:`);
  gapReportLines.push(...audit.providerPharmacyModelingFailures.map((failure) => `- ${failure}`));
  gapReportLines.push(`Nurse station count failures:`);
  gapReportLines.push(...audit.nurseStationCountFailures.map((failure) => `- ${failure}`));
  writeEvidence("plan-1-gap-report.md", gapReportLines.join("\n"));

  const knownObjectKinds = new Set(audit.missingRequiredObjects.map((entry) => entry.objectKind));
  assert.equal(sourceTruth.planId, "default-er-layout-plan-1");
  assert.equal(audit.planId, "default-er-layout-plan-1");
  assert.equal(audit.sourceTruthPath, "packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json");
  assert.equal(audit.sourceTruthRoomCount > 0, true);
  assert.equal(sourceTruth.minimumExpectedCounts.rooms, 23);
  assert.equal(knownObjectKinds.has("room") || audit.minimumCountFailures.length > 0, true);
});

test("Issue 230 captures unchanged proof for plans 2 through 5", () => {
  const plans = readPlan2To5Fingerprints();
  writeEvidence("plans-2-through-5-unchanged-output.json", {
    issue: "230",
    plans,
    count: plans.length,
    preservedPlanIds: plans.map((plan) => plan.planId)
  });

  assert.equal(plans.length, 4);
  assert.equal(plans.every((plan) => plan.roomCount > 0), true);
  assert.equal(plans.every((plan) => plan.nurseStationCount > 0), true);
  assert.equal(plans.every((plan) => plan.pathNodeCount > 0), true);
  assert.equal(plans.every((plan) => plan.pathEdgeCount > 0), true);
});

test("Issue 231 confirms Plan 1 scaffold regions are present for future geometry repair", () => {
  const fixture = validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    {
      sourcePlanIds: new Set(["source-er-layout-plan-1"]),
      mappingIds: new Set(["mapping-er-layout-plan-1"])
    }
  );

  const zoneIds = new Set(fixture.plan.zones.map((zone) => zone.id));
  for (const regionId of requiredScaffoldRegionIds) {
    assert.equal(zoneIds.has(regionId), true);
  }
});
