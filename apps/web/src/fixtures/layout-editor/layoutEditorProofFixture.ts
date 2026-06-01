import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "@nerdeus/shared";

const layoutEditorProofFixtureSource: EditableLayoutGeometryContract = {
  schemaVersion: "1.0.0",
  layoutId: "layout-editor-stage-proof",
  units: "feet",
  rooms: [
    {
      objectType: "room",
      id: "room-01",
      label: "Room 01",
      roomNumber: "01",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 0,
      yFeet: 0,
      widthFeet: 12,
      heightFeet: 10
    }
  ],
  doors: [
    {
      objectType: "door",
      id: "door-room-01-east",
      label: "Room 01 east door",
      ownerKind: "room",
      ownerId: "room-01",
      wall: "east",
      offsetFeet: 3,
      widthFeet: 4
    }
  ],
  supportAccessPoints: [],
  stations: [
    {
      objectType: "station",
      id: "station-primary",
      label: "Primary nurse station",
      stationType: "nurse_station",
      xFeet: 18,
      yFeet: 0,
      widthFeet: 10,
      heightFeet: 6
    }
  ],
  hallways: [
    {
      objectType: "hallway",
      id: "hall-main",
      label: "Main hallway",
      xFeet: 0,
      yFeet: 12,
      widthFeet: 64,
      heightFeet: 8
    }
  ],
  zones: [
    {
      objectType: "zone",
      id: "zone-entry",
      label: "Entry zone",
      zoneType: "ems_entry",
      xFeet: 32,
      yFeet: 0,
      widthFeet: 12,
      heightFeet: 8
    }
  ],
  perimeterWalls: [
    {
      perimeterWallId: "perimeter-er-pod",
      label: "ER pod boundary",
      segments: [
        {
          segmentId: "perimeter-er-pod-north",
          label: "North boundary",
          xFeet: -2,
          yFeet: -2,
          widthFeet: 68,
          heightFeet: 0.5,
          orientation: "horizontal",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: "perimeter-er-pod-east",
          label: "East boundary",
          xFeet: 66,
          yFeet: -2,
          widthFeet: 0.5,
          heightFeet: 24,
          orientation: "vertical",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: "perimeter-er-pod-south",
          label: "South boundary",
          xFeet: -2,
          yFeet: 22,
          widthFeet: 68,
          heightFeet: 0.5,
          orientation: "horizontal",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: "perimeter-er-pod-west",
          label: "West boundary",
          xFeet: -2,
          yFeet: -2,
          widthFeet: 0.5,
          heightFeet: 24,
          orientation: "vertical",
          blocksTravel: true,
          locked: true
        }
      ]
    }
  ],
  entryExits: [
    {
      entryExitId: "entry-main-hall",
      label: "Main hall entry",
      kind: "main_entry",
      xFeet: 30,
      yFeet: 20,
      widthFeet: 8,
      heightFeet: 2,
      connectsFromId: "hall-main",
      connectsTo: {
        destinationKind: "hallway",
        destinationId: "hall-main",
        displayLabel: "Main hallway"
      },
      blocksTravel: false
    },
    {
      entryExitId: "exit-external-east",
      label: "External east exit",
      kind: "external_exit",
      xFeet: 64,
      yFeet: 10,
      widthFeet: 2,
      heightFeet: 6,
      connectsTo: {
        destinationKind: "external",
        displayLabel: "External exit"
      },
      blocksTravel: false
    }
  ],
  doorDestinations: [
    {
      doorId: "door-room-01-east",
      ownerKind: "room",
      ownerId: "room-01",
      leadsToKind: "hallway",
      leadsToId: "hall-main",
      leadsToLabel: "Main hallway",
      travelRole: "patient_flow"
    }
  ],
  splitBays: [],
  limitations: ["Proof-only layout fixture; source geometry remains feet-based."]
};

export const layoutEditorProofFixture = validateEditableLayoutGeometryContract(
  layoutEditorProofFixtureSource
);
