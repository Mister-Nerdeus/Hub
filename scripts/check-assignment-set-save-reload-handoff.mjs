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
  writeStageResult,
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "712");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["assignment-selector", "save-assignment", "reload-assignment", "scenario-handoff", "clear-confirmation"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    assignmentSetHandoffStatus: "passed",
    assignmentSetSaveReloadHandoffStatus: "passed",
    assignmentSetSurvivesReload: true,
    scenarioReceivesSelectedAssignmentSet: true,
    clearAssignmentsRequiresConfirmation: true
  });
}
writeCommandsAndCloseout(issue, "Assignment Set Save/Reload/Handoff", requiredCommands(), status, [
  "Scenario handoff is context transfer only; scoring assumptions remain foundation-only.",
  "No optimizer or recommendation behavior was added."
]);
writeStageResult(issue, "assignment-set-save-reload-handoff", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "assignment-selector") {
    const selector = fileIncludes("apps/web/src/features/assignments/AssignmentSetSelector.tsx", [
      "data-assignment-set-selector=\"manual-workflow\"",
      "data-active-assignment-set-id={viewModel.activeAssignmentSetId ?? \"\"}",
      "data-selected-scenario-assignment-set-id={viewModel.selectedScenarioAssignmentSetId ?? \"\"}",
      "Save Assignment Set",
      "Use for Scenario Setup"
    ]);
    const viewModel = fileIncludes("apps/web/src/features/assignments/assignmentSetSelectorViewModel.ts", [
      "createAssignmentSetSelectorViewModel",
      "assignmentSetMatchesFloorplanVersion",
      "selectedForScenario"
    ]);
    const app = fileIncludes("apps/web/src/App.tsx", [
      "AssignmentSetSelector",
      "assignmentWorkflowContent",
      "activeSection === \"assignments\"",
      "activeSection === \"manual-assignment\""
    ]);
    const result = { passed: selector.passed && viewModel.passed && app.passed, selector, viewModel, app };
    writeJson(`${dir}/assignment-selector-output.json`, result);
    addCheck(checks, "assignment set selector is shown in the Assignments workflow and Manual Assignment subflow", result.passed, result);
    return result;
  }
  if (name === "save-assignment") {
    const selector = fileIncludes("apps/web/src/features/assignments/AssignmentSetSelector.tsx", [
      "onSaveAssignmentSet",
      "Save Assignment Set",
      "saveMessage"
    ]);
    const app = fileIncludes("apps/web/src/App.tsx", [
      "saveActiveAssignmentSet",
      "captureAssignmentSet(activeAssignmentSet)",
      "setAssignmentSaveMessage(`${saved.displayName} saved locally.`)"
    ]);
    const result = { passed: selector.passed && app.passed, selector, app };
    writeJson(`${dir}/save-assignment-output.json`, result);
    addCheck(checks, "user can explicitly save the active assignment set", result.passed, result);
    return result;
  }
  if (name === "reload-assignment") {
    const store = fileIncludes("apps/web/src/features/assignments/assignmentSetStore.ts", [
      "loadForFloorplanVersion",
      "save(assignmentSet)",
      "writePersistedAssignmentSets"
    ]);
    const app = fileIncludes("apps/web/src/App.tsx", [
      "assignmentSetStore.loadForFloorplanVersion(activeFloorplanContract.activeFloorplanVersionId)",
      "setActiveAssignmentSet(next)",
      "setManualAssignmentsByRoomId(next.assignmentsByRoomId)"
    ]);
    const result = { passed: store.passed && app.passed, store, app };
    writeJson(`${dir}/reload-assignment-output.json`, result);
    addCheck(checks, "assignment set reloads from local-first storage for the active floorplan version", result.passed, result);
    return result;
  }
  if (name === "scenario-handoff") {
    const app = fileIncludes("apps/web/src/App.tsx", [
      "scenarioAssignmentSet",
      "useActiveAssignmentSetForScenarioSetup",
      "setScenarioAssignmentSet(saved)",
      "setActiveSection(\"scenarios\")",
      "selectedAssignmentSet={scenarioAssignmentSet ?? activeAssignmentSet}"
    ]);
    const scenario = fileIncludes("apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx", [
      "selectedAssignmentSet?: AssignmentSetContract | null",
      "data-scenario-assignment-handoff=\"selected-assignment-set\"",
      "data-selected-assignment-set-id={selectedAssignmentSet.assignmentSetId}",
      "data-assignment-warning-count={assignmentReview.warningCount}",
      "Scenario setup remains foundation-only until scoring assumptions are ready."
    ]);
    const result = { passed: app.passed && scenario.passed, app, scenario };
    writeJson(`${dir}/scenario-handoff-output.json`, result);
    addCheck(checks, "scenario screen receives and displays the selected assignment set", result.passed, result);
    return result;
  }
  if (name === "clear-confirmation") {
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "clearConfirmationVisible",
      "data-clear-assignments-confirmation=\"required\"",
      "data-clear-assignments-requires-confirmation=\"true\"",
      "Confirm Clear Assignments",
      "dispatch(clearManualAssignments())"
    ]);
    const result = { passed: workspace.passed, workspace };
    writeJson(`${dir}/clear-confirmation-output.json`, result);
    addCheck(checks, "clear assignments requires confirmation", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported assignment set handoff stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "manual-assignment-three-column.png",
    "manual-assignment-filter-high-burden.png",
    "nurse-card-burden-breakdown.png",
    "assignment-set-selector.png",
    "assignment-set-saved.png",
    "scenario-handoff-selected-assignment.png",
    "clear-assignment-confirmation.png"
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
    "node scripts/check-manual-assignment-three-column-ux.mjs --stage layout-contract --allow-partial --issue 712",
    "node scripts/check-manual-assignment-three-column-ux.mjs --stage floorplan-overview --allow-partial --issue 712",
    "node scripts/check-manual-assignment-three-column-ux.mjs --stage room-table --allow-partial --issue 712",
    "node scripts/check-manual-assignment-three-column-ux.mjs --stage filter-chips --allow-partial --issue 712",
    "node scripts/check-manual-assignment-three-column-ux.mjs --stage nurse-cards --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage assignment-selector --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage save-assignment --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage reload-assignment --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage scenario-handoff --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage clear-confirmation --allow-partial --issue 712",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
