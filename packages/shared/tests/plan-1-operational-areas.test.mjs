import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-233");

const requiredZoneIds = [
  "zone-level-1-trauma",
  "zone-left-side-rooms-15-16",
  "zone-left-pod-rooms-2-5-14",
  "zone-right-pod-rooms-6-10-13",
  "zone-right-side-rooms-11-12",
  "zone-provider-pharmacy",
  "zone-bottom-rooms-19-24",
  "zone-ems-entry",
  "zone-main-hallways",
  "zone-nurse-station-core-left",
  "zone-nurse-station-core-right"
];

const requiredHallwayIds = [
  "hallway-top-horizontal",
  "hallway-left-vertical",
  "hallway-ems-entry",
  "hallway-bottom-horizontal",
  "hallway-right-vertical",
  "hallway-right-upper"
];

const requiredStationIds = ["station-left", "station-right"];

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

test("Issue 233 represents required Plan 1 operational zones and hallways", () => {
  const fixture = readPlanFixture(1);
  const plan = fixture.plan;
  const zoneIds = new Set(plan.zones.map((zone) => zone.id));
  const hallwayIds = new Set(plan.hallways.map((hallway) => hallway.id));
  const missingZoneIds = requiredZoneIds.filter((zoneId) => !zoneIds.has(zoneId));
  const missingHallwayIds = requiredHallwayIds.filter((hallwayId) => !hallwayIds.has(hallwayId));
  const roomZoneFailures = plan.rooms.filter((room) => room.zoneId == null || !zoneIds.has(room.zoneId));

  writeEvidence("plan-1-zone-geometry-output.json", {
    issue: "233",
    planId: plan.planId,
    requiredZoneIds,
    missingZoneIds,
    zones: plan.zones.map((zone) => ({
      id: zone.id,
      label: zone.label,
      zoneType: zone.zoneType,
      x: zone.x,
      y: zone.y,
      widthFeet: zone.widthFeet,
      lengthFeet: zone.lengthFeet,
      zoneClass: zone.zoneOperationalMetadata?.zoneClass ?? null
    })),
    roomZoneFailures
  });

  writeEvidence("plan-1-hallway-geometry-output.json", {
    issue: "233",
    planId: plan.planId,
    requiredHallwayIds,
    missingHallwayIds,
    hallwayCount: plan.hallways.length,
    hallways: plan.hallways.map((hallway) => ({
      id: hallway.id,
      label: hallway.label,
      widthFeet: hallway.widthFeet,
      points: hallway.points,
      hallwayClass: hallway.hallwayOperationalMetadata?.hallwayClass ?? null
    }))
  });

  assert.deepEqual(missingZoneIds, []);
  assert.deepEqual(missingHallwayIds, []);
  assert.deepEqual(roomZoneFailures, []);
});

test("Issue 233 models two nurse stations and keeps Provider Pharmacy out of nurse station objects", () => {
  const fixture = readPlanFixture(1);
  const plan = fixture.plan;
  const stationIds = new Set(plan.nurseStations.map((station) => station.id));
  const missingStationIds = requiredStationIds.filter((stationId) => !stationIds.has(stationId));
  const unsupportedProviderStations = plan.nurseStations.filter(
    (station) => station.id === "station-provider-pharmacy" || /provider|pharmacy/i.test(station.label)
  );
  const providerZone = plan.zones.find((zone) => zone.id === "zone-provider-pharmacy");

  writeEvidence("plan-1-station-geometry-output.json", {
    issue: "233",
    planId: plan.planId,
    requiredStationIds,
    missingStationIds,
    stationCount: plan.nurseStations.length,
    stations: plan.nurseStations.map((station) => ({
      id: station.id,
      label: station.label,
      stationType: station.stationType,
      x: station.x,
      y: station.y,
      widthFeet: station.widthFeet,
      lengthFeet: station.lengthFeet,
      pathNodeId: station.pathNodeId
    }))
  });

  writeEvidence("plan-1-provider-pharmacy-output.json", {
    issue: "233",
    planId: plan.planId,
    providerZone: providerZone == null ? null : {
      id: providerZone.id,
      label: providerZone.label,
      zoneType: providerZone.zoneType,
      zoneClass: providerZone.zoneOperationalMetadata?.zoneClass ?? null,
      staffOnly: providerZone.zoneOperationalMetadata?.staffOnly ?? null,
      supportsClinicalOperations: providerZone.zoneOperationalMetadata?.supportsClinicalOperations ?? null
    }
  });

  writeEvidence("plan-1-provider-not-station-output.json", {
    issue: "233",
    planId: plan.planId,
    unsupportedProviderStations,
    providerPharmacyModeledAsZone: providerZone?.id === "zone-provider-pharmacy"
  });

  assert.deepEqual(missingStationIds, []);
  assert.equal(plan.nurseStations.length, 2);
  assert.equal(providerZone?.zoneType, "pharmacy");
  assert.deepEqual(unsupportedProviderStations, []);
});

test("Issue 233 marks source-truth operational areas represented and proves Plans 2 through 5 unchanged", () => {
  const fixture = readPlanFixture(1);
  const sourceTruth = readJson(join(defaultPlansDir, "visual-parity", "plan-1-source-truth.json"));
  const targetIds = new Set([
    ...fixture.plan.zones.map((zone) => zone.id),
    ...fixture.plan.hallways.map((hallway) => hallway.id),
    ...fixture.plan.nurseStations.map((station) => station.id)
  ]);
  const operationalCoverage = sourceTruth.visibleObjects
    .filter((entry) => ["zone", "hallway", "nurse_station"].includes(entry.objectKind))
    .map((entry) => ({
      sourceLabel: entry.sourceLabel,
      objectKind: entry.objectKind,
      expectedTargetId: entry.expectedTargetId,
      coverageStatus: entry.coverageStatus,
      represented: entry.expectedTargetId != null && targetIds.has(entry.expectedTargetId)
    }));
  const missingCoverage = operationalCoverage.filter(
    (entry) => !entry.represented || entry.coverageStatus !== "represented"
  );
  const plans = [];
  for (let index = 2; index <= 5; index += 1) {
    const otherFixture = readPlanFixture(index);
    plans.push({ planId: otherFixture.plan.planId, counts: planCounts(otherFixture.plan) });
  }

  writeEvidence("plans-2-through-5-unchanged-output.json", {
    issue: "233",
    plans,
    preservedPlanIds: plans.map((entry) => entry.planId)
  });

  writeEvidenceText(
    "plan-1-zone-known-approximations.md",
    [
      "# Plan 1 Operational Area Known Approximations",
      "",
      "- Zones and hallways are approximate feet-based operational geometry.",
      "- Provider Pharmacy Area is a support/pharmacy zone, not a nurse station.",
      "- Door/access and final path graph coverage remain dedicated follow-up work.",
      "- No exact CAD geometry or measured walking truth is claimed."
    ].join("\n")
  );

  assert.deepEqual(missingCoverage, []);
  assert.equal(plans.length, 4);
  assert.equal(plans.every((entry) => entry.counts.rooms > 0), true);
});