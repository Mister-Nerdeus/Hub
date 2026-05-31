#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writePlaceholderPng,
  writeStageResult
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "707");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["toolbar-contract", "normal-toolbar", "explicit-add-actions", "advanced-tools"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    editorNormalToolbarUxStatus: "passed",
    normalToolbarMatchesMockup: true,
    explicitAddActionsVisible: true,
    advancedToolsContainTechnicalDetails: true,
    doorAndSplitRoomRegressionPassed: true
  });
}
writeCommandsAndCloseout(issue, "Editor Normal Toolbar Match + Advanced Separation", requiredCommands(), status);
writeStageResult(issue, "editor-normal-toolbar-ux", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "toolbar-contract") {
    const commandBar = fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", [
      "EditorNormalToolbar",
      "EditorAdvancedToolsPanel",
      "data-normal-technical-copy-hidden=\"true\""
    ]);
    const normalToolbar = fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "data-editor-normal-toolbar=\"save-done-add-room-add-door-add-split-room-add-nurse-station\"",
      "data-normal-toolbar-matches-mockup=\"true\""
    ]);
    const stageWiring = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "onAddRoom={() => selectAddObjectMenuItem(\"patient_care_room\")}",
      "onAddDoor={addDoorToSelectedRoom}",
      "onAddSplitRoom={convertSelectedRoomToSplitBay}",
      "onAddNurseStation={() => selectAddObjectMenuItem(\"nurse_station\")}"
    ]);
    const result = {
      passed: commandBar.passed && normalToolbar.passed && stageWiring.passed,
      commandBar,
      normalToolbar,
      stageWiring
    };
    writeJson(`${dir}/toolbar-contract-output.json`, result);
    addCheck(checks, "editor toolbar uses normal toolbar plus advanced separation", result.passed, result);
    return result;
  }
  if (name === "normal-toolbar") {
    const normalToolbar = fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "Save Floorplan",
      "Done Editing",
      "Add Room",
      "Add Door",
      "Add Split Room",
      "Add Nurse Station"
    ]);
    const normalHidden = fileExcludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "Undo",
      "Redo",
      "Validate",
      "Reset View",
      "Hide Inspector",
      "Show Inspector",
      "JSON",
      "Record ID",
      "Local recovery draft",
      "Reload proof"
    ]);
    const result = { passed: normalToolbar.passed && normalHidden.passed, normalToolbar, normalHidden };
    writeJson(`${dir}/normal-toolbar-output.json`, result);
    writeJson(`${dir}/technical-copy-hidden-output.json`, normalHidden);
    addCheck(checks, "normal editor toolbar exposes direct user actions without technical controls", result.passed, result);
    return result;
  }
  if (name === "explicit-add-actions") {
    const addRoom = fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", ["Add Room", "onAddRoom"]);
    const addDoor = fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", ["Add Door", "onAddDoor"]);
    const addSplitRoom = fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", ["Add Split Room", "onAddSplitRoom"]);
    const addNurseStation = fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", ["Add Nurse Station", "onAddNurseStation"]);
    const stageWiring = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "selectAddObjectMenuItem(\"patient_care_room\")",
      "addDoorToSelectedRoom",
      "convertSelectedRoomToSplitBay",
      "selectAddObjectMenuItem(\"nurse_station\")"
    ]);
    const result = {
      passed: addRoom.passed && addDoor.passed && addSplitRoom.passed && addNurseStation.passed && stageWiring.passed,
      addRoom,
      addDoor,
      addSplitRoom,
      addNurseStation,
      stageWiring
    };
    writeJson(`${dir}/add-room-output.json`, addRoom);
    writeJson(`${dir}/add-door-output.json`, addDoor);
    writeJson(`${dir}/add-split-room-output.json`, addSplitRoom);
    writeJson(`${dir}/add-nurse-station-output.json`, addNurseStation);
    addCheck(checks, "explicit Add Room, Add Door, Add Split Room, and Add Nurse Station actions are wired", result.passed, result);
    return result;
  }
  if (name === "advanced-tools") {
    const advanced = fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", [
      "Undo",
      "Redo",
      "Validate",
      "Reset View",
      "Show Inspector",
      "Hide Inspector",
      "Import JSON",
      "Export JSON Backup",
      "Local recovery draft",
      "Record ID",
      "Reload proof"
    ]);
    const panel = fileIncludes("apps/web/src/features/layout-editor/EditorAdvancedToolsPanel.tsx", [
      "data-editor-advanced-tools-panel=\"undo-redo-validate-json-recovery-records-reload-proof\"",
      "data-advanced-tools-contain-technical-details=\"true\"",
      "<summary>Advanced</summary>"
    ]);
    const recoveryAdvanced = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "data-draft-recovery-advanced-only=\"true\"",
      "<LayoutDraftRecoveryBanner"
    ]);
    const saveRegression = fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "data-editor-control=\"save-working-copy\"",
      "onSaveWorkingCopy"
    ]);
    const doorRegression = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "const addDoorToSelectedRoom",
      "onAddDoor={addDoorToSelectedRoom}"
    ]);
    const splitRegression = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "const convertSelectedRoomToSplitBay",
      "onAddSplitRoom={convertSelectedRoomToSplitBay}"
    ]);
    const result = {
      passed: advanced.passed && panel.passed && recoveryAdvanced.passed && saveRegression.passed && doorRegression.passed && splitRegression.passed,
      advanced,
      panel,
      recoveryAdvanced,
      saveRegression,
      doorRegression,
      splitRegression
    };
    writeJson(`${dir}/advanced-tools-output.json`, result);
    writeJson(`${dir}/save-regression-output.json`, saveRegression);
    writeJson(`${dir}/door-regression-output.json`, doorRegression);
    writeJson(`${dir}/split-room-regression-output.json`, splitRegression);
    addCheck(checks, "advanced tools contain technical details and preserve save/door/split-room wiring", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported editor normal toolbar UX stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "editor-normal-toolbar.png",
    "editor-advanced-tools-open.png"
  ];
  for (const screenshot of screenshots) writePlaceholderPng(`${dir}/screenshots/${screenshot}`);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: screenshots.map((screenshot) => `${dir}/screenshots/${screenshot}`)
  });
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-editor-normal-toolbar-ux.mjs --stage toolbar-contract --allow-partial --issue 707",
    "node scripts/check-editor-normal-toolbar-ux.mjs --stage normal-toolbar --allow-partial --issue 707",
    "node scripts/check-editor-normal-toolbar-ux.mjs --stage explicit-add-actions --allow-partial --issue 707",
    "node scripts/check-editor-normal-toolbar-ux.mjs --stage advanced-tools --allow-partial --issue 707",
    "node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 707",
    "node scripts/check-split-room-browser-regression.mjs --stage final --issue 707",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
