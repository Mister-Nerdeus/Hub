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
  writeStageResult
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "708");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stages = stage === "final" ? ["corrupted-localstorage", "fallback-floorplan"] : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    activeFloorplanPersistenceResilienceStatus: "passed",
    corruptedActiveFloorplanStorageHandled: true
  });
}
writeCommandsAndCloseout(issue, "Active Floorplan Persistence Resilience", requiredCommands(), status);
writeStageResult(issue, "active-floorplan-persistence-resilience", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "corrupted-localstorage") {
    const result = fileIncludes("apps/web/src/features/floorplans/activeFloorplanPersistence.ts", [
      "try {",
      "JSON.parse(raw)",
      "catch",
      "storage.removeItem(key)",
      "return null"
    ]);
    writeJson(`${dir}/corrupted-localstorage-output.json`, result);
    addCheck(checks, "corrupted active-floorplan localStorage JSON is caught and cleared", result.passed, result);
    return result;
  }
  if (name === "fallback-floorplan") {
    const app = fileIncludes("apps/web/src/App.tsx", [
      "const fallback = createEmptyActiveFloorplanState()",
      "readPersistedActiveFloorplanSelection(getLocalStorage())",
      "return savedRecord == null ? fallback : openSavedFloorplan(fallback, savedRecord)"
    ]);
    const state = fileIncludes("apps/web/src/features/floorplans/activeFloorplanState.ts", [
      "createEmptyActiveFloorplanState",
      "openDefaultFloorplan"
    ]);
    const result = { passed: app.passed && state.passed, app, state };
    writeJson(`${dir}/fallback-floorplan-output.json`, result);
    addCheck(checks, "invalid or missing active-floorplan storage falls back to canonical active floorplan", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported active floorplan persistence resilience stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-active-floorplan-persistence-resilience.mjs --stage corrupted-localstorage --allow-partial --issue 708",
    "node scripts/check-active-floorplan-persistence-resilience.mjs --stage fallback-floorplan --allow-partial --issue 708",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
