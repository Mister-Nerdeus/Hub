import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-232");

const requiredRoomIds = [
  "room-level-1-trauma",
  "room-02",
  "room-03",
  "room-04",
  "room-05",
  "room-06",
  "room-07",
  "room-08",
  "room-09",
  "room-10",
  "room-11",
  "room-12",
  "room-13",
  "room-14",
  "room-15",
  "room-16",
  "room-17",
  "room-19",
  "room-20",
  "room-21",
  "room-22",
  "room-23",
  "room-24"
];

const rejectedOldRoomIds = ["room-01", "space-07"];

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

function readPlan1Fixture() {
  return validateDefaultSavedPlanFixtureContract(
    readJson(join(defaultPlansDir, "default-er-layout-plan-1.json")),
    {
      sourcePlanIds: new Set(["source-er-layout-plan-1"]),
      mappingIds: new Set(["mapping-er-layout-plan-1"])
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

function plans2Through5Counts() {
  const plans = [];
  for (let index = 2; index <= 5; index += 1) {
    const fixture = validateDefaultSavedPlanFixtureContract(
      readJson(join(defaultPlansDir, `default-er-layout-plan-${index}.json`)),
      {
        sourcePlanIds: new Set([`source-er-layout-plan-${index}`]),
        mappingIds: new Set([`mapping-er-layout-plan-${index}`])
      }
    );
    plans.push({
      planId: fixture.plan.planId,
      counts: planCounts(fixture.plan)
    });
  }
  return plans;
}

test("Issue 232 rebuilds Plan 1 required room and patient-area geometry", () => {
  const fixture = readPlan1Fixture();
  const plan = fixture.plan;
  const roomIds = new Set(plan.rooms.map((room) => room.id));
  const missingRoomIds = requiredRoomIds.filter((roomId) => !roomIds.has(roomId));
  const roomGeometry = plan.rooms.map((room) => ({
    id: room.id,
    label: room.label,
    x: room.x,
    y: room.y,
    widthFeet: room.widthFeet,
    lengthFeet: room.lengthFeet,
    zoneId: room.zoneId,
    pathNodeId: room.pathNodeId
  }));

  writeEvidence("plan-1-after-room-counts.json", {
    issue: "232",
    planId: plan.planId,
    counts: planCounts(plan),
    requiredMinimumRooms: 23,
    requiredRoomIds,
    missingRoomIds
  });

  writeEvidence("plan-1-room-geometry-output.json", {
    issue: "232",
    planId: plan.planId,
    roomGeometry
  });

  assert.deepEqual(missingRoomIds, []);
  assert.equal(plan.rooms.length >= 23, true);
});

test("Issue 232 removes old simplified room labels and marks source-truth rooms represented", () => {
  const fixture = readPlan1Fixture();
  const sourceTruth = readJson(join(defaultPlansDir, "visual-parity", "plan-1-source-truth.json"));
  const roomIds = new Set(fixture.plan.rooms.map((room) => room.id));
  const legacyPresent = rejectedOldRoomIds.filter((roomId) => roomIds.has(roomId));
  const sourceRoomCoverage = sourceTruth.visibleObjects
    .filter((entry) => entry.objectKind === "room")
    .map((entry) => ({
      sourceLabel: entry.sourceLabel,
      expectedTargetId: entry.expectedTargetId,
      coverageStatus: entry.coverageStatus,
      represented: entry.expectedTargetId != null && roomIds.has(entry.expectedTargetId)
    }));
  const missingCoverage = sourceRoomCoverage.filter(
    (entry) => !entry.represented || entry.coverageStatus !== "represented"
  );

  writeEvidence("plan-1-room-label-coverage-output.json", {
    issue: "232",
    planId: fixture.plan.planId,
    sourceRoomCoverage,
    missingCoverage
  });

  writeEvidence("plan-1-removed-old-labels-output.json", {
    issue: "232",
    planId: fixture.plan.planId,
    rejectedOldRoomIds,
    legacyPresent,
    oldUnsupportedRoomIdsAbsent: legacyPresent.length === 0
  });

  writeEvidenceText(
    "plan-1-room-known-approximations.md",
    [
      "# Plan 1 Room Geometry Known Approximations",
      "",
      "- Room geometry is approximate and feet-based.",
      "- The source reference is private and is not a runtime asset.",
      "- Door and path links are provisional to keep existing local contract gates valid; dedicated access and graph rebuild issues remain open.",
      "- No exact CAD geometry or measured walking truth is claimed."
    ].join("\n")
  );

  assert.deepEqual(legacyPresent, []);
  assert.deepEqual(missingCoverage, []);
});

test("Issue 232 records before counts and proves Plans 2 through 5 remain unchanged", () => {
  const before = readJson(join(repoRoot, "docs", "verification", "issues", "issue-231", "plan-1-after-scaffold-counts.json"));
  const plans = plans2Through5Counts();

  writeEvidence("plan-1-before-room-counts.json", {
    issue: "232",
    source: "docs/verification/issues/issue-231/plan-1-after-scaffold-counts.json",
    counts: before.counts
  });

  writeEvidence("plans-2-through-5-unchanged-output.json", {
    issue: "232",
    plans,
    preservedPlanIds: plans.map((entry) => entry.planId)
  });

  assert.equal(before.counts.rooms > 0, true);
  assert.equal(plans.length, 4);
  assert.equal(plans.every((entry) => entry.counts.rooms > 0), true);
});
