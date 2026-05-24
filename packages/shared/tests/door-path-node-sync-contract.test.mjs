import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDoorPathNodeSyncContract,
  validateDoorPathNodeSyncContract
} from "../dist/index.js";

const layout = {
  schemaVersion: "1.0.0",
  layoutId: "door-path-node-sync-layout",
  units: "feet",
  rooms: [
    {
      objectType: "room",
      id: "room-14",
      label: "Room 14",
      roomNumber: "14",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 10,
      yFeet: 8,
      widthFeet: 12,
      heightFeet: 10
    }
  ],
  doors: [
    {
      objectType: "door",
      id: "door-room-14-east",
      label: "Room 14 east door",
      ownerKind: "room",
      ownerId: "room-14",
      wall: "east",
      offsetFeet: 3,
      widthFeet: 4
    }
  ],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Synthetic editable layout for door path-node sync contract tests."]
};

test("door path node sync contract derives door center from owner geometry", () => {
  const snapshot = JSON.stringify(layout);
  const contract = buildDoorPathNodeSyncContract({
    layout,
    doorId: "door-room-14-east",
    linkedPathNodeId: "node-door-room-14-east"
  });

  assert.deepEqual(contract, {
    doorId: "door-room-14-east",
    ownerKind: "room",
    ownerId: "room-14",
    wall: "east",
    offsetFeet: 3,
    derivedDoorCenterFeet: { xFeet: 22, yFeet: 13 },
    linkedPathNodeId: "node-door-room-14-east",
    syncStatus: "ready_for_sync",
    limitations: [
      "Contract only; no path node geometry changes are applied.",
      "Simulation rerun and pathfinding changes are not performed."
    ]
  });
  assert.equal(JSON.stringify(layout), snapshot);
  assert.deepEqual(validateDoorPathNodeSyncContract(contract), contract);
});

test("door path node sync contract reports missing linked path node", () => {
  const contract = buildDoorPathNodeSyncContract({
    layout,
    doorId: "door-room-14-east",
    linkedPathNodeId: null
  });

  assert.equal(contract.syncStatus, "missing_linked_path_node");
  assert.equal(contract.linkedPathNodeId, null);
});

test("door path node sync contract supports pending status validation", () => {
  assert.equal(
    validateDoorPathNodeSyncContract({
      doorId: "door-room-14-east",
      ownerKind: "room",
      ownerId: "room-14",
      wall: "east",
      offsetFeet: 3,
      derivedDoorCenterFeet: { xFeet: 22, yFeet: 13 },
      linkedPathNodeId: "node-door-room-14-east",
      syncStatus: "pending",
      limitations: ["Contract record created before path node references are inspected."]
    }).syncStatus,
    "pending"
  );
});
