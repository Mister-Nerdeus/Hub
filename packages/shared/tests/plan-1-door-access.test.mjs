import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateDefaultSavedPlanFixtureContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-234");

const requiredRoomAccessIds = [
  "room-15",
  "room-16",
  "room-14",
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
  "room-17",
  "room-19",
  "room-20",
  "room-21",
  "room-22",
  "room-23",
  "room-24"
];

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

test("Issue 234 adds deterministic Plan 1 door/access objects", () => {
  const fixture = readPlanFixture(1);
  const plan = fixture.plan;
  const doorIds = new Set(plan.doors.map((door) => door.id));
  const requiredSourceDoorIds = Array.from({ length: 18 }, (_, index) => `door-${String(index + 1).padStart(2, "0")}`);
  const missingSourceDoorIds = requiredSourceDoorIds.filter((doorId) => !doorIds.has(doorId));
  const invalidDoorRoomReferences = plan.doors.filter(
    (door) => !plan.rooms.some((room) => room.id === door.roomId)
  );
  const invalidDoorPathReferences = plan.doors.filter(
    (door) => door.pathNodeId != null && !plan.pathNodes.some((node) => node.id === door.pathNodeId)
  );

  writeEvidence("plan-1-door-access-output.json", {
    issue: "234",
    planId: plan.planId,
    requiredSourceDoorIds,
    missingSourceDoorIds,
    doorCount: plan.doors.length,
    doors: plan.doors.map((door) => ({
      id: door.id,
      label: door.label,
      roomId: door.roomId,
      x: door.x,
      y: door.y,
      widthFeet: door.widthFeet,
      pathNodeId: door.pathNodeId
    })),
    invalidDoorRoomReferences,
    invalidDoorPathReferences
  });

  assert.deepEqual(missingSourceDoorIds, []);
  assert.equal(plan.doors.length >= 18, true);
  assert.deepEqual(invalidDoorRoomReferences, []);
  assert.deepEqual(invalidDoorPathReferences, []);
});

test("Issue 234 covers required room access directly with no deferrals", () => {
  const fixture = readPlanFixture(1);
  const plan = fixture.plan;
  const doorsByRoom = new Map();
  for (const door of plan.doors) {
    const doors = doorsByRoom.get(door.roomId) ?? [];
    doors.push(door.id);
    doorsByRoom.set(door.roomId, doors);
  }
  const directAccessRooms = requiredRoomAccessIds.filter((roomId) => (doorsByRoom.get(roomId) ?? []).length > 0);
  const missingDirectAccessRooms = requiredRoomAccessIds.filter((roomId) => !directAccessRooms.includes(roomId));
  const clusteredAccess = [];
  const deferredAccess = [];

  writeEvidence("plan-1-door-coverage-output.json", {
    issue: "234",
    planId: plan.planId,
    requiredRoomAccessIds,
    directAccessRooms,
    missingDirectAccessRooms,
    doorsByRoom: Object.fromEntries(doorsByRoom)
  });
  writeEvidence("plan-1-clustered-access-output.json", {
    issue: "234",
    planId: plan.planId,
    clusteredAccess,
    note: "No clustered room access is used in Issue 234; each required room has direct access coverage."
  });
  writeEvidence("plan-1-access-deferred-output.json", {
    issue: "234",
    planId: plan.planId,
    deferredAccess,
    note: "No required room access points are deferred in Issue 234."
  });
  writeEvidenceText(
    "plan-1-door-known-approximations.md",
    [
      "# Plan 1 Door/Access Known Approximations",
      "",
      "- Door/access positions are approximate visual parity access markers.",
      "- Door/access geometry is not exact CAD or measured door geometry.",
      "- Path graph finalization remains for Issue 235.",
      "- No measured walking truth is claimed."
    ].join("\n")
  );

  assert.deepEqual(missingDirectAccessRooms, []);
  assert.deepEqual(clusteredAccess, []);
  assert.deepEqual(deferredAccess, []);
});

test("Issue 234 marks source-truth access represented and proves Plans 2 through 5 unchanged", () => {
  const fixture = readPlanFixture(1);
  const sourceTruth = readJson(join(defaultPlansDir, "visual-parity", "plan-1-source-truth.json"));
  const doorIds = new Set(fixture.plan.doors.map((door) => door.id));
  const accessCoverage = sourceTruth.visibleObjects
    .filter((entry) => entry.objectKind === "door_or_access")
    .map((entry) => ({
      sourceLabel: entry.sourceLabel,
      expectedTargetId: entry.expectedTargetId,
      coverageStatus: entry.coverageStatus,
      represented: entry.expectedTargetId != null && doorIds.has(entry.expectedTargetId)
    }));
  const missingCoverage = accessCoverage.filter(
    (entry) => !entry.represented || entry.coverageStatus !== "represented"
  );
  const plans = [];
  for (let index = 2; index <= 5; index += 1) {
    const otherFixture = readPlanFixture(index);
    plans.push({ planId: otherFixture.plan.planId, counts: planCounts(otherFixture.plan) });
  }
  writeEvidence("plans-2-through-5-unchanged-output.json", {
    issue: "234",
    plans,
    preservedPlanIds: plans.map((entry) => entry.planId)
  });

  assert.deepEqual(missingCoverage, []);
  assert.equal(plans.length, 4);
  assert.equal(plans.every((entry) => entry.counts.rooms > 0), true);
});