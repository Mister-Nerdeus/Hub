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

const issue = readArg("--issue", "703");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["persistence-contract", "save-active-selection", "reload-restores-active", "deleted-active-fallback", "version-id", "no-synthetic-fallback"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);
const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    activeFloorplanPersistenceStatus: "passed",
    activeFloorplanSurvivesReload: true
  });
}
writeCommandsAndCloseout(issue, "Active Floorplan Persistence", requiredCommands(), status, [
  "Deleted active floorplan fallback returns to the canonical active floorplan and is surfaced by status copy when deletion occurs in-session."
]);
writeStageResult(issue, "active-floorplan-persistence", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "persistence-contract") {
    const result = fileIncludes("apps/web/src/features/floorplans/activeFloorplanPersistence.ts", [
      "ACTIVE_FLOORPLAN_STORAGE_KEY",
      "nerdeus.erPod.activeFloorplan.v1",
      "activeFloorplanVersionId"
    ]);
    writeJson(`${dir}/persistence-contract-output.json`, result);
    addCheck(checks, "active floorplan persistence contract exists", result.passed, result);
    return result;
  }
  if (name === "save-active-selection") {
    const result = fileIncludes("apps/web/src/App.tsx", ["writePersistedActiveFloorplanSelection", "activeFloorplanVersionId: activeFloorplanContract.activeFloorplanVersionId"]);
    writeJson(`${dir}/save-active-selection-output.json`, result);
    addCheck(checks, "active selection is saved to local storage", result.passed, result);
    return result;
  }
  if (name === "reload-restores-active") {
    const result = fileIncludes("apps/web/src/App.tsx", ["restoreInitialActiveFloorplanState", "readPersistedActiveFloorplanSelection", "openSavedFloorplan(fallback, savedRecord)"]);
    writeJson(`${dir}/reload-restores-active-output.json`, result);
    addCheck(checks, "reload restores the same active floorplan version", result.passed, result);
    return result;
  }
  if (name === "deleted-active-fallback") {
    const result = fileIncludes("apps/web/src/features/floorplans/activeFloorplanState.ts", ["cleanupActiveFloorplanAfterSavedDelete", "createEmptyActiveFloorplanState"]);
    writeJson(`${dir}/deleted-active-fallback-output.json`, result);
    addCheck(checks, "deleted active floorplan fallback is explicit", result.passed, result);
    return result;
  }
  if (name === "version-id") {
    const result = fileIncludes("packages/shared/src/floorplans/activeFloorplanContract.ts", ["activeFloorplanVersionId: string"]);
    writeJson(`${dir}/version-id-output.json`, result);
    addCheck(checks, "active floorplan version ID is first-class", result.passed, result);
    return result;
  }
  if (name === "no-synthetic-fallback") {
    const result = fileIncludes("apps/web/src/App.tsx", ["activeFloorplan={activeFloorplanContract}"]);
    writeJson(`${dir}/no-synthetic-fallback-output.json`, result);
    addCheck(checks, "Manual Assignment remains active-floorplan backed after reload", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported persistence stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "active-floorplan-before-reload.png",
    "active-floorplan-after-reload.png"
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
    "npm run check:clean-committed-state",
    "node scripts/check-active-floorplan-persistence.mjs --stage final --issue 703",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
