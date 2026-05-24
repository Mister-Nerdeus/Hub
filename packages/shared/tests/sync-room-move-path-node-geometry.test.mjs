import assert from "node:assert/strict";
import test from "node:test";

import { syncRoomMovePathNodeGeometry } from "../dist/index.js";

const editableLayout = {
  schemaVersion: "1.0.0",
  layoutId: "room-move-sync-layout",
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
      xFeet: 18,
      yFeet: 6,
      widthFeet: 12,
      heightFeet: 10
    },
    {
      objectType: "room",
      id: "room-15",
      label: "Room 15",
      roomNumber: "15",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 40,
      yFeet: 6,
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
    },
    {
      objectType: "door",
      id: "door-room-15-west",
      label: "Room 15 west door",
      ownerKind: "room",
      ownerId: "room-15",
      wall: "west",
      offsetFeet: 3,
      widthFeet: 4
    }
  ],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Synthetic editable layout for room move path node sync tests."]
};

const plan = {
  schemaVersion: "1.0.0",
  planId: "room-move-sync-plan",
  name: "Room move sync proof plan",
  description: "Synthetic operational plan for room move path node sync.",
  createdAt: "2026-05-24T00:00:00Z",
  updatedAt: "2026-05-24T00:00:00Z",
  scale: {
    unit: "feet",
    pixelsPerUnit: 10,
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
      doorPoint: { x: 22, y: 13 },
      zoneId: null,
      nearestStationId: null,
      pathNodeId: "node-room-14"
    },
    {
      id: "room-15",
      label: "Room 15",
      roomType: "standard",
      x: 40,
      y: 6,
      widthFeet: 12,
      lengthFeet: 10,
      maxPatients: 1,
      traumaCapable: false,
      isolationCapable: false,
      doorPoint: { x: 40, y: 11 },
      zoneId: null,
      nearestStationId: null,
      pathNodeId: "node-room-15"
    }
  ],
  hallways: [],
  doors: [
    {
      id: "door-room-14-east",
      label: "Room 14 east door",
      roomId: "room-14",
      x: 22,
      y: 13,
      widthFeet: 4,
      pathNodeId: "node-door-room-14-east"
    },
    {
      id: "door-room-15-west",
      label: "Room 15 west door",
      roomId: "room-15",
      x: 40,
      y: 11,
      widthFeet: 4,
      pathNodeId: "node-door-room-15-west"
    }
  ],
  nurseStations: [],
  zones: [],
  pathNodes: [
    {
      id: "node-room-14",
      nodeType: "room_door",
      x: 10,
      y: 8,
      linkedObjectId: "room-14"
    },
    {
      id: "node-door-room-14-east",
      nodeType: "room_door",
      x: 22,
      y: 13,
      linkedObjectId: "door-room-14-east"
    },
    {
      id: "node-room-15",
      nodeType: "room_door",
      x: 40,
      y: 6,
      linkedObjectId: "room-15"
    },
    {
      id: "node-door-room-15-west",
      nodeType: "room_door",
      x: 40,
      y: 11,
      linkedObjectId: "door-room-15-west"
    },
    {
      id: "node-hall",
      nodeType: "hallway",
      x: 20,
      y: 20,
      linkedObjectId: "hall-main"
    }
  ],
  pathEdges: [
    {
      id: "edge-room-14-hall",
      fromNodeId: "node-door-room-14-east",
      toNodeId: "node-hall",
      lengthFeet: 10,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 4,
      turnPenaltySeconds: 2,
      blocked: false
    },
    {
      id: "edge-room-15-hall",
      fromNodeId: "node-door-room-15-west",
      toNodeId: "node-hall",
      lengthFeet: 20,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 4,
      turnPenaltySeconds: 2,
      blocked: false
    }
  ]
};

const bridge = {
  editableLayoutId: "room-move-sync-layout",
  planId: "room-move-sync-plan",
  roomMappings: [
    {
      editableObjectId: "room-14",
      planObjectId: "room-14",
      pathNodeIds: ["node-room-14"],
      pathEdgeIds: [],
      mappingStatus: "mapped"
    },
    {
      editableObjectId: "room-15",
      planObjectId: "room-15",
      pathNodeIds: ["node-room-15"],
      pathEdgeIds: [],
      mappingStatus: "mapped"
    }
  ],
  doorMappings: [
    {
      editableObjectId: "door-room-14-east",
      planObjectId: "door-room-14-east",
      pathNodeIds: ["node-door-room-14-east"],
      pathEdgeIds: ["edge-room-14-hall"],
      mappingStatus: "mapped"
    },
    {
      editableObjectId: "door-room-15-west",
      planObjectId: "door-room-15-west",
      pathNodeIds: ["node-door-room-15-west"],
      pathEdgeIds: ["edge-room-15-hall"],
      mappingStatus: "mapped"
    }
  ],
  stationMappings: [],
  hallwayMappings: [],
  zoneMappings: [],
  limitations: ["Synthetic bridge for room move path node sync tests."]
};

test("syncs moved room path node by delta and recalculates owned door path nodes", () => {
  const planBefore = JSON.stringify(plan);
  const result = syncRoomMovePathNodeGeometry({
    editableLayout,
    plan,
    bridge,
    movedRoomId: "room-14",
    roomDeltaFeet: { deltaXFeet: 8, deltaYFeet: -2 }
  });

  assert.equal(result.roomPathNodeResult.syncStatus, "synced");
  assert.equal(result.doorPathNodeResult.doorResults[0].syncStatus, "synced");
  assert.deepEqual(result.syncedPathNodeIds, ["node-door-room-14-east", "node-room-14"]);
  assert.deepEqual(result.updatedPlan.pathNodes.find((node) => node.id === "node-room-14"), {
    id: "node-room-14",
    nodeType: "room_door",
    x: 18,
    y: 6,
    linkedObjectId: "room-14"
  });
  assert.deepEqual(result.updatedPlan.pathNodes.find((node) => node.id === "node-door-room-14-east"), {
    id: "node-door-room-14-east",
    nodeType: "room_door",
    x: 30,
    y: 11,
    linkedObjectId: "door-room-14-east"
  });
  assert.deepEqual(result.updatedPlan.pathNodes.find((node) => node.id === "node-door-room-15-west"), {
    id: "node-door-room-15-west",
    nodeType: "room_door",
    x: 40,
    y: 11,
    linkedObjectId: "door-room-15-west"
  });
  assert.deepEqual(result.updatedPlan.pathEdges, plan.pathEdges);
  assert.equal(result.pathEdgesMutated, false);
  assert.equal(result.walkingDistanceRecalculated, false);
  assert.equal(JSON.stringify(plan), planBefore);
});

test("reports missing room path node references while still syncing room-owned doors", () => {
  const result = syncRoomMovePathNodeGeometry({
    editableLayout,
    plan,
    bridge: {
      ...bridge,
      roomMappings: [
        {
          ...bridge.roomMappings[0],
          pathNodeIds: [],
          pathEdgeIds: [],
          mappingStatus: "missing_path_reference"
        }
      ]
    },
    movedRoomId: "room-14",
    roomDeltaFeet: { deltaXFeet: 8, deltaYFeet: -2 }
  });

  assert.equal(result.roomPathNodeResult.syncStatus, "skipped_missing_room_path_node");
  assert.deepEqual(result.syncedPathNodeIds, ["node-door-room-14-east"]);
  assert.deepEqual(result.updatedPlan.pathNodes.find((node) => node.id === "node-room-14"), {
    id: "node-room-14",
    nodeType: "room_door",
    x: 10,
    y: 8,
    linkedObjectId: "room-14"
  });
});

test("no-op room delta returns not required and preserves path nodes", () => {
  const result = syncRoomMovePathNodeGeometry({
    editableLayout,
    plan,
    bridge,
    movedRoomId: "room-14",
    roomDeltaFeet: { deltaXFeet: 0, deltaYFeet: -0 }
  });

  assert.equal(result.roomPathNodeResult.syncStatus, "not_required");
  assert.deepEqual(result.syncedPathNodeIds, []);
  assert.deepEqual(result.updatedPlan.pathNodes, plan.pathNodes);
  assert.deepEqual(result.updatedPlan.pathEdges, plan.pathEdges);
});
