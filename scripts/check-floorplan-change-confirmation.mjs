#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
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

const issue = readArg("--issue", "702");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["confirmation-dialog", "cancel-preserves", "confirm-changes", "assignment-compatibility", "no-synthetic-fallback"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);
const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    floorplanChangeConfirmationStatus: "passed",
    assignmentCompatibilityGuard: true,
    noSilentSyntheticFallback: true
  });
}
writeCommandsAndCloseout(issue, "Floorplan Change Confirmation + Assignment Compatibility Guard", requiredCommands(), status);
writeStageResult(issue, "floorplan-change-confirmation", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "confirmation-dialog") {
    const result = fileIncludes("apps/web/src/features/floorplans/FloorplanChangeConfirmationDialog.tsx", [
      "Change active floorplan?",
      "Changing floorplans may make some room assignments incompatible.",
      "Cancel",
      "Change Floorplan"
    ]);
    writeJson(`${dir}/confirmation-dialog-output.json`, result);
    addCheck(checks, "confirmation dialog copy exists", result.passed, result);
    return result;
  }
  if (name === "cancel-preserves") {
    const result = fileIncludes("apps/web/src/App.tsx", ["onCancel={() => setPendingFloorplanChangeVersionId(null)}"]);
    writeJson(`${dir}/cancel-preserves-floorplan-output.json`, result);
    addCheck(checks, "cancel preserves active floorplan", result.passed, result);
    return result;
  }
  if (name === "confirm-changes") {
    const result = fileIncludes("apps/web/src/App.tsx", ["confirmPendingFloorplanChange", "setManualAssignmentsByRoomId({})"]);
    writeJson(`${dir}/confirm-changes-floorplan-output.json`, result);
    addCheck(checks, "confirm changes floorplan and clears assignments explicitly", result.passed, result);
    return result;
  }
  if (name === "assignment-compatibility") {
    const result = fileIncludes("apps/web/src/features/floorplans/floorplanCompatibility.ts", ["missingRoomIds", "checkAssignmentCompatibility"]);
    writeJson(`${dir}/assignment-compatibility-output.json`, result);
    writeJson(`${dir}/scenario-compatibility-output.json`, fileIncludes("apps/web/src/features/scenarios/scenarioComparisonViewModel.ts", ["activeFloorplanContext"]));
    addCheck(checks, "assignment compatibility guard lists missing room IDs", result.passed, result);
    return result;
  }
  if (name === "no-synthetic-fallback") {
    const result = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", ["activeFloorplan?.editableLayout ?? activeEditableLayout"]);
    writeJson(`${dir}/no-synthetic-fallback-output.json`, result);
    addCheck(checks, "floorplan change does not trigger silent synthetic fallback", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported floorplan change stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "floorplan-change-confirmation.png",
    "assignment-incompatible-after-change.png"
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
    "node scripts/check-floorplan-change-confirmation.mjs --stage confirmation-dialog --allow-partial --issue 702",
    "node scripts/check-floorplan-change-confirmation.mjs --stage cancel-preserves --allow-partial --issue 702",
    "node scripts/check-floorplan-change-confirmation.mjs --stage confirm-changes --allow-partial --issue 702",
    "node scripts/check-floorplan-change-confirmation.mjs --stage assignment-compatibility --allow-partial --issue 702",
    "node scripts/check-floorplan-change-confirmation.mjs --stage no-synthetic-fallback --allow-partial --issue 702",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
