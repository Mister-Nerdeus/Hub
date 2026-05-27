import { createSyntheticLayoutAssignmentOverlay } from "../layoutAssignmentOverlayViewModel";
import { layoutEditorProofFixture } from "../../../fixtures/layout-editor/layoutEditorProofFixture";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const before = JSON.stringify(layoutEditorProofFixture.rooms);
const overlay = createSyntheticLayoutAssignmentOverlay(layoutEditorProofFixture);
const after = JSON.stringify(layoutEditorProofFixture.rooms);

assert(overlay.syntheticDataOnly === true, "overlay must be synthetic");
assert(Object.keys(overlay.roomsById).length === layoutEditorProofFixture.rooms.length, "overlay should cover layout rooms");
assert(overlay.legend.length > 0, "overlay should expose color legend items");
assert(before === after, "overlay builder must not mutate room geometry");
