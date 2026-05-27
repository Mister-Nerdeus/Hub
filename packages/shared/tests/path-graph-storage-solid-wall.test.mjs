import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildPatientCareRoutingDestinations,
  calculateManualAssignmentWalkingBurden,
  generateDoorPathNodes,
  validatePathGraphBlockingRules
} from "../dist/index.js";
import { testEditableLayout, testPlan } from "./authoring-test-helpers.mjs";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const plan1 = JSON.parse(
  readFileSync(join(repoRoot, "packages", "shared", "fixtures", "default-plans", "default-er-layout-plan-1.json"), "utf8")
).plan;

test("storage is excluded from patient-care routing destinations on the canonical floorplan", () => {
  const destinations = buildPatientCareRoutingDestinations(plan1);
  assert.equal(destinations.some((destination) => destination.roomId === "room-14"), false);
  assert.equal(destinations.some((destination) => destination.roomId === "room-level-1-trauma"), true);
});

test("solid wall path node references fail path graph blocking validation", () => {
  const invalidPlan = {
    ...testPlan,
    rooms: testPlan.rooms.map((room) =>
      room.id === "room-01"
        ? { ...room, roomType: "solid_wall", pathNodeId: "node-door-room-01" }
        : room
    ),
    doors: testPlan.doors.map((door) =>
      door.roomId === "room-01" ? { ...door, pathNodeId: "node-door-room-01" } : door
    ),
    pathNodes: [
      ...testPlan.pathNodes,
      {
        id: "node-door-room-01",
        nodeType: "room_door",
        x: 10,
        y: 10,
        linkedObjectId: "door-room-01",
        entryOperationalMetadata: null
      }
    ],
    pathEdges: [
      ...testPlan.pathEdges,
      {
        id: "edge-solid-wall-node",
        fromNodeId: "node-door-room-01",
        toNodeId: "node-station-01",
        lengthFeet: 10,
        hallwayWidthFeet: 6,
        congestionFactor: 1,
        doorPenaltySeconds: 0,
        turnPenaltySeconds: 0,
        blocked: false
      }
    ]
  };
  const validation = validatePathGraphBlockingRules(invalidPlan);
  assert.equal(validation.status, "failed");
  assert.equal(validation.blockingIssues.some((issue) => issue.code === "SOLID_WALL_ROOM_PATH_NODE"), true);
  assert.equal(validation.blockingIssues.some((issue) => issue.code === "SOLID_WALL_DOOR_PATH_NODE"), true);
  assert.equal(validation.blockingIssues.some((issue) => issue.code === "SOLID_WALL_ROUTE_EDGE"), true);
});

test("door path node generation skips storage rooms and solid-wall rooms remain ineligible", () => {
  const layoutWithExcludedRooms = {
    ...testEditableLayout,
    rooms: [
      ...testEditableLayout.rooms,
      {
        objectType: "room",
        id: "storage-room",
        label: "Storage Room",
        roomNumber: "Storage Room",
        roomType: "storage",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 30,
        yFeet: 20,
        widthFeet: 10,
        heightFeet: 8
      }
    ],
    doors: [
      ...testEditableLayout.doors,
      {
        objectType: "door",
        id: "door-storage-room",
        label: "Storage Door",
        ownerKind: "room",
        ownerId: "storage-room",
        wall: "south",
        offsetFeet: 3,
        widthFeet: 3
      }
    ]
  };
  const generated = generateDoorPathNodes({
    sourcePlan: testPlan,
    editableLayout: layoutWithExcludedRooms,
    replaceGenerated: true
  });
  assert.equal(generated.generatedNodes.some((node) => node.linkedRoomId === "storage-room"), false);
  assert.equal(generated.plan.rooms.find((room) => room.id === "storage-room"), undefined);
});

test("manual walking burden excludes storage and solid-wall room assignments", () => {
  const summaries = calculateManualAssignmentWalkingBurden({
    nurses: [{ nurseId: "nurse-blue" }],
    station: { stationId: "station-a", pathNodeId: "station", x: 0, y: 0 },
    rooms: [
      { roomId: "room-care", roomType: "standard", pathNodeId: "care", x: 30, y: 0 },
      { roomId: "room-storage", roomType: "storage", pathNodeId: "storage", x: 60, y: 0 },
      { roomId: "room-solid", roomType: "solid_wall", pathNodeId: "solid", x: 90, y: 0 }
    ],
    assignments: [
      { nurseId: "nurse-blue", roomId: "room-care" },
      { nurseId: "nurse-blue", roomId: "room-storage" },
      { nurseId: "nurse-blue", roomId: "room-solid" }
    ],
    pathNodes: [
      { nodeId: "station", x: 0, y: 0 },
      { nodeId: "care", x: 30, y: 0 },
      { nodeId: "storage", x: 60, y: 0 },
      { nodeId: "solid", x: 90, y: 0 }
    ],
    pathEdges: [
      { edgeId: "station-care", fromNodeId: "station", toNodeId: "care", distanceUnits: 30 },
      { edgeId: "care-storage", fromNodeId: "care", toNodeId: "storage", distanceUnits: 30 },
      { edgeId: "storage-solid", fromNodeId: "storage", toNodeId: "solid", distanceUnits: 30 }
    ]
  });
  assert.equal(summaries[0].assignedRoomCount, 1);
  assert.deepEqual(summaries[0].excludedRoomIds, ["room-solid", "room-storage"]);
  assert.equal(summaries[0].stationToRoomDistance, 30);
  assert.equal(summaries[0].roomToRoomSpread, 0);
});
