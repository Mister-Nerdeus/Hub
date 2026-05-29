import { layoutEditorProofFixture } from "../../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer } from "../layoutEditorReducer";
import { createLayoutEditorState } from "../layoutEditorState";

const stationState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "station",
  selectedObjectId: "station-primary"
});
const editedStation = layoutEditorReducer(stationState, {
  type: "editSelectedStation",
  stationId: "station-primary",
  label: "Station Core",
  stationType: "desk"
});
const station = editedStation.editableLayout?.stations.find((candidate) => candidate.id === "station-primary");
if (station?.label !== "Station Core" || station.stationType !== "desk") {
  throw new Error("station quick edit reducer must update label and type");
}
if (!editedStation.isDirty || editedStation.history.past.length !== 1) {
  throw new Error("station quick edit must mark dirty and support undo");
}
if (
  layoutEditorReducer(editedStation, { type: "undoLayoutEdit" }).editableLayout?.stations.find(
    (candidate) => candidate.id === "station-primary"
  )?.stationType !== "nurse_station"
) {
  throw new Error("station quick edit undo must restore station type");
}

const movedStation = layoutEditorReducer(stationState, {
  type: "moveStation",
  stationId: "station-primary",
  deltaXFeet: 2,
  deltaYFeet: 1
});
const movedStationGeometry = movedStation.editableLayout?.stations.find(
  (candidate) => candidate.id === "station-primary"
);
if (
  movedStationGeometry?.xFeet !==
    (stationState.editableLayout?.stations.find((candidate) => candidate.id === "station-primary")?.xFeet ?? 0) + 2 ||
  movedStationGeometry.yFeet !==
    (stationState.editableLayout?.stations.find((candidate) => candidate.id === "station-primary")?.yFeet ?? 0) + 1
) {
  throw new Error("station move reducer must update station geometry");
}
if (movedStation.selectedObjectType !== "station" || movedStation.selectedObjectId !== "station-primary") {
  throw new Error("station move reducer must keep the moved station selected");
}
if (!movedStation.isDirty || movedStation.history.past.length !== 1) {
  throw new Error("station move must mark dirty and support undo");
}
if (movedStation.editAuditTrail.at(-1)?.editType !== "station_moved") {
  throw new Error("station move must write a station_moved audit entry");
}
const undoneStationMove = layoutEditorReducer(movedStation, { type: "undoLayoutEdit" });
if (
  undoneStationMove.editableLayout?.stations.find((candidate) => candidate.id === "station-primary")?.xFeet !==
  stationState.editableLayout?.stations.find((candidate) => candidate.id === "station-primary")?.xFeet
) {
  throw new Error("station move undo must restore station geometry");
}

const hallwayState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "hallway",
  selectedObjectId: "hall-main"
});
const editedHallway = layoutEditorReducer(hallwayState, {
  type: "editSelectedHallwayLabel",
  hallwayId: "hall-main",
  label: "Main Operational Hall"
});
if (editedHallway.editableLayout?.hallways.find((hallway) => hallway.id === "hall-main")?.label !== "Main Operational Hall") {
  throw new Error("hallway quick edit reducer must update label");
}

const zoneState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "zone",
  selectedObjectId: "zone-entry"
});
const editedZone = layoutEditorReducer(zoneState, {
  type: "editSelectedZone",
  zoneId: "zone-entry",
  label: "Entry Support",
  zoneType: "provider_pharmacy"
});
const zone = editedZone.editableLayout?.zones.find((candidate) => candidate.id === "zone-entry");
if (zone?.label !== "Entry Support" || zone.zoneType !== "provider_pharmacy") {
  throw new Error("zone quick edit reducer must update label and type");
}

const readOnlyState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  readOnly: true,
  selectedObjectType: "zone",
  selectedObjectId: "zone-entry"
});
if (
  layoutEditorReducer(readOnlyState, {
    type: "editSelectedZone",
    zoneId: "zone-entry",
    label: "Blocked"
  }) !== readOnlyState
) {
  throw new Error("quick edit reducer updates must be blocked on read-only layouts");
}

const readOnlyStationState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  readOnly: true,
  selectedObjectType: "station",
  selectedObjectId: "station-primary"
});
if (
  layoutEditorReducer(readOnlyStationState, {
    type: "moveStation",
    stationId: "station-primary",
    deltaXFeet: 4,
    deltaYFeet: 0
  }) !== readOnlyStationState
) {
  throw new Error("station move must be blocked on read-only layouts");
}

const deleteRoomState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: "room-01"
});
const deletedRoomState = layoutEditorReducer(deleteRoomState, { type: "deleteSelectedRoom" });
if (deletedRoomState.editableLayout?.rooms.some((room) => room.id === "room-01")) {
  throw new Error("room quick edit delete must remove the selected room");
}
if (deletedRoomState.editableLayout?.doors.some((door) => door.ownerId === "room-01")) {
  throw new Error("room quick edit delete must remove doors owned by the deleted room");
}
if (deletedRoomState.selectedObjectId !== null || deletedRoomState.selectedObjectType !== null) {
  throw new Error("room quick edit delete must clear selection");
}
if (!deletedRoomState.isDirty || deletedRoomState.history.past.length !== 1) {
  throw new Error("room quick edit delete must mark dirty and support undo");
}
const restoredRoomState = layoutEditorReducer(deletedRoomState, { type: "undoLayoutEdit" });
if (!restoredRoomState.editableLayout?.rooms.some((room) => room.id === "room-01")) {
  throw new Error("room quick edit delete undo must restore the room");
}
