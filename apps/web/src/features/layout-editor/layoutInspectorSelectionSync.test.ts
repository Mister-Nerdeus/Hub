import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer } from "./layoutEditorReducer";
import { createLayoutEditorState } from "./layoutEditorState";
import { buildLayoutInspectorViewModel } from "./layoutInspectorViewModel";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  }
};

const baseState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: "room-01"
});
const snapshot = JSON.stringify(baseState.editableLayout);
const selectedStationState = layoutEditorReducer(baseState, {
  type: "selectObject",
  objectType: "station",
  objectId: "station-primary"
});
const inspector = buildLayoutInspectorViewModel({
  layout: selectedStationState.editableLayout,
  selectedObjectType: selectedStationState.selectedObjectType,
  selectedObjectId: selectedStationState.selectedObjectId
});

assert.equal(selectedStationState.selectedObjectType, "station");
assert.equal(selectedStationState.selectedObjectId, "station-primary");
assert.equal(inspector.status, "selected");
assert.equal(inspector.objectType, "station");
assert.equal(inspector.objectId, "station-primary");
assert.equal(inspector.title, "Primary nurse station");
assert.equal(JSON.stringify(baseState.editableLayout), snapshot);
