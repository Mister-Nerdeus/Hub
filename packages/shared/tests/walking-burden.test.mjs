import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateManualAssignmentWalkingBurden,
  resolveManualWalkingDistance,
  shortestPathDistance
} from "../dist/index.js";

const graphInput = {
  nurses: [{ nurseId: "nurse-blue" }, { nurseId: "nurse-green" }],
  station: { stationId: "station-a", pathNodeId: "station", x: 0, y: 0 },
  rooms: [
    { roomId: "room-101", pathNodeId: "r101", x: 30, y: 0 },
    { roomId: "room-102", pathNodeId: "r102", x: 60, y: 0 },
    { roomId: "room-103", pathNodeId: "r103", x: 60, y: 40 }
  ],
  assignments: [
    { nurseId: "nurse-blue", roomId: "room-101" },
    { nurseId: "nurse-blue", roomId: "room-103" }
  ],
  pathNodes: [
    { nodeId: "station", x: 0, y: 0 },
    { nodeId: "r101", x: 30, y: 0 },
    { nodeId: "r102", x: 60, y: 0 },
    { nodeId: "r103", x: 60, y: 40 }
  ],
  pathEdges: [
    { edgeId: "station-r101", fromNodeId: "station", toNodeId: "r101", distanceUnits: 30 },
    { edgeId: "r101-r102", fromNodeId: "r101", toNodeId: "r102", distanceUnits: 30 },
    { edgeId: "r102-r103", fromNodeId: "r102", toNodeId: "r103", distanceUnits: 40 }
  ]
};

test("shortest path uses deterministic path graph distance", () => {
  assert.equal(shortestPathDistance("station", "r103", graphInput.pathNodes, graphInput.pathEdges), 100);
  assert.equal(resolveManualWalkingDistance(graphInput.station, graphInput.rooms[2], graphInput).method, "path-graph");
});

test("straight-line fallback is explicit when graph path is unavailable", () => {
  const result = resolveManualWalkingDistance(
    { x: 0, y: 0, pathNodeId: "missing-a" },
    { x: 3, y: 4, pathNodeId: "missing-b" },
    graphInput
  );
  assert.equal(result.method, "straight-line-fallback");
  assert.equal(result.distanceUnits, 5);
});

test("walking burden summarizes station distance and room spread", () => {
  const summary = calculateManualAssignmentWalkingBurden(graphInput).find((entry) => entry.nurseId === "nurse-blue");
  assert.ok(summary);
  assert.equal(summary.assignedRoomCount, 2);
  assert.equal(summary.stationToRoomDistance, 130);
  assert.equal(summary.roomToRoomSpread, 70);
  assert.equal(summary.usedGraphDistance, true);
  assert.equal(summary.syntheticDataOnly, true);
});
