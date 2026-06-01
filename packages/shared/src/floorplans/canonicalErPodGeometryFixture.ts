import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";

const fixtureSource: EditableLayoutGeometryContract = {
  schemaVersion: "1.0.0",
  layoutId: "canonical-er-pod-geometry-route-readiness",
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
    },
    {
      objectType: "room",
      id: "room-02",
      label: "Room 02",
      roomNumber: "02",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 0,
      yFeet: 24,
      widthFeet: 12,
      heightFeet: 10
    },
    {
      objectType: "room",
      id: "room-03",
      label: "Room 03 split",
      roomNumber: "03",
      roomType: "overflow",
      capacityType: "double",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 16,
      yFeet: 0,
      widthFeet: 14,
      heightFeet: 10
    },
    {
      objectType: "room",
      id: "room-04",
      label: "Room 04",
      roomNumber: "04",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 16,
      yFeet: 24,
      widthFeet: 12,
      heightFeet: 10
    },
    {
      objectType: "room",
      id: "room-storage-clean",
      label: "Clean storage",
      roomNumber: "Storage",
      roomType: "storage",
      capacityType: "flex",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 34,
      yFeet: 24,
      widthFeet: 10,
      heightFeet: 10
    }
  ],
  doors: [
    {
      objectType: "door",
      id: "door-room-01-south",
      label: "Room 01 south door",
      ownerKind: "room",
      ownerId: "room-01",
      wall: "south",
      offsetFeet: 4,
      widthFeet: 4
    },
    {
      objectType: "door",
      id: "door-room-02-north",
      label: "Room 02 north door",
      ownerKind: "room",
      ownerId: "room-02",
      wall: "north",
      offsetFeet: 4,
      widthFeet: 4
    },
    {
      objectType: "door",
      id: "door-room-03-south",
      label: "Room 03 south door",
      ownerKind: "room",
      ownerId: "room-03",
      wall: "south",
      offsetFeet: 5,
      widthFeet: 4
    },
    {
      objectType: "door",
      id: "door-room-04-west",
      label: "Room 04 west door",
      ownerKind: "room",
      ownerId: "room-04",
      wall: "west",
      offsetFeet: 3,
      widthFeet: 4
    },
    {
      objectType: "door",
      id: "door-clean-storage-west",
      label: "Clean storage west door",
      ownerKind: "room",
      ownerId: "room-storage-clean",
      wall: "west",
      offsetFeet: 3,
      widthFeet: 4
    }
  ],
  supportAccessPoints: [
    {
      objectType: "support_access",
      id: "support-access-provider-pharmacy-west",
      label: "Provider pharmacy access",
      ownerKind: "zone",
      ownerId: "zone-provider-pharmacy",
      wall: "west",
      offsetFeet: 2,
      widthFeet: 4
    }
  ],
  stations: [
    {
      objectType: "station",
      id: "station-alpha",
      label: "Station Alpha",
      stationType: "nurse_station",
      assignmentTarget: true,
      xFeet: 34,
      yFeet: 12,
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
      widthFeet: 58,
      heightFeet: 8
    },
    {
      objectType: "hallway",
      id: "hall-east",
      label: "East connector",
      xFeet: 46,
      yFeet: 0,
      widthFeet: 8,
      heightFeet: 34
    }
  ],
  zones: [
    {
      objectType: "zone",
      id: "zone-entry",
      label: "Entry zone",
      zoneType: "ems_entry",
      xFeet: 56,
      yFeet: 12,
      widthFeet: 8,
      heightFeet: 8
    },
    {
      objectType: "zone",
      id: "zone-provider-pharmacy",
      label: "Provider pharmacy support",
      zoneType: "provider_pharmacy",
      assignmentTarget: true,
      xFeet: 56,
      yFeet: 0,
      widthFeet: 10,
      heightFeet: 10
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
          widthFeet: 70,
          heightFeet: 0.5,
          orientation: "horizontal",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: "perimeter-er-pod-east",
          label: "East boundary",
          xFeet: 68,
          yFeet: -2,
          widthFeet: 0.5,
          heightFeet: 40,
          orientation: "vertical",
          blocksTravel: true,
          locked: true
        },
        {
          segmentId: "perimeter-er-pod-south",
          label: "South boundary",
          xFeet: -2,
          yFeet: 38,
          widthFeet: 70,
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
          heightFeet: 40,
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
      xFeet: 58,
      yFeet: 14,
      widthFeet: 8,
      heightFeet: 4,
      connectsFromId: "hall-main",
      connectsTo: {
        destinationKind: "hallway",
        destinationId: "hall-main",
        displayLabel: "Main hallway"
      },
      blocksTravel: false
    },
    {
      entryExitId: "exit-east",
      label: "East exit",
      kind: "external_exit",
      xFeet: 66,
      yFeet: 12,
      widthFeet: 2,
      heightFeet: 8,
      connectsFromId: "hall-east",
      connectsTo: {
        destinationKind: "external",
        displayLabel: "External exit"
      },
      blocksTravel: false
    }
  ],
  doorDestinations: [
    {
      doorId: "door-room-01-south",
      ownerKind: "room",
      ownerId: "room-01",
      leadsToKind: "hallway",
      leadsToId: "hall-main",
      leadsToLabel: "Main hallway",
      travelRole: "patient_flow"
    },
    {
      doorId: "door-room-02-north",
      ownerKind: "room",
      ownerId: "room-02",
      leadsToKind: "hallway",
      leadsToId: "hall-main",
      leadsToLabel: "Main hallway",
      travelRole: "patient_flow"
    },
    {
      doorId: "door-room-03-south",
      ownerKind: "room",
      ownerId: "room-03",
      leadsToKind: "hallway",
      leadsToId: "hall-main",
      leadsToLabel: "Main hallway",
      travelRole: "patient_flow"
    },
    {
      doorId: "door-room-04-west",
      ownerKind: "room",
      ownerId: "room-04",
      leadsToKind: "unknown",
      leadsToLabel: "Unknown destination",
      travelRole: "unknown"
    },
    {
      doorId: "door-clean-storage-west",
      ownerKind: "room",
      ownerId: "room-storage-clean",
      leadsToKind: "hallway",
      leadsToId: "hall-east",
      leadsToLabel: "East connector",
      travelRole: "supply_flow"
    },
    {
      doorId: "support-access-provider-pharmacy-west",
      ownerKind: "zone",
      ownerId: "zone-provider-pharmacy",
      leadsToKind: "hallway",
      leadsToId: "hall-east",
      leadsToLabel: "East connector",
      travelRole: "staff_flow"
    }
  ],
  splitRooms: [
    {
      splitRoomId: "split-room-room-03",
      parentRoomId: "room-03",
      splitMode: "two_bed",
      dividerOrientation: "vertical",
      dividerRatio: 0.5,
      bedPositions: [
        {
          bedPositionId: "room-03:bed-a",
          parentRoomId: "room-03",
          label: "Room 03A",
          assignmentTarget: true,
          relativeBounds: {
            xRatio: 0,
            yRatio: 0,
            widthRatio: 0.5,
            heightRatio: 1
          }
        },
        {
          bedPositionId: "room-03:bed-b",
          parentRoomId: "room-03",
          label: "Room 03B",
          assignmentTarget: true,
          relativeBounds: {
            xRatio: 0.5,
            yRatio: 0,
            widthRatio: 0.5,
            heightRatio: 1
          }
        }
      ]
    }
  ],
  splitBays: [],
  limitations: [
    "Synthetic geometry-only fixture for route-connectivity readiness proof.",
    "Unknown door destination is intentional validation evidence."
  ]
};

export const canonicalErPodGeometryFixture =
  validateEditableLayoutGeometryContract(fixtureSource);
