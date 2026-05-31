import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { buildLayoutInspectorViewModel } from "./layoutInspectorViewModel";
import type { LayoutSelectionObjectType } from "./layoutSelectionModel";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  },
  ok(value: unknown, message: string): void {
    if (!value) {
      throw new Error(message);
    }
  }
};

const layout = layoutEditorProofFixture;

const objectCases = [
  {
    objectType: "room",
    objectId: "room-01",
    expectedTitle: "Room 01",
    expectedIsReadOnly: false,
    expectedSections: ["Room identity", "Room type & capacity", "Operational capabilities", "Geometry"],
    expectedFields: [
      ["Room number", "01"],
      ["Room type", "standard"],
      ["Capacity type", "single"],
      ["Hall bed", "No"],
      ["Trauma adjacent", "No"],
      ["Width", "12 ft"]
    ]
  },
  {
    objectType: "door",
    objectId: "door-room-01-east",
    expectedTitle: "Room 01 east door",
    expectedIsReadOnly: true,
    expectedSections: ["Door location"],
    expectedFields: [
      ["Connected room", "01 - Room 01"],
      ["Wall", "east"],
      ["Offset", "3 ft"],
      ["Width", "4 ft"]
    ]
  },
  {
    objectType: "station",
    objectId: "station-primary",
    expectedTitle: "Primary nurse station",
    expectedIsReadOnly: false,
    expectedSections: ["Station metadata", "Station geometry"],
    expectedFields: [
      ["Station type", "nurse_station"],
      ["Height", "6 ft"]
    ]
  },
  {
    objectType: "hallway",
    objectId: "hall-main",
    expectedTitle: "Main hallway",
    expectedIsReadOnly: true,
    expectedSections: ["Hallway geometry"],
    expectedFields: [
      ["X", "0 ft"],
      ["Width", "64 ft"]
    ]
  },
  {
    objectType: "zone",
    objectId: "zone-entry",
    expectedTitle: "Entry zone",
    expectedIsReadOnly: true,
    expectedSections: ["Zone metadata", "Geometry"],
    expectedFields: [
      ["Zone type", "ems_entry"],
      ["Y", "0 ft"]
    ]
  }
] as const;

for (const objectCase of objectCases) {
  const viewModel = buildLayoutInspectorViewModel({
    layout,
    selectedObjectType: objectCase.objectType,
    selectedObjectId: objectCase.objectId
  });
  assert.equal(viewModel.status, "selected");
  assert.equal(viewModel.title, objectCase.expectedTitle);
  assert.equal(viewModel.objectType, objectCase.objectType);
  assert.equal(viewModel.objectId, objectCase.objectId);
  assert.equal(viewModel.sourceUnits, "feet");
  assert.equal(viewModel.isReadOnly, objectCase.expectedIsReadOnly);
  assert.deepEqual(
    viewModel.sections.map((section) => section.title),
    [...objectCase.expectedSections]
  );

  const fields = viewModel.sections.flatMap((section) => section.fields);
  for (const [label, value] of objectCase.expectedFields) {
    assert.ok(
      fields.some((field) => field.label === label && field.value === value),
      `${objectCase.objectType} inspector should include ${label}: ${value}`
    );
  }
}

const emptyViewModel = buildLayoutInspectorViewModel({
  layout,
  selectedObjectType: null,
  selectedObjectId: null
});
assert.equal(emptyViewModel.status, "empty");
assert.equal(emptyViewModel.objectType, null);
assert.equal(emptyViewModel.objectId, null);
assert.equal(emptyViewModel.sections.length, 0);

const missingViewModel = buildLayoutInspectorViewModel({
  layout,
  selectedObjectType: "room",
  selectedObjectId: "missing-room"
});
assert.equal(missingViewModel.status, "missing");
assert.equal(missingViewModel.objectType, "room");
assert.equal(missingViewModel.objectId, "missing-room");
assert.equal(missingViewModel.sections.length, 0);

const roomViewModel = buildLayoutInspectorViewModel({
  layout,
  selectedObjectType: "room",
  selectedObjectId: "room-01"
});
assert.deepEqual(
  roomViewModel.sections.flatMap((section) =>
    section.fields
      .filter((field) => field.editKey != null)
      .map((field) => [field.label, field.editKey, field.valueFeet])
  ),
  [
    ["X", "xFeet", 0],
    ["Y", "yFeet", 0],
    ["Width", "widthFeet", 12],
    ["Height", "heightFeet", 10]
  ]
);
const serializedFields = JSON.stringify(roomViewModel.sections);
assert.equal(serializedFields.includes("pixel"), false);
assert.equal(serializedFields.includes("px"), false);
assert.equal(JSON.stringify(roomViewModel.normalSections).includes("Object ID"), false);
assert.ok(
  roomViewModel.advancedSections.some((section) =>
    section.fields.some((field) => field.label === "Object ID" && field.value === "room-01")
  ),
  "technical object ID belongs in advanced inspector sections"
);

const storageViewModel = buildLayoutInspectorViewModel({
  layout: {
    ...layout,
    rooms: [
      ...layout.rooms,
      {
        objectType: "room",
        id: "storage-proof",
        label: "Storage proof",
        roomNumber: "22",
        roomType: "storage",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 1,
        yFeet: 1,
        widthFeet: 4,
        heightFeet: 4
      }
    ]
  },
  selectedObjectType: "room",
  selectedObjectId: "storage-proof"
});
const storageFields = storageViewModel.sections.flatMap((section) => section.fields);
assert.ok(
  storageFields.some((field) => field.label === "Room type" && field.value === "Storage (non-patient)"),
  "storage inspector must clearly show storage type"
);

const selectedTypes = objectCases.map((objectCase) => objectCase.objectType);
assert.deepEqual(selectedTypes, ["room", "door", "station", "hallway", "zone"] satisfies LayoutSelectionObjectType[]);
