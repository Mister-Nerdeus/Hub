import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildEditableLayoutPlanPathBridge,
  validateEditableLayoutPlanPathBridgeContract
} from "../dist/index.js";

const editableLayout = JSON.parse(
  readFileSync(new URL("../fixtures/layout-editor/editable-layout-basic.json", import.meta.url), "utf8")
);

const basePlan = {
  schemaVersion: "1.0.0",
  planId: "plan-bridge-adapter-basic",
  name: "Bridge adapter proof plan",
  description: "Synthetic operational plan for bridge adapter tests.",
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
      id: "room-01",
      label: "Room 01",
      roomType: "standard",
      x: 0,
      y: 0,
      widthFeet: 12,
      lengthFeet: 10,
      maxPatients: 1,
      traumaCapable: false,
      isolationCapable: false,
      doorPoint: { x: 12, y: 5 },
      zoneId: "zone-ems-entry",
      nearestStationId: "station-primary",
      pathNodeId: "node-door-room-01-east"
    }
  ],
  hallways: [
    {
      id: "hall-main",
      label: "Main hallway",
      widthFeet: 8,
      points: [
        { x: 0, y: 12 },
        { x: 54, y: 12 }
      ]
    }
  ],
  doors: [
    {
      id: "door-room-01-east",
      label: "Room 01 east door",
      roomId: "room-01",
      x: 12,
      y: 5,
      widthFeet: 4,
      pathNodeId: "node-door-room-01-east"
    },
    {
      id: "door-hall-main-north",
      label: "Main hall north door",
      roomId: "room-01",
      x: 8,
      y: 12,
      widthFeet: 4,
      pathNodeId: null
    }
  ],
  nurseStations: [
    {
      id: "station-primary",
      label: "Primary nurse station",
      stationType: "primary",
      x: 30,
      y: 4,
      widthFeet: 10,
      lengthFeet: 6,
      pathNodeId: "node-station-primary"
    }
  ],
  zones: [
    {
      id: "zone-ems-entry",
      label: "EMS entry",
      zoneType: "ems_entry",
      color: "#4f8a67",
      x: 0,
      y: 22,
      widthFeet: 14,
      lengthFeet: 10,
      travelBlocked: false,
      travelPenalty: 1
    }
  ],
  pathNodes: [
    {
      id: "node-door-room-01-east",
      nodeType: "room_door",
      x: 12,
      y: 5,
      linkedObjectId: "door-room-01-east"
    },
    {
      id: "node-hall-main",
      nodeType: "hallway",
      x: 20,
      y: 12,
      linkedObjectId: "hall-main"
    },
    {
      id: "node-station-primary",
      nodeType: "station",
      x: 35,
      y: 7,
      linkedObjectId: "station-primary"
    }
  ],
  pathEdges: [
    {
      id: "edge-room-01-hall",
      fromNodeId: "node-door-room-01-east",
      toNodeId: "node-hall-main",
      lengthFeet: 8,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 4,
      turnPenaltySeconds: 2,
      blocked: false
    },
    {
      id: "edge-station-hall",
      fromNodeId: "node-station-primary",
      toNodeId: "node-hall-main",
      lengthFeet: 15,
      hallwayWidthFeet: 8,
      congestionFactor: 1,
      doorPenaltySeconds: 0,
      turnPenaltySeconds: 2,
      blocked: false
    }
  ]
};

test("builds deterministic bridge mappings from editable layout and plan references", () => {
  const bridge = buildEditableLayoutPlanPathBridge({ editableLayout, plan: basePlan });
  const validated = validateEditableLayoutPlanPathBridgeContract(bridge);

  assert.equal(validated.editableLayoutId, "editable-layout-basic");
  assert.equal(validated.planId, "plan-bridge-adapter-basic");
  assert.deepEqual(
    validated.roomMappings.map((mapping) => mapping.editableObjectId),
    ["room-01", "room-02"]
  );
  assert.deepEqual(validated.roomMappings[0], {
    editableObjectId: "room-01",
    planObjectId: "room-01",
    pathNodeIds: ["node-door-room-01-east"],
    pathEdgeIds: ["edge-room-01-hall"],
    mappingStatus: "mapped"
  });
  assert.deepEqual(validated.roomMappings[1], {
    editableObjectId: "room-02",
    planObjectId: null,
    pathNodeIds: [],
    pathEdgeIds: [],
    mappingStatus: "missing_plan_object"
  });
  assert.equal(validated.doorMappings[0].mappingStatus, "missing_path_reference");
  assert.equal(validated.doorMappings[1].mappingStatus, "mapped");
  assert.deepEqual(validated.hallwayMappings[0].pathEdgeIds, [
    "edge-room-01-hall",
    "edge-station-hall"
  ]);
  assert.equal(validated.zoneMappings[0].mappingStatus, "not_required");
});

test("uses explicit mapping tables when source IDs differ", () => {
  const remappedPlan = {
    ...basePlan,
    rooms: basePlan.rooms.map((room) => ({ ...room, id: "plan-room-01" })),
    doors: basePlan.doors.map((door) =>
      door.id === "door-room-01-east" ? { ...door, id: "plan-door-room-01-east" } : door
    ),
    nurseStations: basePlan.nurseStations.map((station) => ({ ...station, id: "plan-station-primary" })),
    pathNodes: basePlan.pathNodes.map((node) => {
      if (node.id === "node-door-room-01-east") {
        return { ...node, linkedObjectId: "plan-door-room-01-east" };
      }
      if (node.id === "node-station-primary") {
        return { ...node, linkedObjectId: "plan-station-primary" };
      }
      return node;
    })
  };

  const bridge = buildEditableLayoutPlanPathBridge({
    editableLayout,
    plan: remappedPlan,
    explicitMappings: {
      rooms: { "room-01": "plan-room-01" },
      doors: { "door-room-01-east": "plan-door-room-01-east" },
      stations: { "station-primary": "plan-station-primary" }
    }
  });

  assert.equal(bridge.roomMappings[0].planObjectId, "plan-room-01");
  assert.equal(bridge.roomMappings[0].mappingStatus, "mapped");
  assert.equal(bridge.doorMappings[1].planObjectId, "plan-door-room-01-east");
  assert.equal(bridge.doorMappings[1].mappingStatus, "mapped");
  assert.equal(bridge.stationMappings[1].planObjectId, "plan-station-primary");
  assert.equal(bridge.stationMappings[1].mappingStatus, "mapped");
});

test("marks missing path references explicitly without mutating the plan", () => {
  const planWithoutPathRefs = {
    ...basePlan,
    rooms: basePlan.rooms.map((room) => ({ ...room, pathNodeId: null })),
    doors: basePlan.doors.map((door) => ({ ...door, pathNodeId: null })),
    nurseStations: basePlan.nurseStations.map((station) => ({
      ...station,
      pathNodeId: "node-missing-station"
    })),
    pathNodes: [],
    pathEdges: []
  };
  const before = JSON.stringify(planWithoutPathRefs);

  const bridge = buildEditableLayoutPlanPathBridge({
    editableLayout,
    plan: planWithoutPathRefs
  });

  assert.equal(bridge.roomMappings[0].mappingStatus, "missing_path_reference");
  assert.equal(bridge.doorMappings[1].mappingStatus, "missing_path_reference");
  assert.equal(bridge.stationMappings[1].mappingStatus, "missing_path_reference");
  assert.equal(JSON.stringify(planWithoutPathRefs), before);
});
