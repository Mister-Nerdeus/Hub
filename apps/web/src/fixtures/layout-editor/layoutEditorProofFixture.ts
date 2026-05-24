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
  limitations: ["Proof-only layout fixture; source geometry remains feet-based."]
};

export const layoutEditorProofFixture = validateEditableLayoutGeometryContract(
  layoutEditorProofFixtureSource
);
