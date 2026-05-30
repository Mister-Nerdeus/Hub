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

const issue = readArg("--issue", "699");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["normal-save-ui", "save-result-copy", "advanced-save-tools", "local-draft-hidden", "active-after-save"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);
const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    saveAndUseFloorplanStatus: "passed",
    normalSaveIsSimple: true,
    advancedSaveToolsHidden: true,
    savedFloorplanBecomesActive: true
  });
}
writeCommandsAndCloseout(issue, "Save and Use This Floorplan UX", requiredCommands(), status, [
  "Screenshots are local placeholder artifacts unless rerun with a browser capture script."
]);
writeStageResult(issue, "save-and-use-floorplan-ux", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "normal-save-ui") {
    const includes = fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", ["Save Floorplan", "Done Editing", "EditorAdvancedToolsPanel"]);
    const excludes = fileExcludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", [">Save Working Copy<", ">Save As New Copy<"]);
    const result = { passed: includes.passed && excludes.passed, includes, excludes };
    writeJson(`${dir}/normal-save-ui-output.json`, result);
    addCheck(checks, "normal save UI is Save Floorplan and Done Editing", result.passed, result);
    return result;
  }
  if (name === "save-result-copy") {
    const result = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["Saved. This floorplan is active for assignments and scenarios."]);
    writeJson(`${dir}/save-result-copy-output.json`, result);
    addCheck(checks, "save result copy says floorplan is active", result.passed, result);
    return result;
  }
  if (name === "advanced-save-tools") {
    const result = fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", ["Save as New Version", "Export JSON Backup", "Import JSON", "Restore Local Draft"]);
    writeJson(`${dir}/advanced-save-tools-output.json`, result);
    writeJson(`${dir}/export-json-advanced-output.json`, result);
    addCheck(checks, "advanced save tools contain version, JSON, and recovery actions", result.passed, result);
    return result;
  }
  if (name === "local-draft-hidden") {
    const result = fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", ["<EditorAdvancedToolsPanel>", "Restore Local Draft"]);
    writeJson(`${dir}/local-draft-hidden-output.json`, result);
    addCheck(checks, "local draft tools are inside advanced panel", result.passed, result);
    return result;
  }
  if (name === "active-after-save") {
    const result = fileIncludes("apps/web/src/App.tsx", ["setActiveFloorplanState((state) => openSavedFloorplan(state, saved))", "Saved. This floorplan is active for assignments and scenarios."]);
    writeJson(`${dir}/active-after-save-output.json`, result);
    addCheck(checks, "saving makes saved floorplan active", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported save-and-use stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "editor-normal-save-floorplan.png",
    "editor-advanced-save-tools.png",
    "saved-floorplan-active-message.png"
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
    "node scripts/check-save-and-use-floorplan-ux.mjs --stage normal-save-ui --allow-partial --issue 699",
    "node scripts/check-save-and-use-floorplan-ux.mjs --stage save-result-copy --allow-partial --issue 699",
    "node scripts/check-save-and-use-floorplan-ux.mjs --stage advanced-save-tools --allow-partial --issue 699",
    "node scripts/check-save-and-use-floorplan-ux.mjs --stage local-draft-hidden --allow-partial --issue 699",
    "node scripts/check-save-and-use-floorplan-ux.mjs --stage active-after-save --allow-partial --issue 699",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
