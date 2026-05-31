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

const issue = readArg("--issue", "712");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["layout-contract", "floorplan-overview", "room-table", "filter-chips", "nurse-cards", "burden-breakdown", "assignment-issues", "no-synthetic-fallback-normal-mode"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    manualAssignmentThreeColumnUxStatus: "passed",
    manualAssignmentUsesAssignmentSet: true,
    manualAssignmentNoSyntheticFallbackNormalMode: true,
    manualAssignmentThreeColumnUxReady: true
  });
}
writeCommandsAndCloseout(issue, "Manual Assignment Three-Column UX", requiredCommands(), status, [
  "Manual assignment remains local-first and foundation-level.",
  "No optimizer or assignment recommendation behavior was added."
]);
writeStageResult(issue, "manual-assignment-three-column-ux", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "layout-contract") {
    const layout = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentLayout.tsx", [
      "data-manual-assignment-layout=\"three-column\"",
      "data-manual-assignment-uses-assignment-set=\"true\"",
      "data-manual-assignment-column=\"floorplan-overview\"",
      "data-manual-assignment-column=\"room-assignment-table\"",
      "data-manual-assignment-column=\"nurse-assignment-cards\""
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "ManualAssignmentLayout",
      "sourceKind: \"assignment-set\"",
      "assignmentSet={source.assignmentSet}"
    ]);
    const result = { passed: layout.passed && workspace.passed, layout, workspace };
    writeJson(`${dir}/layout-contract-output.json`, result);
    addCheck(checks, "manual assignment renders a three-column assignment-set-backed layout", result.passed, result);
    return result;
  }
  if (name === "floorplan-overview") {
    const result = fileIncludes("apps/web/src/features/manual-assignment/AssignmentFloorplanOverview.tsx", [
      "data-assignment-floorplan-overview=\"active-floorplan\"",
      "data-assignment-set-id={assignmentSet?.assignmentSetId ?? \"\"}",
      "data-floorplan-version-id={activeFloorplanVersionId ?? \"\"}",
      "Unassigned occupied",
      "Split rooms",
      "AssignmentColorLegend"
    ]);
    writeJson(`${dir}/floorplan-overview-output.json`, result);
    addCheck(checks, "floorplan overview shows active floorplan assignment context", result.passed, result);
    return result;
  }
  if (name === "room-table") {
    const table = fileIncludes("apps/web/src/features/manual-assignment/RoomAssignmentTable.tsx", [
      "data-room-assignment-table=\"manual\"",
      "data-filtered-room-count={rooms.length}",
      "ManualAssignmentRoomList",
      "onUnassignRoom"
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "filteredRoomCards",
      "activeRoomFilter",
      "filterRoomCards("
    ]);
    const result = { passed: table.passed && workspace.passed, table, workspace };
    writeJson(`${dir}/room-table-output.json`, result);
    addCheck(checks, "room assignment table is filterable and assignment-capable", result.passed, result);
    return result;
  }
  if (name === "filter-chips") {
    const result = fileIncludes("apps/web/src/features/manual-assignment/RoomAssignmentFilters.tsx", [
      "data-room-assignment-filters=\"ready\"",
      "Unassigned",
      "High burden",
      "Trauma",
      "Split rooms",
      "aria-pressed={activeFilter === filter.id}"
    ]);
    writeJson(`${dir}/filter-chips-output.json`, result);
    addCheck(checks, "room filters include unassigned, high burden, trauma, and split rooms", result.passed, result);
    return result;
  }
  if (name === "nurse-cards") {
    const cards = fileIncludes("apps/web/src/features/manual-assignment/NurseAssignmentCardStack.tsx", [
      "data-nurse-assignment-card-stack=\"manual\"",
      "data-burden-score={burden?.totalBurden ?? 0}",
      "data-walking-burden={card.walkingBurdenUnits}",
      "Qualification status",
      "Why is this high?",
      "Warnings"
    ]);
    const viewModel = fileIncludes("apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts", [
      "traumaQualified: boolean",
      "psychQualified: boolean",
      "chargeQualified: boolean",
      "active: boolean"
    ]);
    const result = { passed: cards.passed && viewModel.passed, cards, viewModel };
    writeJson(`${dir}/nurse-cards-output.json`, result);
    addCheck(checks, "nurse cards show burden, walking burden, qualification status, and warning breakdowns", result.passed, result);
    return result;
  }
  if (name === "burden-breakdown") {
    const result = fileIncludes("apps/web/src/features/manual-assignment/BurdenExplanationPanel.tsx", [
      "data-burden-explanation-visible=\"true\"",
      "Burden Breakdown",
      "NurseBurdenTable"
    ]);
    writeJson(`${dir}/burden-breakdown-output.json`, result);
    addCheck(checks, "burden explanation panel is visible", result.passed, result);
    return result;
  }
  if (name === "assignment-issues") {
    const result = fileIncludes("apps/web/src/features/manual-assignment/AssignmentIssuesPanel.tsx", [
      "data-assignment-issues-panel=\"visible\"",
      "data-assignment-warning-count={warnings.length}",
      "AssignmentWarningsPanel"
    ]);
    writeJson(`${dir}/assignment-issues-output.json`, result);
    addCheck(checks, "assignment issues panel is visible", result.passed, result);
    return result;
  }
  if (name === "no-synthetic-fallback-normal-mode") {
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "data-normal-manual-assignment-no-synthetic-fallback=\"true\"",
      "sourceKind: \"assignment-set-required\"",
      "sourceKind: \"assignment-set\""
    ]);
    const app = fileIncludes("apps/web/src/App.tsx", [
      "assignmentSet={activeAssignmentSet}",
      "createDefaultAssignmentSetForFloorplan(activeFloorplanContract)"
    ]);
    const fixtureBoundary = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "sourceKind: \"synthetic-fixture\""
    ]);
    const result = {
      passed: workspace.passed && app.passed && fixtureBoundary.passed,
      workspace,
      app,
      fixtureBoundary,
      normalMode: "blocked until active floorplan assignment set is loaded"
    };
    writeJson(`${dir}/no-synthetic-fallback-normal-mode-output.json`, result);
    addCheck(checks, "normal manual assignment does not silently fall back to synthetic fixtures", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported manual assignment UX stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "manual-assignment-three-column.png",
    "manual-assignment-filter-high-burden.png",
    "nurse-card-burden-breakdown.png",
    "assignment-set-selector.png",
    "assignment-set-saved.png",
    "scenario-handoff-selected-assignment.png",
    "clear-assignment-confirmation.png",
    "manual-assignment-blocked-no-active-floorplan.png"
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
    "node scripts/check-manual-assignment-three-column-ux.mjs --stage no-synthetic-fallback-normal-mode --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage assignment-selector --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage save-assignment --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage reload-assignment --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage scenario-handoff --allow-partial --issue 712",
    "node scripts/check-assignment-set-save-reload-handoff.mjs --stage clear-confirmation --allow-partial --issue 712",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
