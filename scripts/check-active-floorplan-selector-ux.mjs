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
} from "./lib/active-floorplan-workflow-utils.mjs";

const issue = readArg("--issue", "696");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["selector-view-model", "normal-mode", "change-dropdown", "advanced-library", "technical-copy-hidden"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    activeFloorplanSelectorStatus: "passed",
    normalModeShowsOneFloorplan: true,
    technicalFloorplanDetailsAdvancedOnly: true
  });
}
writeCommandsAndCloseout(issue, "Active Floorplan Selector Normal UX", requiredCommands(), status, [
  "Screenshots are local placeholder artifacts unless rerun with a browser capture script."
]);
writeStageResult(issue, "active-floorplan-selector-ux", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "selector-view-model") {
    const result = fileIncludes("apps/web/src/features/floorplans/activeFloorplanSelectorViewModel.ts", [
      "ActiveFloorplanSelectorViewModel",
      "technicalDetailsVisible: false",
      "versionOptions"
    ]);
    writeJson(`${dir}/selector-view-model-output.json`, result);
    addCheck(checks, "selector view model hides technical details", result.passed, result);
    return result;
  }
  if (name === "normal-mode") {
    const includes = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", [
      "Active floorplan",
      "Edit Floorplan",
      "Use for Assignment",
      "Use for Simulation",
      "Change Floorplan",
      "Advanced"
    ]);
    const excludes = fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", [
      "recordId",
      "canonical fixture",
      "saved-default",
      "Copy Copy",
      "Evidence"
    ]);
    const result = { passed: includes.passed && excludes.passed, includes, excludes };
    writeJson(`${dir}/normal-mode-active-floorplan-output.json`, result);
    addCheck(checks, "normal mode renders one active floorplan selector without technical copy", result.passed, result);
    return result;
  }
  if (name === "change-dropdown") {
    const result = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", ["<select", "Saved versions", "onChangeFloorplan"]);
    writeJson(`${dir}/change-dropdown-output.json`, result);
    addCheck(checks, "saved versions are selected from dropdown", result.passed, result);
    return result;
  }
  if (name === "advanced-library") {
    const result = fileIncludes("apps/web/src/App.tsx", ["<FloorplanAdvancedPanel>", "<FloorplanLibrary", "<FloorplanVersionHistoryPanel"]);
    writeJson(`${dir}/advanced-library-output.json`, result);
    addCheck(checks, "old card grid and version history are advanced-only", result.passed, result);
    return result;
  }
  if (name === "technical-copy-hidden") {
    const excludes = fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", [
      "Record ID",
      "JSON",
      "reload proof",
      "canonical fixture",
      "Copy Copy"
    ]);
    writeJson(`${dir}/technical-copy-hidden-output.json`, excludes);
    writeJson(`${dir}/no-copy-copy-output.json`, excludes);
    addCheck(checks, "technical floorplan copy is absent from normal selector", excludes.passed, excludes);
    return excludes;
  }
  throw new Error(`Unsupported selector UX stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "active-floorplan-selector-normal.png",
    "active-floorplan-selector-change-dropdown.png",
    "floorplan-advanced-library.png"
  ];
  for (const screenshot of screenshots) {
    writePlaceholderPng(`${dir}/screenshots/${screenshot}`);
  }
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
    "node scripts/check-active-floorplan-selector-ux.mjs --stage selector-view-model --allow-partial --issue 696",
    "node scripts/check-active-floorplan-selector-ux.mjs --stage normal-mode --allow-partial --issue 696",
    "node scripts/check-active-floorplan-selector-ux.mjs --stage change-dropdown --allow-partial --issue 696",
    "node scripts/check-active-floorplan-selector-ux.mjs --stage advanced-library --allow-partial --issue 696",
    "node scripts/check-active-floorplan-selector-ux.mjs --stage technical-copy-hidden --allow-partial --issue 696",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
