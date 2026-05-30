import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateSplitRoomAdjacency,
  createSplitRoomInEditableLayout,
  resolveSplitRoomPair,
  countEditableLayoutCapacity,
  buildSplitRoomAssignmentSemantics,
  SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET
} from "../dist/index.js";

const baseLayout = {
  schemaVersion: "1.0.0",
  layoutId: "split-room-test-layout",
  units: "feet",
  rooms: [
    room("room-02", "2", 0, 0),
    room("room-03", "3", 10, 0),
    room("room-04", "4", 0, 10),
    room("room-05", "5", 10, 10),
    room("room-06", "6", 0, 20),
    room("room-07", "7", 10, 20),
    room("room-08", "8", 0, 30),
    room("room-09", "9", 10, 30)
  ],
  doors: [],
  supportAccessPoints: [],
  stations: [],
  hallways: [],
  zones: [],
  splitBays: [],
  limitations: ["Synthetic split-room authoring test layout."]
};

test("split room adjacency accepts physically touching horizontal and vertical pairs", () => {
  const horizontal = evaluateSplitRoomAdjacency(room("room-04", "4", 0, 0), room("room-05", "5", 10, 0));
  assert.deepEqual(horizontal, {
    status: "adjacent",
    orientation: "horizontal",
    gapFeet: 0
  });

  const vertical = evaluateSplitRoomAdjacency(room("room-04", "4", 0, 0), room("room-05", "5", 0, 10));
  assert.deepEqual(vertical, {
    status: "adjacent",
    orientation: "vertical",
    gapFeet: 0
  });
});

test("split room adjacency accepts only near-touching gaps inside tolerance", () => {
  const nearTouching = evaluateSplitRoomAdjacency(
    room("room-04", "4", 0, 0),
    room("room-05", "5", 10 + SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET / 2, 0)
  );
  assert.equal(nearTouching.status, "adjacent");
  assert.equal(nearTouching.gapFeet, SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET / 2);
});

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

test("split room resolver blocks separated same-row and same-column rooms", () => {
  const sameRowSeparatedLayout = withRoomOverrides(baseLayout, {
    "room-05": { xFeet: 12 }
  });
  const sameRowSeparated = resolveSplitRoomPair({ layout: sameRowSeparatedLayout, selectedRoomId: "room-05" });
  assert.equal(sameRowSeparated.status, "blocked");
  assert.match(sameRowSeparated.reason, /not adjacent enough to form one physical bay/u);

  const sameColumnSeparatedLayout = withRoomOverrides(baseLayout, {
    "room-05": { xFeet: 0, yFeet: 22 }
  });
  const sameColumnSeparated = resolveSplitRoomPair({ layout: sameColumnSeparatedLayout, selectedRoomId: "room-05" });
  assert.equal(sameColumnSeparated.status, "blocked");
  assert.match(sameColumnSeparated.reason, /not adjacent enough to form one physical bay/u);
});

test("split room resolver blocks overlapping canonical rooms", () => {
  const overlappingLayout = withRoomOverrides(baseLayout, {
    "room-05": { xFeet: 8 }
  });
  const overlapping = resolveSplitRoomPair({ layout: overlappingLayout, selectedRoomId: "room-05" });
  assert.equal(overlapping.status, "blocked");
  assert.match(overlapping.reason, /not adjacent enough to form one physical bay/u);
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

function withRoomOverrides(layout, overridesByRoomId) {
  return {
    ...layout,
    rooms: layout.rooms.map((candidate) => ({
      ...candidate,
      ...(overridesByRoomId[candidate.id] ?? {})
    }))
  };
}
