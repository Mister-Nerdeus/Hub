import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoomMovePathSyncContract,
  validateRoomMovePathSyncContract
} from "../dist/index.js";

const plan = {
  schemaVersion: "1.0.0",
  planId: "path-sync-contract-plan",
  name: "Path sync contract plan",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  scale: {
    unit: "feet",
    pixelsPerUnit: 12,
    gridSizeFeet: 1,
    snapToGrid: true,
    origin: "top-left"
  },
  rooms: [
    {
      id: "room-14",
      label: "Room 14",
      roomType: "standard",
      x: 10,
      y: 8,
      widthFeet: 12,
      lengthFeet: 10,
      maxPatients: 1,
      traumaCapable: false,
      isolationCapable: false,
      pathNodeId: "node-door-room-14"
    }
  ],
  hallways: [],
  doors: [
    {
      id: "door-room-14",
      label: "Room 14 door",
      roomId: "room-14",
      x: 22,
      y: 12,
      widthFeet: 4,
      pathNodeId: "node-door-room-14"
    }
  ],
  nurseStations: [],
  zones: [],
  pathNodes: [
    {
      id: "node-door-room-14",
      nodeType: "room_door",
      x: 22,
      y: 12,
      linkedObjectId: "door-room-14"
    },
    {
      id: "node-hall-main",
      nodeType: "hallway",
      x: 24,
      y: 12
    }
  ],
  pathEdges: [
    {
      id: "edge-room-14-hall",
      fromNodeId: "node-door-room-14",
      toNodeId: "node-hall-main",
      lengthFeet: 6,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 5,
      turnPenaltySeconds: 0,
      blocked: false
    }
  ]
};

test("room move path sync contract identifies affected references without mutation", () => {
  const snapshot = JSON.stringify(plan);
  const contract = buildRoomMovePathSyncContract({
    plan,
    movedRoomId: "room-14",
    roomDeltaFeet: { deltaXFeet: 8, deltaYFeet: -2 }
  });

  assert.deepEqual(contract, {
    movedRoomId: "room-14",
    roomDeltaFeet: { deltaXFeet: 8, deltaYFeet: -2 },
    affectedDoorIds: ["door-room-14"],
    affectedPathNodeIds: ["node-door-room-14"],
    affectedPathEdgeIds: ["edge-room-14-hall"],
    syncStatus: "ready_for_sync",
    limitations: [
      "Contract only; no path geometry changes are applied.",
      "Simulation rerun and pathfinding changes are not performed."
    ]
  });
  assert.equal(JSON.stringify(plan), snapshot);
  assert.deepEqual(validateRoomMovePathSyncContract(contract), contract);
});

test("room move path sync contract reports missing path references", () => {
  const contract = buildRoomMovePathSyncContract({
    plan: {
      ...plan,
      doors: [{ ...plan.doors[0], pathNodeId: null }]
    },
    movedRoomId: "room-14",
    roomDeltaFeet: { deltaXFeet: 2, deltaYFeet: 0 }
  });

  assert.equal(contract.syncStatus, "blocked_by_missing_path_reference");
  assert.deepEqual(contract.affectedDoorIds, ["door-room-14"]);
  assert.deepEqual(contract.affectedPathNodeIds, ["node-door-room-14"]);
});

test("room move path sync contract supports not-required and pending statuses", () => {
  assert.equal(
    buildRoomMovePathSyncContract({
      plan,
      movedRoomId: "room-14",
      roomDeltaFeet: { deltaXFeet: 0, deltaYFeet: 0 }
    }).syncStatus,
    "not_required"
  );

  assert.equal(
    validateRoomMovePathSyncContract({
      movedRoomId: "room-14",
      roomDeltaFeet: { deltaXFeet: 1, deltaYFeet: 0 },
      affectedDoorIds: [],
      affectedPathNodeIds: [],
      affectedPathEdgeIds: [],
      syncStatus: "pending",
      limitations: ["Contract record created before path references are inspected."]
    }).syncStatus,
    "pending"
  );
});
