import { layoutEditorProofFixture } from "../../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer } from "../layoutEditorReducer";
import { createLayoutEditorState } from "../layoutEditorState";

const sourceSnapshot = JSON.stringify(layoutEditorProofFixture);
const selectedRoomState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: "room-01"
});

const duplicatedRoomState = layoutEditorReducer(selectedRoomState, {
  type: "duplicateSelectedObject"
});
if (duplicatedRoomState.selectedObjectType !== "room" || duplicatedRoomState.selectedObjectId !== "room-01-copy") {
  throw new Error("duplicating a selected room should select the duplicate");
}
if (duplicatedRoomState.editableLayout?.rooms.length !== layoutEditorProofFixture.rooms.length + 1) {
  throw new Error("room duplication should add one room");
}
if (!duplicatedRoomState.isDirty) {
  throw new Error("duplication should mark the editor dirty for future save/autosave hooks");
}
if (duplicatedRoomState.history.past.length !== 1) {
  throw new Error("duplication should push an undo history entry");
}

const undoneRoomState = layoutEditorReducer(duplicatedRoomState, { type: "undoLayoutEdit" });
if (undoneRoomState.editableLayout?.rooms.length !== layoutEditorProofFixture.rooms.length) {
  throw new Error("undo should remove the duplicated room");
}
const redoneRoomState = layoutEditorReducer(undoneRoomState, { type: "redoLayoutEdit" });
if (!redoneRoomState.editableLayout?.rooms.some((room) => room.id === "room-01-copy")) {
  throw new Error("redo should restore the duplicated room");
}

const duplicatedStationState = layoutEditorReducer(
  createLayoutEditorState({
    editableLayout: layoutEditorProofFixture,
    selectedObjectType: "station",
    selectedObjectId: "station-primary"
  }),
  { type: "duplicateSelectedObject" }
);
if (!duplicatedStationState.editableLayout?.stations.some((station) => station.id === "station-primary-copy")) {
  throw new Error("station duplication should create a unique station copy");
}

const duplicatedZoneState = layoutEditorReducer(
  createLayoutEditorState({
    editableLayout: layoutEditorProofFixture,
    selectedObjectType: "zone",
    selectedObjectId: "zone-entry"
  }),
  { type: "duplicateSelectedObject" }
);
if (!duplicatedZoneState.editableLayout?.zones.some((zone) => zone.id === "zone-entry-copy")) {
  throw new Error("zone duplication should create a unique zone copy");
}

const readOnlyState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  readOnly: true,
  selectedObjectType: "room",
  selectedObjectId: "room-01"
});
if (layoutEditorReducer(readOnlyState, { type: "duplicateSelectedObject" }) !== readOnlyState) {
  throw new Error("read-only layout duplication should be blocked");
}

if (JSON.stringify(layoutEditorProofFixture) !== sourceSnapshot) {
  throw new Error("duplication UI reducer test must not mutate the source fixture");
}
