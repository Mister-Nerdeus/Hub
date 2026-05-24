import assert from "node:assert/strict";
import test from "node:test";

import { syncDoorPathNodeGeometry } from "../dist/index.js";

const layout = {
  schemaVersion: "1.0.0",
  layoutId: "door-sync-layout",
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
  limitations: ["Synthetic editable layout for door path node geometry sync tests."]
};

const plan = {
  schemaVersion: "1.0.0",
  planId: "door-sync-plan",
  name: "Door sync proof plan",
  description: "Synthetic operational plan for door path node sync.",
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
      doorPoint: { x: 0, y: 0 },
      zoneId: null,
      nearestStationId: null,
      pathNodeId: "node-door-room-14-east"
    }
  ],
  hallways: [],
  doors: [
    {
      id: "door-room-14-east",
      label: "Room 14 east door",
      roomId: "room-14",
      x: 0,
      y: 0,
      widthFeet: 4,
      pathNodeId: "node-door-room-14-east"
    }
  ],
  nurseStations: [],
  zones: [],
  pathNodes: [
    {
      id: "node-door-room-14-east",
      nodeType: "room_door",
      x: 0,
      y: 0,
      linkedObjectId: "door-room-14-east"
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
      id: "edge-door-hall",
      fromNodeId: "node-door-room-14-east",
      toNodeId: "node-hall",
      lengthFeet: 10,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 4,
      turnPenaltySeconds: 2,
      blocked: false
    }
  ]
};

const bridge = {
  editableLayoutId: "door-sync-layout",
  planId: "door-sync-plan",
  roomMappings: [],
  doorMappings: [
    {
      editableObjectId: "door-room-14-east",
      planObjectId: "door-room-14-east",
      pathNodeIds: ["node-door-room-14-east"],
      pathEdgeIds: ["edge-door-hall"],
      mappingStatus: "mapped"
    }
  ],
  stationMappings: [],
  hallwayMappings: [],
  zoneMappings: [],
  limitations: ["Synthetic bridge for door path node sync tests."]
};

test("syncs linked door path node geometry from derived door center", () => {
  const planBefore = JSON.stringify(plan);
  const layoutBefore = JSON.stringify(layout);
  const result = syncDoorPathNodeGeometry({ editableLayout: layout, plan, bridge });

  assert.deepEqual(result.syncedPathNodeIds, ["node-door-room-14-east"]);
  assert.deepEqual(result.skippedDoorIds, []);
  assert.equal(result.doorResults[0].syncStatus, "synced");
  assert.deepEqual(result.doorResults[0].derivedDoorCenterFeet, { xFeet: 22, yFeet: 13 });
  assert.deepEqual(
    result.updatedPlan.pathNodes.find((node) => node.id === "node-door-room-14-east"),
    {
      id: "node-door-room-14-east",
      nodeType: "room_door",
      x: 22,
      y: 13,
      linkedObjectId: "door-room-14-east"
    }
  );
  assert.deepEqual(result.updatedPlan.pathEdges, plan.pathEdges);
  assert.deepEqual(result.updatedPlan.doors, plan.doors);
  assert.equal(JSON.stringify(plan), planBefore);
  assert.equal(JSON.stringify(layout), layoutBefore);
});

test("skips unlinked doors deterministically", () => {
  const result = syncDoorPathNodeGeometry({
    editableLayout: layout,
    plan,
    bridge: {
      ...bridge,
      doorMappings: [
        {
          ...bridge.doorMappings[0],
          pathNodeIds: [],
          pathEdgeIds: [],
          mappingStatus: "missing_path_reference"
        }
      ]
    }
  });

  assert.deepEqual(result.syncedPathNodeIds, []);
  assert.deepEqual(result.skippedDoorIds, ["door-room-14-east"]);
  assert.equal(result.doorResults[0].syncStatus, "skipped_missing_linked_path_node");
  assert.deepEqual(result.updatedPlan.pathNodes, plan.pathNodes);
});

test("skips owner-missing doors deterministically", () => {
  const ownerMissingLayout = {
    ...layout,
    rooms: []
  };

  const result = syncDoorPathNodeGeometry({
    editableLayout: ownerMissingLayout,
    plan,
    bridge
  });

  assert.deepEqual(result.syncedPathNodeIds, []);
  assert.deepEqual(result.skippedDoorIds, ["door-room-14-east"]);
  assert.equal(result.doorResults[0].syncStatus, "skipped_owner_geometry_missing");
  assert.equal(result.doorResults[0].derivedDoorCenterFeet, null);
  assert.deepEqual(result.updatedPlan.pathNodes, plan.pathNodes);
});

test("skips mapped doors when the referenced path node is missing", () => {
  const result = syncDoorPathNodeGeometry({
    editableLayout: layout,
    plan,
    bridge: {
      ...bridge,
      doorMappings: [
        {
          ...bridge.doorMappings[0],
          pathNodeIds: ["node-missing-door"]
        }
      ]
    }
  });

  assert.deepEqual(result.syncedPathNodeIds, []);
  assert.deepEqual(result.skippedDoorIds, ["door-room-14-east"]);
  assert.equal(result.doorResults[0].syncStatus, "skipped_missing_path_node");
  assert.deepEqual(result.updatedPlan.pathEdges, plan.pathEdges);
});
