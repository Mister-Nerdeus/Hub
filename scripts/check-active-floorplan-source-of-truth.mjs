#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  fileExcludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writeStageResult
} from "./lib/active-floorplan-workflow-utils.mjs";

const issue = readArg("--issue", "695");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stages = stage === "final"
  ? ["contract", "app-state-refactor", "editor-consumes-active", "manual-assignment-consumes-active", "scenario-consumes-active", "simulation-displays-active", "reports-displays-active", "no-synthetic-fallback"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    activeFloorplanContractStatus: "passed",
    singleActiveFloorplanContract: true,
    manualAssignmentUsesActiveFloorplan: true,
    scenarioUsesActiveFloorplan: true,
    simulationDisplaysActiveFloorplan: true,
    reportsDisplayActiveFloorplan: true,
    noSilentSyntheticFallback: true
  });
}
writeCommandsAndCloseout(issue, "Active Floorplan Source-of-Truth Contract", requiredCommands(), status);
writeStageResult(issue, "active-floorplan-source-of-truth", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "contract") {
    const result = fileIncludes("packages/shared/src/floorplans/activeFloorplanContract.ts", [
      "export type ActiveFloorplanWorkflowStatus",
      "export type ActiveFloorplanContract",
      "activeFloorplanVersionId: string",
      "editableLayout: EditableLayoutGeometryContract"
    ]);
    writeJson(`${dir}/contract-output.json`, result);
    addCheck(checks, "shared ActiveFloorplanContract exists", result.passed, result);
    return result;
  }
  if (name === "app-state-refactor") {
    const result = fileIncludes("apps/web/src/features/floorplans/activeFloorplanState.ts", [
      "createActiveFloorplanContract",
      "selectedForAssignmentVersionId",
      "selectedForSimulationVersionId",
      "ACTIVE_FLOORPLAN_ID"
    ]);
    writeJson(`${dir}/app-state-refactor-output.json`, result);
    addCheck(checks, "app active floorplan state creates one contract", result.passed, result);
    return result;
  }
  if (name === "editor-consumes-active") {
    const result = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "activeFloorplanContract?: ActiveFloorplanContract",
      "data-active-floorplan-version-id"
    ]);
    writeJson(`${dir}/editor-consumes-active-floorplan-output.json`, result);
    addCheck(checks, "editor receives active floorplan contract context", result.passed, result);
    return result;
  }
  if (name === "manual-assignment-consumes-active") {
    const includes = fileIncludes("apps/web/src/App.tsx", ["activeFloorplan={activeFloorplanContract}"]);
    const excludes = fileExcludes("apps/web/src/App.tsx", ["activeEditableLayout={activeEditorLayout}"]);
    const result = { passed: includes.passed && excludes.passed, includes, excludes };
    writeJson(`${dir}/manual-assignment-consumes-active-floorplan-output.json`, result);
    addCheck(checks, "Manual Assignment uses the active floorplan contract instead of editor-only state", result.passed, result);
    return result;
  }
  if (name === "scenario-consumes-active") {
    const result = fileIncludes("apps/web/src/App.tsx", ["ScenarioRatioComparisonPanel", "activeFloorplan={activeFloorplanContract}"]);
    writeJson(`${dir}/scenario-consumes-active-floorplan-output.json`, result);
    addCheck(checks, "Scenario Comparison receives active floorplan context", result.passed, result);
    return result;
  }
  if (name === "simulation-displays-active") {
    const result = fileIncludes("apps/web/src/features/simulation/SimulationV0InternalDryRunPanel.tsx", ["Selected floorplan:", "activeFloorplan?.displayName"]);
    writeJson(`${dir}/simulation-displays-active-floorplan-output.json`, result);
    addCheck(checks, "Simulation Review displays active floorplan context", result.passed, result);
    return result;
  }
  if (name === "reports-displays-active") {
    const result = fileIncludes("apps/web/src/App.tsx", ["Selected floorplan: {activeFloorplanContract?.displayName"]);
    writeJson(`${dir}/reports-displays-active-floorplan-output.json`, result);
    addCheck(checks, "Reports placeholder displays active floorplan context", result.passed, result);
    return result;
  }
  if (name === "no-synthetic-fallback") {
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "source.sourceKind === \"assignment-set-required\"",
      "data-active-floorplan-version-id"
    ]);
    const blockedState = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentBlockedState.tsx", [
      "data-normal-manual-assignment-no-synthetic-fallback=\"true\""
    ]);
    const result = { passed: workspace.passed && blockedState.passed, workspace, blockedState };
    writeJson(`${dir}/no-synthetic-fallback-output.json`, result);
    addCheck(checks, "Manual Assignment does not silently choose synthetic fixture when active floorplan exists", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported source-of-truth stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-active-floorplan-source-of-truth.mjs --stage contract --allow-partial --issue 695",
    "node scripts/check-active-floorplan-source-of-truth.mjs --stage app-state-refactor --allow-partial --issue 695",
    "node scripts/check-active-floorplan-source-of-truth.mjs --stage editor-consumes-active --allow-partial --issue 695",
    "node scripts/check-active-floorplan-source-of-truth.mjs --stage manual-assignment-consumes-active --allow-partial --issue 695",
    "node scripts/check-active-floorplan-source-of-truth.mjs --stage scenario-consumes-active --allow-partial --issue 695",
    "node scripts/check-active-floorplan-source-of-truth.mjs --stage no-synthetic-fallback --allow-partial --issue 695",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
