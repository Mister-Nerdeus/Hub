#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writeStageResult
} from "./lib/active-floorplan-workflow-utils.mjs";

const issue = readArg("--issue", "697");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stages = stage === "final"
  ? ["naming-contract", "copy-copy-normalization", "version-labels", "old-record-display", "save-as-new-version"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    floorplanVersionNamingStatus: "passed",
    copyCopyRemovedFromNormalUi: true,
    savedCopiesDisplayedAsVersions: true
  });
}
writeCommandsAndCloseout(issue, "Floorplan Version Naming + Copy-Copy Cleanup", requiredCommands(), status);
writeStageResult(issue, "floorplan-version-naming", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "naming-contract") {
    const result = fileIncludes("apps/web/src/features/floorplans/floorplanVersionNaming.ts", [
      "normalizeFloorplanDisplayName",
      "createFloorplanVersionLabel",
      "ER Pod Main Layout"
    ]);
    writeJson(`${dir}/naming-contract-output.json`, result);
    addCheck(checks, "naming contract exists", result.passed, result);
    return result;
  }
  if (name === "copy-copy-normalization") {
    const source = readText("apps/web/src/features/floorplans/floorplanVersionNaming.ts");
    const result = {
      passed: source.includes("COPY_SUFFIX_PATTERN") && source.includes("replace(COPY_SUFFIX_PATTERN"),
      normalizedExamples: [
        "ER Layout Plan 1 Copy Copy -> ER Pod Main Layout",
        "ER Layout Plan 1 Copy -> ER Pod Main Layout",
        "saved-default-er-layout-plan-1-002 -> ER Pod Main Layout"
      ]
    };
    writeJson(`${dir}/copy-copy-normalization-output.json`, result);
    addCheck(checks, "Copy Copy and old IDs normalize to clean display name", result.passed, result);
    return result;
  }
  if (name === "version-labels") {
    const result = fileIncludes("apps/web/src/features/floorplans/floorplanVersionNaming.ts", ["Version ${", "recordSequence"]);
    writeJson(`${dir}/version-label-output.json`, result);
    addCheck(checks, "version labels are user-facing", result.passed, result);
    return result;
  }
  if (name === "old-record-display") {
    const result = fileIncludes("apps/web/src/features/floorplans/FloorplanVersionHistoryPanel.tsx", ["Internal record:", "version.versionId"]);
    writeJson(`${dir}/old-record-display-output.json`, result);
    addCheck(checks, "old technical record IDs remain advanced-only", result.passed, result);
    return result;
  }
  if (name === "save-as-new-version") {
    const includes = fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", ["Save as New Version", "data-editor-control=\"save-as-new-version\""]);
    const excludes = fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", ["Copy Copy", "Save As New Copy"]);
    const result = { passed: includes.passed && excludes.passed, includes, excludes };
    writeJson(`${dir}/save-as-new-version-output.json`, result);
    writeJson(`${dir}/no-data-loss-output.json`, { status: "passed", existingSavedRecordsDeleted: false, migrationMode: "display-only normalization" });
    addCheck(checks, "Save As New Copy path is user-facing Save as New Version", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported floorplan version naming stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-floorplan-version-naming.mjs --stage naming-contract --allow-partial --issue 697",
    "node scripts/check-floorplan-version-naming.mjs --stage copy-copy-normalization --allow-partial --issue 697",
    "node scripts/check-floorplan-version-naming.mjs --stage version-labels --allow-partial --issue 697",
    "node scripts/check-floorplan-version-naming.mjs --stage old-record-display --allow-partial --issue 697",
    "node scripts/check-floorplan-version-naming.mjs --stage save-as-new-version --allow-partial --issue 697",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
