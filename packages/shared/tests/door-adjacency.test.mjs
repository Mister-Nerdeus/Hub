import test from "node:test";
import assert from "node:assert/strict";
import { detectDoorAdjacency } from "../dist/index.js";

test("detects rooms sharing a wall", () => {
  const layout = layoutWithRooms([
    room("owner", "Owner", 0, 10),
    room("target", "Target", 0, 0)
  ]);
  const result = detectDoorAdjacency({ layout, door: layout.doors[0] });
  assert.equal(result.status, "candidates_found");
  assert.equal(result.candidates[0].roomId, "target");
  assert.equal(result.candidates[0].relationshipType, "shared_wall");
  assert.equal(result.candidates[0].wall, "south");
});

test("detects near-touching rooms and rejects non-adjacent rooms", () => {
  const nearLayout = layoutWithRooms([
    room("owner", "Owner", 0, 10),
    room("near", "Near", 0, -0.4)
  ]);
  assert.equal(detectDoorAdjacency({ layout: nearLayout, door: nearLayout.doors[0] }).candidates[0].relationshipType, "near_touching");

  const farLayout = layoutWithRooms([
    room("owner", "Owner", 0, 10),
    room("far", "Far", 20, 20)
  ]);
  const result = detectDoorAdjacency({ layout: farLayout, door: farLayout.doors[0] });
  assert.equal(result.status, "no_candidates");
  assert.ok(result.reasonCodes.includes("no_geometric_candidate"));
});

test("detects hallway-adjacent room relationship", () => {
  const layout = {
    ...layoutWithRooms([
      room("owner", "Owner", 0, 0),
      room("target", "Target", 0, 14)
    ], "south"),
    hallways: [
      { objectType: "hallway", id: "hall-01", label: "Hall 01", xFeet: 0, yFeet: 10, widthFeet: 12, heightFeet: 4 }
    ]
  };
  const result = detectDoorAdjacency({ layout, door: layout.doors[0] });
  assert.equal(result.candidates[0].relationshipType, "hallway_adjacent");
  assert.equal(result.candidates[0].hallwayId, "hall-01");
});

test("rejects hallway rooms that touch the same hallway without wall overlap", () => {
  const layout = {
    ...layoutWithRooms([
      room("owner", "Owner", 0, 0),
      room("same-hall-but-not-overlapping", "Same hallway but not overlapping", 20, 14)
    ], "south"),
    hallways: [
      { objectType: "hallway", id: "hall-01", label: "Hall 01", xFeet: 0, yFeet: 10, widthFeet: 40, heightFeet: 4 }
    ]
  };
  const result = detectDoorAdjacency({ layout, door: layout.doors[0] });
  assert.equal(result.status, "no_candidates");
  assert.ok(result.reasonCodes.includes("owner_wall_has_hallway_only"));
});

test("does not select first non-owner room when geometry does not match", () => {
  const layout = layoutWithRooms([
    room("owner", "Owner", 0, 10),
    room("first", "First but wrong", 50, 50),
    room("target", "Target", 0, 0)
  ]);
  const result = detectDoorAdjacency({ layout, door: layout.doors[0] });
  assert.equal(result.candidates[0].roomId, "target");
  assert.notEqual(result.candidates[0].roomId, "first");
});

function layoutWithRooms(rooms, wall = "north") {
  return {
    schemaVersion: "1.0.0",
    layoutId: "door-adjacency-test",
    units: "feet",
    rooms,
    doors: [
      { objectType: "door", id: "door-01", label: "Door 01", ownerKind: "room", ownerId: "owner", wall, offsetFeet: 2, widthFeet: 4 }
    ],
    stations: [],
    hallways: [],
    zones: [],
    limitations: ["synthetic geometry test"]
  };
}

function room(id, label, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 12,
    heightFeet: 10
  };
}
