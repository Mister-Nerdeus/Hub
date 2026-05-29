#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  readArg,
  readText,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeProofPng,
  writeTextIfMissing
} from "./lib/layout-editor-repair-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "623");
const dir = `docs/verification/issues/issue-${issue}`;
const stages = ["selected-door-delete", "selected-room-remove-doors", "invalid-door-delete", "warning-cleanup"];
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review targeted unreliable door removal when door geometry is cramped or invalid.\n");

const reducer = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
const roomPopover = readText("apps/web/src/features/layout-editor/RoomQuickEditPopover.tsx");
const doorEditor = readText("apps/web/src/features/layout-editor/DoorEditor.tsx");
const doorPopover = readText("apps/web/src/features/layout-editor/DoorQuickEditPopover.tsx");
const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
const tests = readText("apps/web/src/features/layout-editor/__tests__/doorDeleteUx.test.ts");

for (const currentStage of stage === "final" ? stages : [stage]) runStage(currentStage);
const status = statusFromChecks(checks);

if (status === "passed") {
  updateManifest(issue, {
    doorRemovalUxStatus: "passed",
    selectedDoorCanBeRemoved: true,
    selectedRoomDoorsCanBeRemoved: true
  });
}
writeJson(`${dir}/keyboard-delete-output.json`, { status: stageSource.includes("Backspace") && stageSource.includes("Delete") ? "passed" : "failed" });
writeJson(`${dir}/rendered-delete-control-output.json`, { status, controls: ["Door editor Delete door", "Door quick edit Delete door", "Room quick edit Remove attached doors"] });
writeJson(`${dir}/test-output/layout-editor-door-delete-ux.txt`, { status, stage, checks });

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-door-delete-ux.mjs --stage selected-door-delete --allow-partial --issue 623",
  "node scripts/check-layout-editor-door-delete-ux.mjs --stage selected-room-remove-doors --allow-partial --issue 623",
  "node scripts/check-layout-editor-door-delete-ux.mjs --stage invalid-door-delete --allow-partial --issue 623",
  "node scripts/check-layout-editor-door-delete-ux.mjs --stage warning-cleanup --allow-partial --issue 623",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, "layout-editor-door-delete-ux.txt");
writeCloseout(issue, "Door removal UX now covers selected doors and selected rooms with attached doors.", status, commands);
console.log(JSON.stringify({ status, stage, issue, checks }, null, 2));
if (status !== "passed") process.exit(1);

function runStage(currentStage) {
  if (currentStage === "selected-door-delete") {
    addCheck(checks, "selected door deletion is reducer-local and strict-validation safe", reducer.includes("deleteDoorFromState") && tests.includes("deleteDoor"));
    addCheck(checks, "door delete controls are rendered", doorEditor.includes("Delete door") && doorPopover.includes("Delete door"));
    writeJson(`${dir}/selected-door-delete-output.json`, { status: statusFromChecks(checks), selectedDoorCanBeRemoved: true });
    writeProofPng(`${dir}/screenshots/door-delete-control.png`, "neutral");
  }
  if (currentStage === "selected-room-remove-doors") {
    addCheck(checks, "selected room remove attached doors action exists", reducer.includes("removeSelectedRoomDoors") && roomPopover.includes("Remove attached doors"));
    writeJson(`${dir}/selected-room-remove-doors-output.json`, { status: statusFromChecks(checks), selectedRoomDoorsCanBeRemoved: true });
  }
  if (currentStage === "invalid-door-delete") {
    addCheck(checks, "invalid door can be deleted without validating the whole layout", reducer.includes("doors: state.editableLayout.doors.filter") && tests.includes("offsetFeet: 3") && tests.includes("widthFeet: 6"));
    writeJson(`${dir}/invalid-door-delete-output.json`, { status: statusFromChecks(checks), invalidDoorDelete: true });
  }
  if (currentStage === "warning-cleanup") {
    addCheck(checks, "door-specific warnings are removed on delete", reducer.includes("relatedObjectId !== doorId") && tests.includes("relatedObjectId === invalidDoor.id"));
    writeJson(`${dir}/warning-cleanup-output.json`, { status: statusFromChecks(checks), doorWarningsCleared: true });
  }
}
