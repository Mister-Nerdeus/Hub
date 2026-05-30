import test from "node:test";
import assert from "node:assert/strict";
import {
  createSplitRoomInEditableLayout,
  resolveSplitRoomPair,
  countEditableLayoutCapacity,
  buildSplitRoomAssignmentSemantics
} from "../dist/index.js";

const baseLayout = {
  schemaVersion: "1.0.0",
  layoutId: "split-room-test-layout",
  units: "feet",
  rooms: [
    room("room-02", "2", 0, 0),
    room("room-03", "3", 12, 0),
    room("room-04", "4", 0, 12),
    room("room-05", "5", 12, 12),
    room("room-06", "6", 0, 24),
    room("room-07", "7", 12, 24),
    room("room-08", "8", 0, 36),
    room("room-09", "9", 12, 36)
  ],
  doors: [],
  supportAccessPoints: [],
  stations: [],
  hallways: [],
  zones: [],
  splitBays: [],
  limitations: ["Synthetic split-room authoring test layout."]
};

test("split room resolver resolves canonical pairs from either child room", () => {
  assert.equal(resolveSplitRoomPair({ layout: baseLayout, selectedRoomId: "room-05" }).pairLabel, "4/5");
  assert.equal(resolveSplitRoomPair({ layout: baseLayout, selectedRoomId: "room-04" }).pairLabel, "4/5");
  assert.equal(resolveSplitRoomPair({ layout: baseLayout, selectedRoomId: "room-03" }).pairLabel, "2/3");
  assert.equal(resolveSplitRoomPair({ layout: baseLayout, selectedRoomId: "room-07" }).pairLabel, "6/7");
  assert.equal(resolveSplitRoomPair({ layout: baseLayout, selectedRoomId: "room-09" }).pairLabel, "8/9");
});

test("split room authoring creates one parent bay and preserves child room IDs", () => {
  const result = createSplitRoomInEditableLayout({ layout: baseLayout, selectedRoomId: "room-05" });
  assert.equal(result.status, "created");
  assert.equal(result.splitBayId, "split-bay-room-04-room-05");
  assert.deepEqual(result.childRoomIds, ["room-04", "room-05"]);
  assert.deepEqual(result.layout.rooms.map((candidate) => candidate.id).filter((id) => id === "room-04" || id === "room-05"), [
    "room-04",
    "room-05"
  ]);
  assert.equal(result.layout.splitBays[0].label, "4/5");
  assert.equal(result.layout.splitBays[0].dividerStyle, "diagonal_down");
});

test("split room assignment semantics keep child rooms assignable and parent unassignable", () => {
  const created = createSplitRoomInEditableLayout({ layout: baseLayout, selectedRoomId: "room-05" });
  assert.equal(created.status, "created");
  const semantics = buildSplitRoomAssignmentSemantics({
    layout: created.layout,
    splitBayId: "split-bay-room-04-room-05"
  });
  assert.deepEqual(semantics, {
    parentSplitBayId: "split-bay-room-04-room-05",
    assignableRoomIds: ["room-04", "room-05"],
    physicalBayCount: 1,
    patientCarePositionCount: 2,
    parentAssignable: false
  });
  assert.deepEqual(countEditableLayoutCapacity(created.layout), {
    physicalBayCount: 7,
    patientCarePositionCount: 8,
    splitRoomPhysicalBayCount: 1,
    splitRoomPatientCarePositionCount: 2
  });
});

test("split room resolver blocks invalid and already split rooms", () => {
  assert.equal(resolveSplitRoomPair({ layout: baseLayout, selectedRoomId: "room-10" }).status, "blocked");
  const created = createSplitRoomInEditableLayout({ layout: baseLayout, selectedRoomId: "room-05" });
  assert.equal(created.status, "created");
  const alreadySplit = resolveSplitRoomPair({ layout: created.layout, selectedRoomId: "room-04" });
  assert.equal(alreadySplit.status, "blocked");
  assert.match(alreadySplit.reason, /already part of a split room/u);
});

function room(id, number, xFeet, yFeet, roomType = "standard") {
  return {
    objectType: "room",
    id,
    label: number,
    roomNumber: number,
    roomType,
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 10,
    heightFeet: 10
  };
}
