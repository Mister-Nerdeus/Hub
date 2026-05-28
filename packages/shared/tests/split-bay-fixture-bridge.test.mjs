import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  getBedCountContributionForRoomId,
  getOccupancyTypeForRoomId,
  getPhysicalRoomCountContributionForRoomId,
  getSplitBayFixtureOccupancyBridge,
  getSplitBayIdForRoomId,
  isAssignmentEligibleByFixtureBridge,
  isRatioEligibleByFixtureBridge
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-544");

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("paired split-bay fixture rooms resolve to bed-position semantics", () => {
  const paired = ["room-02", "room-03", "room-04", "room-05", "room-06", "room-07", "room-08", "room-09"];
  const bridges = paired.map((roomId) => getSplitBayFixtureOccupancyBridge(roomId));

  assert.equal(bridges.every((bridge) => bridge.occupancyType === "bed_position"), true);
  assert.equal(bridges.every((bridge) => bridge.bedCountContribution === 1), true);
  assert.equal(bridges.every((bridge) => bridge.physicalRoomCountContribution === 0.5), true);
  assert.deepEqual([...new Set(bridges.map((bridge) => bridge.splitBayId))], [
    "split-bay-02-03",
    "split-bay-04-05",
    "split-bay-06-07",
    "split-bay-08-09"
  ]);

  writeEvidence("split-bay-bridge-output.json", {
    status: "passed",
    pairedRoomIds: paired,
    bridgeCount: bridges.length,
    splitBayIds: [...new Set(bridges.map((bridge) => bridge.splitBayId))]
  });
});

test("ordinary rooms and trauma resolve to physical room semantics", () => {
  for (const roomId of ["room-level-1-trauma", "room-10", "room-24"]) {
    assert.equal(getOccupancyTypeForRoomId(roomId), "room");
    assert.equal(getSplitBayIdForRoomId(roomId), null);
    assert.equal(getBedCountContributionForRoomId(roomId), 1);
    assert.equal(getPhysicalRoomCountContributionForRoomId(roomId), 1);
    assert.equal(isAssignmentEligibleByFixtureBridge(roomId), true);
    assert.equal(isRatioEligibleByFixtureBridge(roomId), true);
  }

  writeEvidence("occupancy-type-mapping-output.json", {
    status: "passed",
    ordinaryRoomIds: ["room-level-1-trauma", "room-10", "room-24"],
    occupancyType: "room"
  });
});

test("storage and support areas are explicit non-patient selectors", () => {
  assert.equal(getOccupancyTypeForRoomId("room-14"), "storage");
  assert.equal(getBedCountContributionForRoomId("room-14"), 0);
  assert.equal(getPhysicalRoomCountContributionForRoomId("room-14"), 0);
  assert.equal(isAssignmentEligibleByFixtureBridge("room-14"), false);
  assert.equal(isRatioEligibleByFixtureBridge("room-14"), false);

  assert.equal(getSplitBayFixtureOccupancyBridge("station-left").occupancyType, "support_area");
  assert.equal(getSplitBayFixtureOccupancyBridge("zone-provider-pharmacy").occupancyType, "support_area");
  assert.equal(getSplitBayFixtureOccupancyBridge("hallway-main").occupancyType, "hallway");

  writeEvidence("selector-coverage-output.json", {
    status: "passed",
    storageExcluded: true,
    supportAreasExcluded: ["station-left", "zone-provider-pharmacy"],
    hallwayExcluded: "hallway-main"
  });
});

test("count selector evidence separates bed and physical-room contributions", () => {
  const paired = ["room-02", "room-03"];
  const bedCount = paired.reduce((sum, roomId) => sum + getBedCountContributionForRoomId(roomId), 0);
  const physicalRoomCount = paired.reduce((sum, roomId) => sum + getPhysicalRoomCountContributionForRoomId(roomId), 0);

  assert.equal(bedCount, 2);
  assert.equal(physicalRoomCount, 1);

  writeEvidence("bed-count-contribution-output.json", {
    status: "passed",
    pairedRoomIds: paired,
    bedCount
  });
  writeEvidence("physical-room-count-contribution-output.json", {
    status: "passed",
    pairedRoomIds: paired,
    physicalRoomCount
  });
});
