import assert from "node:assert/strict";
import test from "node:test";

import { validateLegacyLayoutRoomTypeSemantics } from "../dist/index.js";
import { testPlan } from "./authoring-test-helpers.mjs";

const invalidLegacyPlan = {
  ...testPlan,
  rooms: [
    {
      ...testPlan.rooms[0],
      id: "room-storage",
      label: "Storage Room",
      roomType: "storage",
      pathNodeId: "node-door-storage"
    },
    {
      ...testPlan.rooms[0],
      id: "room-solid",
      label: "Solid Wall",
      roomType: "solid_wall",
      pathNodeId: "node-door-solid"
    }
  ],
  doors: [
    {
      ...testPlan.doors[0],
      id: "door-storage",
      roomId: "room-storage",
      pathNodeId: "node-door-storage"
    },
    {
      ...testPlan.doors[0],
      id: "door-solid",
      roomId: "room-solid",
      pathNodeId: "node-door-solid"
    }
  ],
  pathNodes: [
    ...testPlan.pathNodes,
    {
      id: "node-door-solid",
      nodeType: "room_door",
      x: 4,
      y: 4,
      linkedObjectId: "door-solid",
      entryOperationalMetadata: null
    },
    {
      id: "node-door-storage",
      nodeType: "room_door",
      x: 8,
      y: 8,
      linkedObjectId: "door-storage",
      entryOperationalMetadata: null
    }
  ],
  pathEdges: []
};

test("legacy validation quarantines storage and solid-wall patient-room states", () => {
  const result = validateLegacyLayoutRoomTypeSemantics({
    plan: invalidLegacyPlan,
    roomLoads: [{ roomId: "room-storage" }, { roomId: "room-solid" }],
    assignments: [{ roomId: "room-storage" }, { roomId: "room-solid" }],
    ratioCountRoomIds: ["room-storage", "room-solid"]
  });
  const codes = result.findings.map((finding) => finding.code);
  assert.equal(result.status, "quarantined");
  assert.equal(codes.includes("SOLID_WALL_WITH_DOOR"), true);
  assert.equal(codes.includes("SOLID_WALL_WITH_PATH_NODE"), true);
  assert.equal(codes.includes("SOLID_WALL_WITH_ROOM_LOAD"), true);
  assert.equal(codes.includes("SOLID_WALL_WITH_NURSE_ASSIGNMENT"), true);
  assert.equal(codes.includes("STORAGE_WITH_ROOM_LOAD"), true);
  assert.equal(codes.includes("STORAGE_WITH_NURSE_ASSIGNMENT"), true);
  assert.equal(codes.includes("NON_PATIENT_ROOM_COUNTED_IN_RATIO"), true);
  assert.equal(result.quarantineMessages.every((message) => message.length > 0), true);
});

test("legacy validation passes when storage and solid-wall rooms are excluded", () => {
  const result = validateLegacyLayoutRoomTypeSemantics({
    plan: {
      ...testPlan,
      rooms: [{ ...testPlan.rooms[0], id: "room-care", roomType: "standard" }],
      doors: [{ ...testPlan.doors[0], roomId: "room-care" }]
    },
    roomLoads: [{ roomId: "room-care" }],
    assignments: [{ roomId: "room-care" }],
    ratioCountRoomIds: ["room-care"]
  });
  assert.equal(result.status, "passed");
  assert.deepEqual(result.findings, []);
});
