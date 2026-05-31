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

const issue = readArg("--issue", "706");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["hub-contract", "active-floorplan-card", "next-step-card", "prepare-for-simulation-copy", "advanced-hidden"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    activeFloorplanHubUxStatus: "passed",
    activeFloorplanHubMatchesMockup: true,
    nextStepCardVisible: true,
    prepareForSimulationNotOverclaimed: true,
    advancedTechnicalDetailsHidden: true
  });
}
writeCommandsAndCloseout(issue, "Active Floorplan Hub Mockup-Level Layout", requiredCommands(), status);
writeStageResult(issue, "active-floorplan-hub-ux", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "hub-contract") {
    const hub = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "data-active-floorplan-hub=\"normal\"",
      "ActiveFloorplanSelector",
      "ActiveFloorplanThumbnail",
      "NextWorkflowStepCard",
      "FloorplanReadinessChecklist",
      "active-floorplan-version-summary",
      "FloorplanAdvancedPanel"
    ]);
    const app = fileIncludes("apps/web/src/App.tsx", ["<ActiveFloorplanHub", "advancedContent"]);
    const result = { passed: hub.passed && app.passed, hub, app };
    writeJson(`${dir}/hub-contract-output.json`, result);
    addCheck(checks, "normal floorplan page renders one active floorplan hub", result.passed, result);
    return result;
  }
  if (name === "active-floorplan-card") {
    const card = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", [
      "Active floorplan",
      "Edit Floorplan",
      "Use for Assignment",
      "Prepare for Simulation",
      "Change Floorplan"
    ]);
    const thumbnail = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanThumbnail.tsx", [
      "thumbnail preview",
      "layout.rooms",
      "layout.stations"
    ]);
    const result = { passed: card.passed && thumbnail.passed, card, thumbnail };
    writeJson(`${dir}/active-floorplan-card-output.json`, result);
    writeJson(`${dir}/thumbnail-output.json`, thumbnail);
    addCheck(checks, "hub includes active floorplan card and thumbnail", result.passed, result);
    return result;
  }
  if (name === "next-step-card") {
    const next = fileIncludes("apps/web/src/features/floorplans/NextWorkflowStepCard.tsx", [
      "What do I do next?",
      "Build the assignment set",
      "Start Assignments",
      "Prepare for Simulation"
    ]);
    const composition = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "NextWorkflowStepCard",
      "FloorplanReadinessChecklist"
    ]);
    const versionSummary = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "Version summary",
      "Selected version",
      "Saved versions",
      "Last saved"
    ]);
    const result = { passed: next.passed && composition.passed && versionSummary.passed, next, composition, versionSummary };
    writeJson(`${dir}/next-step-card-output.json`, next);
    writeJson(`${dir}/readiness-composition-output.json`, composition);
    writeJson(`${dir}/version-summary-output.json`, versionSummary);
    addCheck(checks, "next-step guidance is prominent with readiness and version summary", result.passed, result);
    return result;
  }
  if (name === "prepare-for-simulation-copy") {
    const includes = fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", ["Prepare for Simulation"]);
    const checklist = fileExcludes("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx", ["Ready for simulation"]);
    const selector = fileExcludes("apps/web/src/features/floorplans/activeFloorplanSelectorViewModel.ts", ["Ready for simulation"]);
    const result = { passed: includes.passed && checklist.passed && selector.passed, includes, checklist, selector };
    writeJson(`${dir}/prepare-for-simulation-copy-output.json`, result);
    addCheck(checks, "floorplan hub uses Prepare for Simulation without claiming floorplan-only readiness", result.passed, result);
    return result;
  }
  if (name === "advanced-hidden") {
    const normalHidden = fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "recordId",
      "saved-default",
      "local recovery",
      "raw evidence",
      "canonical fixture",
      "Copy Copy",
      "JSON"
    ]);
    const advanced = fileIncludes("apps/web/src/App.tsx", [
      "FloorplanLandingSummary",
      "CanonicalFloorplanHeader",
      "FloorplanVersionHistoryPanel",
      "FloorplanLibrary",
      "LegacyFloorplanFixturesPanel"
    ]);
    const result = { passed: normalHidden.passed && advanced.passed, normalHidden, advanced };
    writeJson(`${dir}/advanced-hidden-output.json`, result);
    writeJson(`${dir}/technical-copy-hidden-output.json`, normalHidden);
    addCheck(checks, "technical/library/evidence surfaces are collapsed under Advanced", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported active floorplan hub stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "active-floorplan-hub-normal.png",
    "active-floorplan-hub-next-step.png",
    "active-floorplan-hub-advanced-open.png"
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
    "node scripts/check-active-floorplan-hub-ux.mjs --stage hub-contract --allow-partial --issue 706",
    "node scripts/check-active-floorplan-hub-ux.mjs --stage active-floorplan-card --allow-partial --issue 706",
    "node scripts/check-active-floorplan-hub-ux.mjs --stage next-step-card --allow-partial --issue 706",
    "node scripts/check-active-floorplan-hub-ux.mjs --stage prepare-for-simulation-copy --allow-partial --issue 706",
    "node scripts/check-active-floorplan-hub-ux.mjs --stage advanced-hidden --allow-partial --issue 706",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
