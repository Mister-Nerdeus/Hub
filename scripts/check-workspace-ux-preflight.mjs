#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  loadWorkspaceUxManifest,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  workspaceUxRequiredManifestFlags,
  workspaceUxRootScripts,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "704");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-workspace-ux-preflight";
const title = "Workspace UX Manifest Preflight";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-workspace-ux-preflight.mjs --stage manifest-contract --allow-partial --issue 704",
  "node scripts/check-workspace-ux-preflight.mjs --stage root-script-wiring --allow-partial --issue 704",
  "node scripts/check-workspace-ux-preflight.mjs --stage source-regression-wiring --allow-partial --issue 704",
  "node scripts/check-workspace-ux-preflight.mjs --stage scope-boundary --allow-partial --issue 704",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "manifest-contract": checkManifestContract,
  "root-script-wiring": checkRootScriptWiring,
  "source-regression-wiring": checkSourceRegressionWiring,
  "scope-boundary": checkScopeBoundary
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) {
    throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  }
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  const currentManifest = loadWorkspaceUxManifest();
  const preflightPatch = issue === "704"
    ? currentManifest.goNoGoStatus === "go_for_next_milestone"
      ? {
          workspaceUxPreflightStatus: "passed"
        }
      : {
        workspaceUxPreflightStatus: "passed",
        workspaceUxGoNoGoStatus: "not_ready",
        goNoGoStatus: "not_ready"
      }
    : {
        workspaceUxPreflightStatus: "passed"
      };
  updateWorkspaceUxManifest(issue, preflightPatch);
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: issue === "704"
      ? {
          workspaceUxPreflightStatus: "passed",
          workspaceUxGoNoGoStatus: "not_ready",
          goNoGoStatus: "not_ready"
        }
      : {
          workspaceUxPreflightStatus: "passed"
        }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The default-branch baseline has the prior active-floorplan, door, and split-room gates available; Milestone A needed a separate manifest and root preflight commands before UI edits.",
  filesChanged: [
    "package.json",
    "scripts/verify-local.mjs",
    "docs/project/workspace-ux-foundation-status.md",
    "docs/verification/workspace-ux-foundation-manifest.json",
    "scripts/check-workspace-ux-preflight.mjs",
    "scripts/check-workspace-ux-go-no-go.mjs",
    "scripts/lib/workspace-ux-foundation-utils.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/commands.txt`,
    `docs/verification/issues/issue-${issue}/command-output-map.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    "docs/verification/workspace-ux-foundation-manifest.json"
  ],
  limitations: ["Issue 704 intentionally leaves the Milestone A GO/NO-GO status as not_ready."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkManifestContract() {
  const manifest = fileIncludes("docs/verification/workspace-ux-foundation-manifest.json", [
    `"repositoryTruthSource": "${workspaceUxRequiredManifestFlags.repositoryTruthSource}"`,
    ...Object.keys(workspaceUxRequiredManifestFlags)
      .filter((key) => key !== "repositoryTruthSource")
      .map((key) => `"${key}":`),
    `"assignmentSetContractStatus": "${workspaceUxRequiredManifestFlags.assignmentSetContractStatus}"`,
    `"nurseProfileBuilderStatus": "${workspaceUxRequiredManifestFlags.nurseProfileBuilderStatus}"`,
    `"roomLoadEditorStatus": "${workspaceUxRequiredManifestFlags.roomLoadEditorStatus}"`,
    `"simulationReviewStatus": "${workspaceUxRequiredManifestFlags.simulationReviewStatus}"`,
    `"optimizerStatus": "${workspaceUxRequiredManifestFlags.optimizerStatus}"`,
    `"reportsStatus": "${workspaceUxRequiredManifestFlags.reportsStatus}"`,
    `"goNoGoStatus":`
  ]);
  return { passed: manifest.passed, results: [manifest] };
}

function checkRootScriptWiring() {
  const packageJson = fileIncludes("package.json", Object.keys(workspaceUxRootScripts).map((script) => `"${script}"`));
  const verifyLocal = fileIncludes("scripts/verify-local.mjs", [
    "workspaceUxFoundationCommands",
    ...Object.keys(workspaceUxRootScripts).map((script) => `npm run ${script}`)
  ]);
  return { passed: packageJson.passed && verifyLocal.passed, results: [packageJson, verifyLocal] };
}

function checkSourceRegressionWiring() {
  const packageJson = fileIncludes("package.json", [
    "check:active-floorplan-workflow-go-no-go",
    "check:door-authoring-browser-regression",
    "check:split-room-browser-regression"
  ]);
  const verifyLocal = fileIncludes("scripts/verify-local.mjs", [
    "activeFloorplanWorkflowCommands",
    "doorAuthoringCrashHardeningCommands",
    "splitRoomAuthoringCommands"
  ]);
  return {
    passed: packageJson.passed && verifyLocal.passed,
    results: [packageJson, verifyLocal]
  };
}

function checkScopeBoundary() {
  const manifest = fileIncludes("docs/verification/workspace-ux-foundation-manifest.json", [
    "\"assignmentSetContractStatus\": \"not_started\"",
    "\"nurseProfileBuilderStatus\": \"not_started\"",
    "\"roomLoadEditorStatus\": \"not_started\"",
    "\"simulationReviewStatus\": \"gated\"",
    "\"optimizerStatus\": \"not_started\"",
    "\"reportsStatus\": \"gated\"",
    "\"assignmentRecommendationStatus\": \"not_started\"",
    "\"clinicalSafetyScoringStatus\": \"not_started\"",
    "\"staffingComplianceStatus\": \"not_started\"",
    "\"patientOutcomePredictionStatus\": \"not_started\""
  ]);
  const statusDoc = fileIncludes("docs/project/workspace-ux-foundation-status.md", [
    "Not implemented in Milestone A",
    "Durable assignment sets",
    "Nurse profile builder",
    "Room load editor",
    "Burden scoring",
    "Scenario simulation",
    "Optimizer",
    "Management reports"
  ]);
  return {
    passed: manifest.passed && statusDoc.passed,
    results: [manifest, statusDoc]
  };
}
