import type { PlanContract } from "@nerdeus/shared";

export type DefaultPlanFixtureReference = {
  planId: string;
  fixturePath: string;
};

export const defaultPlanFixtureReferences: DefaultPlanFixtureReference[] = [
  {
    planId: "default-er-layout-plan-1",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json"
  },
  {
    planId: "default-er-layout-plan-2",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-2.json"
  },
  {
    planId: "default-er-layout-plan-3",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-3.json"
  },
  {
    planId: "default-er-layout-plan-4",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-4.json"
  },
  {
    planId: "default-er-layout-plan-5",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-5.json"
  }
];

export const defaultPlanRenderProofPlans: PlanContract[] = defaultPlanFixtureReferences.map(
  (reference, index) => {
    const offset = index * 6;
    return {
      schemaVersion: "1.0.0",
      planId: reference.planId,
      name: `ER Layout Plan ${index + 1}`,
      description: "Web render proof fixture for default plan import audit.",
      createdAt: "2026-05-24T00:00:00Z",
      updatedAt: "2026-05-24T00:00:00Z",
      scale: { unit: "feet", pixelsPerUnit: 6, gridSizeFeet: 1, snapToGrid: true, origin: "top-left" },
      rooms: [
        {
          id: `render-room-${index + 1}`,
          label: `Render Room ${index + 1}`,
          roomType: "standard",
          x: 8 + offset,
          y: 8,
          widthFeet: 12,
          lengthFeet: 10,
          maxPatients: 1,
          traumaCapable: false,
          isolationCapable: false,
          doorPoint: { x: 14 + offset, y: 18 },
          zoneId: `render-zone-${index + 1}`,
          nearestStationId: `render-station-${index + 1}`,
          pathNodeId: `render-node-door-${index + 1}`
        }
      ],
      hallways: [
        {
          id: `render-hallway-${index + 1}`,
          label: `Render Hall ${index + 1}`,
          widthFeet: 8,
          points: [
            { x: 4 + offset, y: 24 },
            { x: 34 + offset, y: 24 }
          ]
        }
      ],
      doors: [
        {
          id: `render-door-${index + 1}`,
          label: `Render Door ${index + 1}`,
          roomId: `render-room-${index + 1}`,
          x: 14 + offset,
          y: 18,
          widthFeet: 3,
          pathNodeId: `render-node-door-${index + 1}`
        }
      ],
      nurseStations: [
        {
          id: `render-station-${index + 1}`,
          label: `Render Station ${index + 1}`,
          stationType: "primary",
          x: 24 + offset,
          y: 16,
          widthFeet: 8,
          lengthFeet: 6,
          pathNodeId: `render-node-station-${index + 1}`
        }
      ],
      zones: [
        {
          id: `render-zone-${index + 1}`,
          label: `Render Zone ${index + 1}`,
          zoneType: "provider_area",
          color: "#6b8f71",
          x: 6 + offset,
          y: 6,
          widthFeet: 30,
          lengthFeet: 24,
          travelBlocked: false,
          travelPenalty: 1
        }
      ],
      pathNodes: [
        {
          id: `render-node-door-${index + 1}`,
          nodeType: "room_door",
          x: 14 + offset,
          y: 20,
          linkedObjectId: `render-door-${index + 1}`
        },
        {
          id: `render-node-station-${index + 1}`,
          nodeType: "station",
          x: 28 + offset,
          y: 24,
          linkedObjectId: `render-station-${index + 1}`
        }
      ],
      pathEdges: [
        {
          id: `render-edge-${index + 1}`,
          fromNodeId: `render-node-door-${index + 1}`,
          toNodeId: `render-node-station-${index + 1}`,
          lengthFeet: 14,
          hallwayWidthFeet: 8,
          congestionFactor: 1,
          doorPenaltySeconds: 3,
          turnPenaltySeconds: 1,
          blocked: false
        }
      ]
    };
  }
);
