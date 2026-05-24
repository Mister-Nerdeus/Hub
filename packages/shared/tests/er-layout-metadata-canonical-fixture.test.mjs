import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-206");

const metadataObjects = [
  "roomOperationalMetadata",
  "zoneOperationalMetadata",
  "hallwayOperationalMetadata",
  "doorOperationalMetadata",
  "stationOperationalMetadata",
  "entryOperationalMetadata",
  "overflowOperationalMetadata",
  "adjacencyOperationalMetadata"
];

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function metadataCounts(plan) {
  return {
    roomOperationalMetadata: plan.rooms.filter((room) => room.roomOperationalMetadata != null).length,
    zoneOperationalMetadata: plan.zones.filter((zone) => zone.zoneOperationalMetadata != null).length,
    hallwayOperationalMetadata: plan.hallways.filter((hallway) => hallway.hallwayOperationalMetadata != null)
      .length,
    doorOperationalMetadata: plan.doors.filter((door) => door.doorOperationalMetadata != null).length,
    stationOperationalMetadata: plan.nurseStations.filter(
      (station) => station.stationOperationalMetadata != null
    ).length,
    entryOperationalMetadata: plan.pathNodes.filter((node) => node.entryOperationalMetadata != null).length,
    overflowOperationalMetadata: plan.rooms.filter((room) => room.overflowOperationalMetadata != null).length,
    adjacencyOperationalMetadata: plan.rooms.filter((room) => room.adjacencyOperationalMetadata != null).length
  };
}

function room(plan, roomId) {
  return plan.rooms.find((candidate) => candidate.id === roomId);
}

test("canonical ER layout fixture represents every operational metadata object", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const counts = metadataCounts(plan);

  for (const metadataObject of metadataObjects) {
    assert.ok(counts[metadataObject] > 0, `${metadataObject} must be represented`);
  }

  assert.equal(room(plan, "hall-bed-01").roomType, "hall_bed");
  assert.equal(room(plan, "hall-bed-01").overflowOperationalMetadata.overflowClass, "hall_bed");
  assert.equal(room(plan, "room-02").adjacencyOperationalMetadata.traumaAdjacencyLevel, "direct");
  assert.equal(room(plan, "room-04").adjacencyOperationalMetadata.behavioralAdjacencyLevel, "direct");

  writeEvidence("canonical-er-layout-fixture-output.json", {
    issue: "206",
    status: "passed",
    fixture: "plan-er-pod-phase2.json",
    planId: plan.planId,
    metadataObjects,
    counts,
    canonicalFixtureValidInTypeScript: true,
    representedCases: {
      hallBed: "hall-bed-01",
      overflowSpace: "room-06",
      traumaAdjacentRoom: "room-02",
      behavioralAdjacentRoom: "room-04",
      emsEntryPathNode: "node-ems-entry"
    },
    nonPhiClinicalNoteScan: "covered-by-no-phi-and-contract-gates"
  });
});
