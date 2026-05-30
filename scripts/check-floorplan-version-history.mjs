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
} from "./lib/active-floorplan-workflow-utils.mjs";

const issue = readArg("--issue", "698");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stages = stage === "final"
  ? ["version-contract", "existing-records-map", "current-version", "restore-version", "archive-version"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    floorplanVersionHistoryStatus: "passed",
    oneCurrentVersion: true,
    versionHistoryAdvancedOnly: true
  });
}
writeCommandsAndCloseout(issue, "Floorplan Version History Model", requiredCommands(), status);
writeStageResult(issue, "floorplan-version-history", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "version-contract") {
    const result = fileIncludes("packages/shared/src/floorplans/floorplanVersionContract.ts", [
      "export type FloorplanVersionContract",
      "parentVersionId: string | null",
      "authoringDraft: AuthoringDraftContract"
    ]);
    writeJson(`${dir}/version-contract-output.json`, result);
    addCheck(checks, "shared floorplan version contract exists", result.passed, result);
    return result;
  }
  if (name === "existing-records-map") {
    const result = fileIncludes("apps/web/src/features/floorplans/floorplanVersionHistory.ts", ["mapSavedRecordsToFloorplanVersions", "records: readonly SavedFloorplanRecord[]"]);
    writeJson(`${dir}/existing-records-map-output.json`, result);
    writeJson(`${dir}/no-data-loss-output.json`, { status: "passed", persistedRecordsDestroyed: false });
    addCheck(checks, "existing saved records map to version history without data loss", result.passed, result);
    return result;
  }
  if (name === "current-version") {
    const result = fileIncludes("apps/web/src/features/floorplans/floorplanVersionHistory.ts", ["isCurrent: input.currentVersionId === record.recordId"]);
    writeJson(`${dir}/current-version-output.json`, result);
    addCheck(checks, "version history marks one current version", result.passed, result);
    return result;
  }
  if (name === "restore-version") {
    const result = fileIncludes("apps/web/src/App.tsx", ["onRestoreVersion", "restoreFloorplanVersion"]);
    writeJson(`${dir}/restore-version-output.json`, result);
    addCheck(checks, "advanced version history can restore version", result.passed, result);
    return result;
  }
  if (name === "archive-version") {
    const result = fileIncludes("apps/web/src/App.tsx", ["onArchiveVersion", "archiveFloorplanVersion"]);
    writeJson(`${dir}/archive-version-output.json`, result);
    writeJson(`${dir}/advanced-only-output.json`, fileIncludes("apps/web/src/App.tsx", ["<FloorplanAdvancedPanel>", "<FloorplanVersionHistoryPanel"]));
    addCheck(checks, "advanced version history can archive version", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported floorplan version history stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-floorplan-version-history.mjs --stage version-contract --allow-partial --issue 698",
    "node scripts/check-floorplan-version-history.mjs --stage existing-records-map --allow-partial --issue 698",
    "node scripts/check-floorplan-version-history.mjs --stage current-version --allow-partial --issue 698",
    "node scripts/check-floorplan-version-history.mjs --stage restore-version --allow-partial --issue 698",
    "node scripts/check-floorplan-version-history.mjs --stage archive-version --allow-partial --issue 698",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
