import { createSyntheticLayoutAssignmentOverlay } from "../layoutAssignmentOverlayViewModel";
import { layoutEditorProofFixture } from "../../../fixtures/layout-editor/layoutEditorProofFixture";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const before = JSON.stringify(layoutEditorProofFixture.rooms);
const overlay = createSyntheticLayoutAssignmentOverlay(layoutEditorProofFixture);
const after = JSON.stringify(layoutEditorProofFixture.rooms);
const semanticOverlay = createSyntheticLayoutAssignmentOverlay({
  ...layoutEditorProofFixture,
  rooms: [
    ...layoutEditorProofFixture.rooms,
    {
      objectType: "room",
      id: "storage-proof",
      label: "Storage proof",
      roomNumber: "Storage",
      roomType: "storage",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 1,
      yFeet: 1,
      widthFeet: 8,
      heightFeet: 8
    },
    {
      objectType: "room",
      id: "solid-wall-proof",
      label: "Solid wall proof",
      roomNumber: "Wall",
      roomType: "solid_wall",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 10,
      yFeet: 1,
      widthFeet: 8,
      heightFeet: 8
    }
  ]
});

assert(overlay.syntheticDataOnly === true, "overlay must be synthetic");
assert(Object.keys(overlay.roomsById).length === layoutEditorProofFixture.rooms.length, "overlay should cover layout rooms");
assert(overlay.legend.length > 0, "overlay should expose color legend items");
assert(before === after, "overlay builder must not mutate room geometry");
assert(semanticOverlay.roomsById["storage-proof"]?.assignmentColor === null, "storage overlay must skip nurse color");
assert(semanticOverlay.roomsById["solid-wall-proof"]?.assignmentColor === null, "solid wall overlay must skip nurse color");
