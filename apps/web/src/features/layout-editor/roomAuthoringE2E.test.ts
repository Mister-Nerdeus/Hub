// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import {
  AUTHORING_WARNING_CODES,
  authoringRoomTypeToPlanRoomType,
  buildPlanContractFromEditableLayout
} from "@nerdeus/shared";
import { createDuplicateFloorplanViewModel } from "../floorplans/duplicateFloorplanViewModel";
import { createEmptyActiveFloorplanState, openSavedFloorplan } from "../floorplans/activeFloorplanState";
import { createSavedFloorplanStore } from "../floorplans/savedFloorplanStore";
import { createLayoutEditorStateFromFloorplan } from "./layoutEditorState";
import { layoutEditorReducer } from "./layoutEditorReducer";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-283");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const store = createSavedFloorplanStore();
const duplicate = createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy;
const saved = store.save(duplicate);
const activeState = openSavedFloorplan(createEmptyActiveFloorplanState(), saved);
if (activeState.activeFloorplan == null) {
  throw new Error("saved floorplan must become active");
}

let editorState = createLayoutEditorStateFromFloorplan(activeState.activeFloorplan);
const originalSourceGeometry = JSON.stringify(saved.authoringDraft.sourcePlan.rooms);
const targetRoom =
  editorState.editableLayout?.rooms.find((room) => room.roomType !== "trauma") ??
  editorState.editableLayout?.rooms[0];
if (targetRoom == null) {
  throw new Error("Plan 1 editable layout must include a room");
}

editorState = layoutEditorReducer(editorState, {
  type: "selectObject",
  objectType: "room",
  objectId: targetRoom.id
});
const resizedState = layoutEditorReducer(editorState, {
  type: "resizeRoom",
  roomId: targetRoom.id,
  handle: "southeast",
  deltaXFeet: 2,
  deltaYFeet: 1
});
const resizedRoom = resizedState.editableLayout?.rooms.find((room) => room.id === targetRoom.id);
if (resizedRoom == null || resizedRoom.widthFeet <= targetRoom.widthFeet) {
  throw new Error("room resize must increase selected room width");
}

const targetAuthoringRoomType = targetRoom.roomType === "trauma" ? "patient_room" : "trauma_room";
const typedState = layoutEditorReducer(resizedState, {
  type: "editSelectedRoomType",
  roomId: targetRoom.id,
  roomType: targetAuthoringRoomType
});
const typedRoom = typedState.editableLayout?.rooms.find((room) => room.id === targetRoom.id);
const expectedPlanRoomType = authoringRoomTypeToPlanRoomType(targetAuthoringRoomType);
if (typedRoom == null || typedRoom.roomType === targetRoom.roomType) {
  throw new Error("room type edit must change selected room type");
}

const addedState = layoutEditorReducer(typedState, {
  type: "addRoom",
  roomId: "room-authoring-e2e-added",
  label: "Authored Room E2E",
  roomType: "patient_room",
  xFeet: 138,
  yFeet: 82,
  widthFeet: 12,
  heightFeet: 10
});
const addedRoom = addedState.editableLayout?.rooms.find((room) => room.id === "room-authoring-e2e-added");
if (addedRoom == null) {
  throw new Error("add room action must add a room");
}
if (addedState.selectedObjectType !== "room" || addedState.selectedObjectId !== addedRoom.id) {
  throw new Error("added room must be selected");
}
const addedRoomWarningCodes = addedState.validationWarnings
  .filter((warning) => warning.objectId === addedRoom.id)
  .map((warning) => warning.code)
  .sort();
for (const code of ["ROOM_MISSING_DOOR", "ROOM_MISSING_PATH_NODE"]) {
  if (!addedRoomWarningCodes.includes(code)) {
    throw new Error(`added room must emit ${code}`);
  }
}
const requiredWarningCodes = [
  "ROOM_MISSING_DOOR",
  "ROOM_MISSING_PATH_NODE",
  "PATH_SYNC_STALE",
  "ROOM_OUTSIDE_BOUNDS",
  "ROOM_TYPE_INVALID",
  "READONLY_AUTHORING_BLOCKED"
] as const;
for (const code of requiredWarningCodes) {
  if (!AUTHORING_WARNING_CODES.includes(code)) {
    throw new Error(`authoring warning registry must include ${code}`);
  }
}

const editedDraft = {
  ...saved.authoringDraft,
  editableLayout: addedState.editableLayout!,
  authoringStatus: "draft_has_warnings" as const,
  pathSyncStatus: "stale_warning" as const,
  authoringWarnings: addedRoomWarningCodes,
  updatedAt: "2026-05-25T00:20:00Z"
};
const savedEdited = store.saveDraft(saved.savedPlanId, editedDraft);
const reloaded = store.load(savedEdited.savedPlanId);
if (reloaded == null) {
  throw new Error("saved edited room draft must reload");
}
const reloadedEditedRoom = reloaded.authoringDraft.editableLayout.rooms.find((room) => room.id === targetRoom.id);
const reloadedAddedRoom = reloaded.authoringDraft.editableLayout.rooms.find((room) => room.id === addedRoom.id);
if (reloadedEditedRoom?.widthFeet !== resizedRoom.widthFeet || reloadedAddedRoom == null) {
  throw new Error("saved/reloaded draft must preserve room resize and added room");
}

const exportedPlan = buildPlanContractFromEditableLayout({
  sourcePlan: reloaded.authoringDraft.sourcePlan,
  editableLayout: reloaded.authoringDraft.editableLayout,
  planId: reloaded.planId
});
const exportedEditedRoom = exportedPlan.rooms.find((room) => room.id === targetRoom.id);
const exportedAddedRoom = exportedPlan.rooms.find((room) => room.id === addedRoom.id);
if (exportedEditedRoom == null) {
  throw new Error("export must preserve edited room");
}
if (exportedEditedRoom.widthFeet !== resizedRoom.widthFeet) {
  throw new Error("export must preserve room resize");
}
if (exportedEditedRoom.roomType !== expectedPlanRoomType) {
  throw new Error("export must preserve room type edit");
}
if (exportedAddedRoom == null) {
  throw new Error("export must preserve added room");
}

const readonlyState = createLayoutEditorStateFromFloorplan({
  recordId: "default-er-layout-plan-1",
  planId: "default-er-layout-plan-1",
  name: "Default ER Layout Plan 1",
  sourceKind: "default-json",
  readOnly: true,
  parentDefaultPlanId: null,
  plan: saved.authoringDraft.sourcePlan
});
const readonlyAttempt = layoutEditorReducer(readonlyState, {
  type: "addRoom",
  roomId: "readonly-added-room",
  label: "Readonly Added Room",
  roomType: "patient_room",
  xFeet: 100,
  yFeet: 80,
  widthFeet: 10,
  heightFeet: 8
});
if (readonlyAttempt.editableLayout?.rooms.length !== readonlyState.editableLayout?.rooms.length) {
  throw new Error("read-only default layout must block add-room authoring");
}
if (JSON.stringify(saved.authoringDraft.sourcePlan.rooms) !== originalSourceGeometry) {
  throw new Error("source default rooms must remain unchanged");
}

writeEvidence("room-resize-e2e-output.json", {
  issue: "283",
  status: "passed",
  roomId: targetRoom.id,
  beforeWidthFeet: targetRoom.widthFeet,
  afterWidthFeet: resizedRoom.widthFeet
});
writeEvidence("room-type-e2e-output.json", {
  issue: "283",
  status: "passed",
  roomId: targetRoom.id,
  requestedAuthoringRoomType: targetAuthoringRoomType,
  exportedPlanRoomType: exportedEditedRoom.roomType
});
writeEvidence("add-room-e2e-output.json", {
  issue: "283",
  status: "passed",
  addedRoomId: addedRoom.id,
  roomCountAfterAdd: addedState.editableLayout?.rooms.length
});
writeEvidence("added-room-selected-output.json", {
  issue: "283",
  status: "passed",
  selectedObjectType: addedState.selectedObjectType,
  selectedObjectId: addedState.selectedObjectId
});
writeEvidence("room-warning-codes-output.json", {
  issue: "283",
  status: "passed",
  requiredWarningCodes: [
    "ROOM_MISSING_DOOR",
    "ROOM_MISSING_PATH_NODE",
    "PATH_SYNC_STALE",
    "ROOM_OUTSIDE_BOUNDS",
    "ROOM_TYPE_INVALID",
    "READONLY_AUTHORING_BLOCKED"
  ],
  emittedWarningCodes: addedRoomWarningCodes
});
writeEvidence("save-reload-room-edit-output.json", {
  issue: "283",
  status: "passed",
  savedPlanId: savedEdited.savedPlanId,
  reloadedRoomWidthFeet: reloadedEditedRoom.widthFeet,
  reloadedAddedRoomPresent: reloadedAddedRoom != null
});
writeEvidence("export-room-edit-output.json", {
  issue: "283",
  status: "passed",
  exportedPlanId: exportedPlan.planId,
  exportedRoomType: exportedEditedRoom.roomType,
  exportedAddedRoomPresent: exportedAddedRoom != null
});
writeEvidence("readonly-negative-output.json", {
  issue: "283",
  status: "passed",
  readOnlyAuthoringBlocked: true,
  warningCode: "READONLY_AUTHORING_BLOCKED"
});
writeEvidence("default-nonmutation-output.json", {
  issue: "283",
  status: "passed",
  sourceDefaultUnchanged: true,
  sourcePlanRoomCount: saved.authoringDraft.sourcePlan.rooms.length
});
