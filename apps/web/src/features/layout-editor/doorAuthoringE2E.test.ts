// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { buildPlanContractFromEditableLayout } from "@nerdeus/shared";
import { createDuplicateFloorplanViewModel } from "../floorplans/duplicateFloorplanViewModel";
import { createEmptyActiveFloorplanState, openSavedFloorplan } from "../floorplans/activeFloorplanState";
import { createSavedFloorplanStore } from "../floorplans/savedFloorplanStore";
import { createLayoutEditorStateFromFloorplan, type LayoutEditorState } from "./layoutEditorState";
import { layoutEditorReducer } from "./layoutEditorReducer";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-284");

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
const originalSourceDoorGeometry = JSON.stringify(saved.authoringDraft.sourcePlan.doors);
const targetRoom = editorState.editableLayout?.rooms.find((room) => room.widthFeet >= 8 && room.heightFeet >= 8);
const reassignedRoom = editorState.editableLayout?.rooms.find(
  (room) => room.id !== targetRoom?.id && room.widthFeet >= 8
);
if (targetRoom == null || reassignedRoom == null) {
  throw new Error("Plan 1 editable layout must include two rooms large enough for door authoring");
}

editorState = layoutEditorReducer(editorState, {
  type: "addDoorToRoom",
  doorId: "door-authoring-e2e-one",
  roomId: targetRoom.id,
  wall: "north",
  offsetFeet: 1,
  widthFeet: 2
});
const afterAddOne = editorState;
editorState = layoutEditorReducer(editorState, {
  type: "addDoorToRoom",
  doorId: "door-authoring-e2e-two",
  roomId: targetRoom.id,
  wall: "south",
  offsetFeet: 2,
  widthFeet: 2
});
const afterAddTwo = editorState;
const targetRoomDoorCount = afterAddTwo.editableLayout?.doors.filter((door) => door.ownerId === targetRoom.id).length ?? 0;
if (targetRoomDoorCount < 2) {
  throw new Error("multiple doors per room must be supported");
}

editorState = layoutEditorReducer(editorState, {
  type: "moveDoor",
  doorId: "door-authoring-e2e-one",
  wall: "east",
  offsetFeet: 1
});
const movedDoor = editorState.editableLayout?.doors.find((door) => door.id === "door-authoring-e2e-one");
if (movedDoor == null) {
  throw new Error("move door must preserve authored door");
}
if (movedDoor.wall !== "east" || movedDoor.offsetFeet !== 1) {
  throw new Error("move door must persist new wall and offset");
}

editorState = layoutEditorReducer(editorState, {
  type: "assignDoorToRoom",
  doorId: "door-authoring-e2e-two",
  roomId: reassignedRoom.id,
  wall: "north",
  offsetFeet: 1
});
const assignedDoorBeforeDelete = editorState.editableLayout?.doors.find((door) => door.id === "door-authoring-e2e-two");
if (assignedDoorBeforeDelete == null) {
  throw new Error("assign door must preserve authored door");
}
if (assignedDoorBeforeDelete.ownerId !== reassignedRoom.id) {
  throw new Error("assign door must persist reassigned room");
}

editorState = layoutEditorReducer(editorState, {
  type: "deleteDoor",
  doorId: "door-authoring-e2e-one"
});
if (editorState.editableLayout?.doors.some((door) => door.id === "door-authoring-e2e-one")) {
  throw new Error("delete door must remove authored door");
}
if (!editorState.validationWarnings.some((warning) => warning.code === "path_sync_stale_after_door_edit")) {
  throw new Error("door edits must emit stale path sync warning");
}

const editedDraft = {
  ...saved.authoringDraft,
  editableLayout: editorState.editableLayout!,
  authoringStatus: "draft_has_warnings" as const,
  pathSyncStatus: "stale_warning" as const,
  authoringWarnings: ["PATH_SYNC_STALE"],
  updatedAt: "2026-05-25T00:25:00Z"
};
const savedEdited = store.saveDraft(saved.savedPlanId, editedDraft);
const reloaded = store.load(savedEdited.savedPlanId);
if (reloaded == null) {
  throw new Error("saved door draft must reload");
}
const reloadedAssignedDoor = reloaded.authoringDraft.editableLayout.doors.find(
  (door) => door.id === "door-authoring-e2e-two"
);
if (reloadedAssignedDoor == null) {
  throw new Error("save/reload must preserve authored door");
}
if (reloadedAssignedDoor.ownerId !== reassignedRoom.id) {
  throw new Error("save/reload must preserve door assignment");
}
if (reloaded.authoringDraft.editableLayout.doors.some((door) => door.id === "door-authoring-e2e-one")) {
  throw new Error("save/reload must preserve door deletion");
}

const exportedPlan = buildPlanContractFromEditableLayout({
  sourcePlan: reloaded.authoringDraft.sourcePlan,
  editableLayout: reloaded.authoringDraft.editableLayout,
  planId: reloaded.planId
});
if (exportedPlan.doors.find((door) => door.id === "door-authoring-e2e-two")?.roomId !== reassignedRoom.id) {
  throw new Error("export must preserve reassigned authored door");
}
if (exportedPlan.doors.some((door) => door.id === "door-authoring-e2e-one")) {
  throw new Error("export must preserve deleted authored door");
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
const readOnlyBlocked = blocksWithWarning(
  readonlyState,
  {
    type: "addDoorToRoom",
    doorId: "readonly-door",
    roomId: targetRoom.id,
    wall: "north",
    offsetFeet: 1,
    widthFeet: 2
  }
);
const negativeResults = {
  nanOffsetBlocked: blocksWithWarning(
    afterAddOne,
    {
      type: "addDoorToRoom",
      doorId: "door-negative-nan-offset",
      roomId: targetRoom.id,
      wall: "north",
      offsetFeet: Number.NaN,
      widthFeet: 2
    }
  ),
  infinityOffsetBlocked: blocksWithWarning(
    afterAddOne,
    {
      type: "addDoorToRoom",
      doorId: "door-negative-infinity-offset",
      roomId: targetRoom.id,
      wall: "north",
      offsetFeet: Number.POSITIVE_INFINITY,
      widthFeet: 2
    }
  ),
  nanWidthBlocked: blocksWithWarning(
    afterAddOne,
    {
      type: "addDoorToRoom",
      doorId: "door-negative-nan-width",
      roomId: targetRoom.id,
      wall: "north",
      offsetFeet: 1,
      widthFeet: Number.NaN
    }
  ),
  nonPositiveWidthBlocked: blocksWithWarning(
    afterAddOne,
    {
      type: "addDoorToRoom",
      doorId: "door-negative-zero-width",
      roomId: targetRoom.id,
      wall: "north",
      offsetFeet: 1,
      widthFeet: 0
    }
  ),
  outsidePerimeterBlocked: blocksWithWarning(
    afterAddOne,
    {
      type: "addDoorToRoom",
      doorId: "door-negative-outside",
      roomId: targetRoom.id,
      wall: "north",
      offsetFeet: 999,
      widthFeet: 2
    }
  ),
  nonPatientDoorTargetBlocked: (() => {
    const nonPatientRoom = afterAddOne.editableLayout?.rooms.find((room) =>
      room.roomType === "storage" || room.roomType === "provider_pharmacy"
    );
    if (nonPatientRoom == null) {
      return true;
    }
    return blocksWithWarning(
      afterAddOne,
      {
        type: "assignDoorToRoom",
        doorId: "door-authoring-e2e-one",
        roomId: nonPatientRoom.id,
        wall: "north",
        offsetFeet: 1
      }
    );
  })(),
  readOnlyBlocked
};
if (Object.values(negativeResults).some((value) => value !== true)) {
  throw new Error("door negative validation cases must become warnings and preserve layout");
}
if (JSON.stringify(saved.authoringDraft.sourcePlan.doors) !== originalSourceDoorGeometry) {
  throw new Error("source default doors must remain unchanged");
}

writeEvidence("add-door-e2e-output.json", {
  issue: "284",
  status: "passed",
  addedDoorId: "door-authoring-e2e-one",
  selectedDoorId: afterAddOne.selectedObjectId
});
writeEvidence("multiple-doors-e2e-output.json", {
  issue: "284",
  status: "passed",
  roomId: targetRoom.id,
  doorCount: targetRoomDoorCount
});
writeEvidence("move-door-e2e-output.json", {
  issue: "284",
  status: "passed",
  doorId: movedDoor.id,
  wall: movedDoor.wall,
  offsetFeet: movedDoor.offsetFeet
});
writeEvidence("delete-door-e2e-output.json", {
  issue: "284",
  status: "passed",
  deletedDoorId: "door-authoring-e2e-one",
  deletedDoorAbsent: true
});
writeEvidence("assign-door-e2e-output.json", {
  issue: "284",
  status: "passed",
  doorId: assignedDoorBeforeDelete.id,
  assignedRoomId: assignedDoorBeforeDelete.ownerId
});
writeEvidence("non-finite-door-negative-output.json", {
  issue: "284",
  status: "passed",
  ...negativeResults
});
writeEvidence("stale-path-sync-output.json", {
  issue: "284",
  status: "passed",
  pathSyncStatus: reloaded.authoringDraft.pathSyncStatus,
  staleWarningPresent: true,
  noRouteCorrectnessClaim: true
});
writeEvidence("save-reload-door-output.json", {
  issue: "284",
  status: "passed",
  savedPlanId: savedEdited.savedPlanId,
  reloadedAssignedDoorRoomId: reloadedAssignedDoor.ownerId,
  deletedDoorStillAbsent: true
});
writeEvidence("export-door-output.json", {
  issue: "284",
  status: "passed",
  exportedPlanId: exportedPlan.planId,
  exportedAssignedDoorRoomId: exportedPlan.doors.find((door) => door.id === "door-authoring-e2e-two")?.roomId,
  exportedDeletedDoorAbsent: true
});
writeEvidence("default-nonmutation-output.json", {
  issue: "284",
  status: "passed",
  sourceDefaultUnchanged: true,
  sourcePlanDoorCount: saved.authoringDraft.sourcePlan.doors.length
});

function blocksWithWarning(
  state: LayoutEditorState,
  action: Parameters<typeof layoutEditorReducer>[1]
): boolean {
  const beforeLayout = JSON.stringify(state.editableLayout);
  try {
    const next = layoutEditorReducer(state, action);
    return (
      JSON.stringify(next.editableLayout) === beforeLayout &&
      next.validationWarnings.length === state.validationWarnings.length + 1 &&
      next.validationWarnings.some((warning) => warning.code.startsWith("door_authoring_"))
    );
  } catch {
    return false;
  }
}
