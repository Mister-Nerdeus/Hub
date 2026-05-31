#!/usr/bin/env node
import {
  addCheck,
  editorAssignmentUxRootScripts,
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
  writeStageResult,
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "704");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);

const stages = stage === "final"
  ? ["manifest-contract", "root-script-wiring", "source-regression-wiring", "scope-boundary"]
  : [stage];
const checks = [];
const stageResults = {};

for (const name of stages) {
  stageResults[name] = runStage(name);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, issue === "704"
    ? {
        editorAssignmentUxPreflightStatus: "passed",
        editorAssignmentUxGoNoGoStatus: "not_ready",
        goNoGoStatus: "not_ready"
      }
    : {
        editorAssignmentUxPreflightStatus: "passed"
      });
}
writeCommandsAndCloseout(issue, "Editor/Assignment UX Batch Preflight + Manifest", requiredCommands(), status, [
  "Issue 704 intentionally wires status and validators only; product UI changes begin in Issue 705."
]);
writeStageResult(issue, "editor-assignment-ux-preflight", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "manifest-contract") {
    const manifest = loadManifest();
    const requiredKeys = [
      "manifestVersion",
      "batch",
      "lastUpdatedIssue",
      "productDisplayName",
      "sourceActiveFloorplanWorkflowStatus",
      "sourceDoorAuthoringStatus",
      "sourceSplitRoomAuthoringStatus",
      "editorAssignmentUxPreflightStatus",
      "productShellWorkflowStatus",
      "activeFloorplanHubUxStatus",
      "editorNormalToolbarUxStatus",
      "floorplanReadinessTruthStatus",
      "activeFloorplanPersistenceResilienceStatus",
      "assignmentSetContractStatus",
      "nurseProfileBuilderStatus",
      "roomLoadEditorStatus",
      "manualAssignmentThreeColumnUxStatus",
      "assignmentSetHandoffStatus",
      "editorAssignmentUxGoNoGoStatus",
      "scenarioBuilderStatus",
      "simulationReviewStatus",
      "reportsStatus",
      "optimizerStatus",
      "assignmentRecommendationStatus",
      "clinicalSafetyScoringStatus",
      "staffingComplianceStatus",
      "patientOutcomePredictionStatus",
      "noPhiStatus",
      "goNoGoStatus"
    ];
    const missing = requiredKeys.filter((key) => !(key in manifest));
    const result = {
      status: missing.length === 0 && manifest.batch === "704-713" && manifest.productDisplayName === "ER Pod Shift Simulator" ? "passed" : "failed",
      missing,
      batch: manifest.batch,
      productDisplayName: manifest.productDisplayName,
      editorAssignmentUxGoNoGoStatus: manifest.editorAssignmentUxGoNoGoStatus
    };
    writeJson(`${dir}/manifest-contract-output.json`, result);
    addCheck(checks, "editor-assignment manifest exists with required batch metadata", result.status === "passed", result);
    return result;
  }
  if (name === "root-script-wiring") {
    const packageJson = readJson("package.json");
    const missingPackageScripts = Object.keys(editorAssignmentUxRootScripts)
      .filter((scriptName) => packageJson.scripts?.[scriptName] !== editorAssignmentUxRootScripts[scriptName]);
    const verifyLocal = readText("scripts/verify-local.mjs");
    const missingVerifyLocalScripts = Object.keys(editorAssignmentUxRootScripts)
      .filter((scriptName) => !verifyLocal.includes(`npm run ${scriptName}`));
    const result = {
      status: missingPackageScripts.length === 0 && missingVerifyLocalScripts.length === 0 ? "passed" : "failed",
      missingPackageScripts,
      missingVerifyLocalScripts
    };
    writeJson(`${dir}/root-script-wiring-output.json`, result);
    addCheck(checks, "root scripts for Issues 704-713 are wired in package.json and verify-local", result.status === "passed", result);
    return result;
  }
  if (name === "source-regression-wiring") {
    const packageJson = readJson("package.json");
    const activeFloorplan = packageJson.scripts?.["check:active-floorplan-workflow-go-no-go"] ?? null;
    const door = packageJson.scripts?.["check:door-authoring-browser-regression"] ?? null;
    const splitRoom = packageJson.scripts?.["check:split-room-browser-regression"] ?? null;
    const result = {
      status: activeFloorplan != null && door != null && splitRoom != null ? "passed" : "failed",
      activeFloorplan,
      door,
      splitRoom
    };
    writeJson(`${dir}/source-regression-wiring-output.json`, result);
    addCheck(checks, "active floorplan, door, and split-room regression scripts remain wired", result.status === "passed", result);
    return result;
  }
  if (name === "scope-boundary") {
    const manifest = loadManifest();
    const statusDoc = fileIncludes("docs/project/editor-assignment-ux-status.md", [
      "Scenario Builder remains foundation-only.",
      "Simulation Review remains internal dry-run only.",
      "Reports remain placeholder-only.",
      "Optimization and assignment recommendations remain not started.",
      "This batch is editor and assignment productization only."
    ]);
    const preflightGoNoGoStatusAllowed = issue === "704"
      ? manifest.goNoGoStatus === "not_ready"
      : ["not_ready", "go_for_next_batch", "blocked_with_exact_editor_assignment_items", "no_go_with_exact_blockers"].includes(manifest.goNoGoStatus);
    const manifestBoundaryPassed =
      manifest.scenarioBuilderStatus === "foundation_only"
      && manifest.simulationReviewStatus === "internal_dry_run_only"
      && manifest.reportsStatus === "placeholder_only"
      && manifest.optimizerStatus === "not_started"
      && manifest.assignmentRecommendationStatus === "not_started"
      && manifest.clinicalSafetyScoringStatus === "not_started"
      && manifest.staffingComplianceStatus === "not_started"
      && manifest.patientOutcomePredictionStatus === "not_started"
      && preflightGoNoGoStatusAllowed;
    const result = {
      status: statusDoc.passed && manifestBoundaryPassed ? "passed" : "failed",
      statusDoc,
      manifestBoundaryPassed
    };
    writeText(`${dir}/scope-boundary-output.txt`, `status: ${result.status}
Scenario, Simulation, Reports, and Optimization are not complete.
Batch scope is editor and assignment productization only.
`);
    addCheck(checks, "preflight records batch boundaries and incomplete downstream workflows", result.status === "passed", result);
    return result;
  }
  throw new Error(`Unsupported editor-assignment preflight stage: ${name}`);
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-editor-assignment-ux-preflight.mjs --stage manifest-contract --allow-partial --issue 704",
    "node scripts/check-editor-assignment-ux-preflight.mjs --stage root-script-wiring --allow-partial --issue 704",
    "node scripts/check-editor-assignment-ux-preflight.mjs --stage source-regression-wiring --allow-partial --issue 704",
    "node scripts/check-editor-assignment-ux-preflight.mjs --stage scope-boundary --allow-partial --issue 704",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
