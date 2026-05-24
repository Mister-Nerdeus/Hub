import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import {
  clearLayoutSelection,
  findEditableLayoutObject,
  hasEditableLayoutObject,
  selectEditableLayoutObject
} from "./layoutSelectionModel";

const editableLayout: EditableLayoutGeometryContract = {
  schemaVersion: "1.0.0",
  layoutId: "layout-selection-model-proof",
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
      widthFeet: 32,
      heightFeet: 8
    }
  ],
  zones: [
    {
      objectType: "zone",
      id: "zone-ems-entry",
      label: "EMS entry",
      zoneType: "ems_entry",
      xFeet: 0,
      yFeet: 22,
      widthFeet: 12,
      heightFeet: 8
    }
  ],
  limitations: ["Selection model fixture uses stable editable layout object IDs only."]
};

const layoutSnapshot = JSON.stringify(editableLayout);

const selections = [
  ["room", "room-01"],
  ["door", "door-room-01-east"],
  ["station", "station-primary"],
  ["hallway", "hall-main"],
  ["zone", "zone-ems-entry"]
] as const;

for (const [objectType, objectId] of selections) {
  const selection = selectEditableLayoutObject(editableLayout, objectType, objectId);
  if (selection?.objectType !== objectType || selection.objectId !== objectId) {
    throw new Error(`selection model must select ${objectType} by stable ID`);
  }
  if (!hasEditableLayoutObject(editableLayout, objectType, objectId)) {
    throw new Error(`selection model must find ${objectType} by stable ID`);
  }
  if (findEditableLayoutObject(editableLayout, objectType, objectId)?.id !== objectId) {
    throw new Error(`selection model lookup must return the selected ${objectType}`);
  }
}

if (selectEditableLayoutObject(editableLayout, "room", "missing-room") !== null) {
  throw new Error("unknown selection IDs must produce a deterministic null selection");
}

if (clearLayoutSelection() !== null) {
  throw new Error("clearing selection must be deterministic");
}

try {
  selectEditableLayoutObject(editableLayout, "bed" as never, "room-01");
  throw new Error("unsupported selection type must fail");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("objectType")) {
    throw error;
  }
}

try {
  selectEditableLayoutObject(editableLayout, "room", "");
  throw new Error("empty selection IDs must fail");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("objectId")) {
    throw error;
  }
}

if (JSON.stringify(editableLayout) !== layoutSnapshot) {
  throw new Error("selection model must not mutate editable layout geometry");
}
