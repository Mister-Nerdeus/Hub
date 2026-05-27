import test from "node:test";
import assert from "node:assert/strict";
import { validateDoorPlacement } from "../dist/index.js";

test("reports valid and invalid door placement preview states", () => {
  const layout = testLayout();
  const valid = validateDoorPlacement({ layout, door: layout.doors[0] });
  assert.equal(valid.status, "valid");
  assert.ok(valid.reasonCodes.includes("offset_within_wall_bounds"));

  const invalidOffset = validateDoorPlacement({
    layout,
    door: { ...layout.doors[0], offsetFeet: 99 }
  });
  assert.equal(invalidOffset.status, "invalid");
  assert.ok(invalidOffset.reasonCodes.includes("offset_outside_wall_bounds"));

  const invalidWidth = validateDoorPlacement({
    layout,
    door: { ...layout.doors[0], widthFeet: 99 }
  });
  assert.equal(invalidWidth.status, "invalid");
  assert.ok(invalidWidth.reasonCodes.includes("width_exceeds_wall"));
});

test("reports missing candidate connection without route-truth claims", () => {
  const layout = { ...testLayout(), rooms: [testLayout().rooms[0]] };
  const result = validateDoorPlacement({ layout, door: layout.doors[0] });
  assert.equal(result.status, "invalid");
  assert.ok(result.reasonCodes.includes("candidate_connection_missing"));
  assert.ok(!result.warnings.join(" ").toLowerCase().includes("route truth"));
});

function testLayout() {
  const owner = room("owner", "Owner", 0, 10);
  const target = room("target", "Target", 0, 0);
  return {
    schemaVersion: "1.0.0",
    layoutId: "door-validity-test",
    units: "feet",
    rooms: [owner, target],
    doors: [
      { objectType: "door", id: "door-01", label: "Door 01", ownerKind: "room", ownerId: "owner", wall: "north", offsetFeet: 2, widthFeet: 4 }
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
