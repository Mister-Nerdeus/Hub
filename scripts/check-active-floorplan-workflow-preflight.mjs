#!/usr/bin/env node
import {
  activeFloorplanRootScripts,
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  loadManifest,
  readArg,
  readJson,
  readText,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writeStageResult
} from "./lib/active-floorplan-workflow-utils.mjs";

const issue = readArg("--issue", "694");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stageNames = stage === "final"
  ? ["manifest-contract", "root-script-wiring", "workflow-status", "existing-state-problem", "regression-scripts-wired", "no-scope-drift"]
  : [stage];
const checks = [];
const stageResults = {};

for (const name of stageNames) {
  stageResults[name] = runStage(name);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    activeFloorplanPreflightStatus: "passed",
    activeFloorplanWorkflowGoNoGoStatus: "not_ready",
    goNoGoStatus: "not_ready"
  });
}
writeCommandsAndCloseout(issue, "Active Floorplan Workflow Preflight + Manifest", requiredCommands(), status);
writeStageResult(issue, "active-floorplan-workflow-preflight", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "manifest-contract") {
    const manifest = loadManifest();
    const required = readJson("docs/verification/active-floorplan-workflow-manifest.json");
    const result = {
      status: "passed",
      batch: manifest.batch,
      productDisplayName: manifest.productDisplayName,
      activeFloorplanWorkflowGoNoGoStatus: manifest.activeFloorplanWorkflowGoNoGoStatus,
      requiredKeys: Object.keys(required).length
    };
    writeJson(`${dir}/manifest-contract-output.json`, result);
    addCheck(checks, "active floorplan workflow manifest exists with required batch metadata", manifest.batch === "694-703" && manifest.productDisplayName === "ER Pod Shift Simulator", result);
    return result;
  }
  if (name === "root-script-wiring") {
    const packageJson = readJson("package.json");
    const missingPackageScripts = Object.keys(activeFloorplanRootScripts)
      .filter((scriptName) => packageJson.scripts?.[scriptName] !== activeFloorplanRootScripts[scriptName]);
    const verifyLocal = readText("scripts/verify-local.mjs");
    const missingVerifyLocalScripts = Object.keys(activeFloorplanRootScripts)
      .filter((scriptName) => !verifyLocal.includes(`npm run ${scriptName}`));
    const result = { status: missingPackageScripts.length === 0 && missingVerifyLocalScripts.length === 0 ? "passed" : "failed", missingPackageScripts, missingVerifyLocalScripts };
    writeJson(`${dir}/root-script-wiring-output.json`, result);
    addCheck(checks, "root scripts for Issues 694-703 are wired in package.json and verify-local", result.status === "passed", result);
    return result;
  }
  if (name === "workflow-status") {
    const result = fileIncludes("docs/project/active-floorplan-workflow-status.md", [
      "too many visible saved floorplan copies",
      "Manual Assignment could rely on editor-captured layout state",
      "Scenario comparison used static canonical context"
    ]);
    writeJson(`${dir}/workflow-status-output.json`, result);
    addCheck(checks, "workflow status doc records current UX problem", result.passed, result);
    return result;
  }
  if (name === "existing-state-problem") {
    const result = fileIncludes("docs/project/active-floorplan-workflow-status.md", [
      "Draft, save, reload proof, recovery draft, record ID, and JSON backup language",
      "Editor state could be separate from the selected saved floorplan"
    ]);
    writeJson(`${dir}/existing-state-problem-output.json`, result);
    addCheck(checks, "existing active floorplan state problem is documented", result.passed, result);
    return result;
  }
  if (name === "regression-scripts-wired") {
    const packageJson = readJson("package.json");
    const result = {
      status: packageJson.scripts?.["check:door-authoring-browser-regression"] != null
        && packageJson.scripts?.["check:split-room-browser-regression"] != null ? "passed" : "failed",
      door: packageJson.scripts?.["check:door-authoring-browser-regression"] ?? null,
      splitRoom: packageJson.scripts?.["check:split-room-browser-regression"] ?? null
    };
    writeJson(`${dir}/door-hardening-still-wired-output.json`, { status: result.door == null ? "failed" : "passed", script: result.door });
    writeJson(`${dir}/split-room-still-wired-output.json`, { status: result.splitRoom == null ? "failed" : "passed", script: result.splitRoom });
    addCheck(checks, "door and split-room browser regression scripts remain wired", result.status === "passed", result);
    return result;
  }
  if (name === "no-scope-drift") {
    const manifest = loadManifest();
    const result = {
      status: manifest.optimizerStatus === "not_started"
        && manifest.assignmentRecommendationStatus === "not_started"
        && manifest.simulationV0Status === "internal_dry_run_only"
        && manifest.noPhiStatus === "passed" ? "passed" : "failed",
      manifest
    };
    addCheck(checks, "preflight preserves no simulation/optimizer/collaboration scope drift", result.status === "passed", result);
    return result;
  }
  throw new Error(`Unsupported active floorplan preflight stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-active-floorplan-workflow-preflight.mjs --stage manifest-contract --allow-partial --issue 694",
    "node scripts/check-active-floorplan-workflow-preflight.mjs --stage root-script-wiring --allow-partial --issue 694",
    "node scripts/check-active-floorplan-workflow-preflight.mjs --stage workflow-status --allow-partial --issue 694",
    "node scripts/check-active-floorplan-workflow-preflight.mjs --stage existing-state-problem --allow-partial --issue 694",
    "node scripts/check-active-floorplan-workflow-preflight.mjs --stage regression-scripts-wired --allow-partial --issue 694",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
