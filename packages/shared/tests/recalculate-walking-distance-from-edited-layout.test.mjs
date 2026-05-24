import assert from "node:assert/strict";
import test from "node:test";

import {
  rebuildPathEdgeLengthsFromNodeGeometry,
  recalculateWalkingDistanceFromEditedLayout
} from "../dist/index.js";

function buildPlan({ destinationX }) {
  return {
    schemaVersion: "1.0.0",
    planId: `walking-distance-plan-${destinationX}`,
    name: "Walking distance recalculation proof plan",
    description: "Synthetic operational plan for walking distance recalculation.",
    createdAt: "2026-05-24T00:00:00Z",
    updatedAt: "2026-05-24T00:00:00Z",
    scale: {
      unit: "feet",
      pixelsPerUnit: 10,
      gridSizeFeet: 1,
      snapToGrid: true,
      origin: "top-left"
    },
    rooms: [],
    hallways: [
      {
        id: "hall-start",
        label: "Start hall",
        widthFeet: 8,
        points: [
          { x: 0, y: 0 },
          { x: destinationX, y: 0 }
        ]
      },
      {
        id: "hall-destination",
        label: "Destination hall",
        widthFeet: 8,
        points: [
          { x: destinationX, y: 0 },
          { x: destinationX + 1, y: 0 }
        ]
      }
    ],
    doors: [],
    nurseStations: [],
    zones: [],
    pathNodes: [
      {
        id: "node-start",
        nodeType: "hallway",
        x: 0,
        y: 0,
        linkedObjectId: "hall-start"
      },
      {
        id: "node-destination",
        nodeType: "hallway",
        x: destinationX,
        y: 0,
        linkedObjectId: "hall-destination"
      }
    ],
    pathEdges: [
      {
        id: "edge-start-destination",
        fromNodeId: "node-start",
        toNodeId: "node-destination",
        lengthFeet: 999,
        hallwayWidthFeet: 8,
        congestionFactor: 1,
        doorPenaltySeconds: 0,
        turnPenaltySeconds: 0,
        blocked: false
      }
    ]
  };
}

test("recalculates shorter walking distance from edited path node geometry", () => {
  const baselinePlan = buildPlan({ destinationX: 10 });
  const editedPlan = buildPlan({ destinationX: 6 });
  const result = recalculateWalkingDistanceFromEditedLayout({
    baselinePlan,
    editedPlan,
    originNodeId: "node-start",
    destinationNodeId: "node-destination"
  });

  assert.equal(result.baselineDistanceFeet, 10);
  assert.equal(result.editedDistanceFeet, 6);
  assert.equal(result.deltaFeet, -4);
  assert.equal(result.percentChange, -40);
  assert.deepEqual(result.baselineRouteEdgeIds, ["edge-start-destination"]);
  assert.deepEqual(result.editedRouteEdgeIds, ["edge-start-destination"]);
  assert.equal(baselinePlan.pathEdges[0].lengthFeet, 999);
  assert.equal(editedPlan.pathEdges[0].lengthFeet, 999);
});

test("recalculates longer walking distance from edited path node geometry", () => {
  const result = recalculateWalkingDistanceFromEditedLayout({
    baselinePlan: buildPlan({ destinationX: 10 }),
    editedPlan: buildPlan({ destinationX: 15 }),
    originNodeId: "node-start",
    destinationNodeId: "node-destination"
  });

  assert.equal(result.baselineDistanceFeet, 10);
  assert.equal(result.editedDistanceFeet, 15);
  assert.equal(result.deltaFeet, 5);
  assert.equal(result.percentChange, 50);
});

test("recalculates unchanged walking distance deterministically", () => {
  const result = recalculateWalkingDistanceFromEditedLayout({
    baselinePlan: buildPlan({ destinationX: 10 }),
    editedPlan: buildPlan({ destinationX: 10 }),
    originNodeId: "node-start",
    destinationNodeId: "node-destination"
  });

  assert.equal(result.baselineDistanceFeet, 10);
  assert.equal(result.editedDistanceFeet, 10);
  assert.equal(result.deltaFeet, 0);
  assert.equal(result.percentChange, 0);
});

test("edge length rebuild uses path node geometry instead of stored edge length", () => {
  const rebuilt = rebuildPathEdgeLengthsFromNodeGeometry(buildPlan({ destinationX: 12 }));

  assert.equal(rebuilt.pathEdges[0].lengthFeet, 12);
});
