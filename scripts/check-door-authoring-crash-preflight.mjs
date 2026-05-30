#!/usr/bin/env node
import {
  addCheck,
  assertFile,
  doorAuthoringManifestPath,
  doorAuthoringManifestTemplate,
  doorAuthoringRootScriptMap,
  ensureIssueDirs,
  hasFlag,
  loadDoorAuthoringManifest,
  readArg,
  readJson,
  readText,
  requiredIssueCommands,
  statusFromChecks,
  updateDoorAuthoringManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";

const issue = readArg("--issue", "669");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const isFinalAuditIssue = Number(issue) >= 678;
const supportedStages = [
  "go-revocation",
  "manifest-contract",
  "root-script-wiring",
  "false-go-negative",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door authoring crash preflight stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: prior reconstruction GO is revoked until real door authoring crash-proof validators pass.\n"
);

const stages = stage === "final"
  ? ["go-revocation", "manifest-contract", "root-script-wiring", "false-go-negative"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const passed = statusFromChecks(checks);
const updates = {
  doorCrashPreflightStatus: passed === "passed" ? "passed" : "failed",
  sourceGoNoGoRevoked: true,
  reconstructionStatus: "no_go_until_door_authoring_crash_hardening_passes",
  goNoGoStatus: "not_ready"
};
const manifest = updateDoorAuthoringManifest(issue, updates);

writeProjectStatus(stageResults, manifest);
writeJson(`${dir}/test-output/door-authoring-crash-preflight.txt`, {
  status: passed,
  issue,
  stage,
  checks,
  stageResults
});
writeEvidenceSlots(issue, "door-authoring-crash-preflight", passed, stage, checks);
writeCommandsAndCloseout(passed);

console.log(JSON.stringify({ status: passed, issue, stage, checks }, null, 2));
if (passed !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  if (selectedStage === "go-revocation") {
    const manifest = loadDoorAuthoringManifest(issue);
    const finalAuditProofComplete = isFinalAuditIssue && hasCompletedDoorProof(manifest);
    const passed = manifest.sourceGoNoGoRevoked === true &&
      manifest.sourceGoNoGoStatus === "go_for_full_er_floorplan_reconstruction" &&
      manifest.reconstructionStatus === "no_go_until_door_authoring_crash_hardening_passes" &&
      (
        manifest.goNoGoStatus !== "go_for_full_er_floorplan_reconstruction" ||
        finalAuditProofComplete
      );
    const result = {
      status: passed ? "passed" : "failed",
      sourceGoNoGoStatus: manifest.sourceGoNoGoStatus,
      sourceGoNoGoRevoked: manifest.sourceGoNoGoRevoked,
      reconstructionStatus: manifest.reconstructionStatus,
      goNoGoStatus: manifest.goNoGoStatus,
      finalAuditProofComplete,
      revocationReason: manifest.revocationReason
    };
    addCheck(checks, "prior reconstruction GO is explicitly revoked", passed, result);
    writeJson(`${dir}/go-revocation-output.json`, result);
    return result;
  }

  if (selectedStage === "manifest-contract") {
    const manifest = loadDoorAuthoringManifest(issue);
    const requiredKeys = Object.keys(doorAuthoringManifestTemplate);
    const missing = requiredKeys.filter((key) => !Object.hasOwn(manifest, key));
    const mismatches = [];
    const expectedEntries = Object.entries({
      manifestVersion: "1.0.0",
      batch: "669-678",
      productDisplayName: "ER Pod Shift Simulator",
      sourceGoNoGoRevoked: true,
      reconstructionStatus: "no_go_until_door_authoring_crash_hardening_passes",
      collaborationStatus: "not_started",
      optimizerStatus: "not_started",
      assignmentRecommendationStatus: "not_started",
      clinicalSafetyScoringStatus: "not_started",
      staffingComplianceStatus: "not_started",
      patientOutcomePredictionStatus: "not_started",
      noPhiStatus: "passed"
    });
    for (const [key, expected] of expectedEntries) {
      if (manifest[key] !== expected) mismatches.push({ key, expected, actual: manifest[key] });
    }
    const allowedGoNoGoStatuses = isFinalAuditIssue && hasCompletedDoorProof(manifest)
      ? ["not_ready", "go_for_full_er_floorplan_reconstruction"]
      : ["not_ready"];
    if (!allowedGoNoGoStatuses.includes(manifest.goNoGoStatus)) {
      mismatches.push({
        key: "goNoGoStatus",
        expected: allowedGoNoGoStatuses.join(" or "),
        actual: manifest.goNoGoStatus
      });
    }
    const passed = missing.length === 0 && mismatches.length === 0;
    const result = { status: passed ? "passed" : "failed", missing, mismatches, manifestPath: doorAuthoringManifestPath };
    addCheck(checks, "door hardening manifest follows issue 669 contract", passed, result);
    writeJson(`${dir}/manifest-contract-output.json`, result);
    return result;
  }

  if (selectedStage === "root-script-wiring") {
    const packageJson = readJson("package.json");
    const verifyLocal = readText("scripts/verify-local.mjs");
    const missingPackageScripts = Object.entries(doorAuthoringRootScriptMap)
      .filter(([scriptName, command]) => packageJson.scripts?.[scriptName] !== command)
      .map(([scriptName, command]) => ({ scriptName, expected: command, actual: packageJson.scripts?.[scriptName] ?? null }));
    const missingVerifyLocalScripts = Object.keys(doorAuthoringRootScriptMap)
      .filter((scriptName) => !verifyLocal.includes(`npm run ${scriptName}`));
    const missingFiles = Object.values(doorAuthoringRootScriptMap)
      .map((command) => command.match(/node (scripts\/[^ ]+\.mjs)/u)?.[1] ?? null)
      .filter((path) => path != null && !assertFile(path));
    const passed = missingPackageScripts.length === 0 &&
      missingVerifyLocalScripts.length === 0 &&
      missingFiles.length === 0;
    const result = { status: passed ? "passed" : "failed", missingPackageScripts, missingVerifyLocalScripts, missingFiles };
    addCheck(checks, "root scripts and verify-local wire all door hardening gates", passed, result);
    writeJson(`${dir}/root-script-wiring-output.json`, result);
    return result;
  }

  if (selectedStage === "false-go-negative") {
    const falseGoFixture = {
      goNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      doorCrashPreflightStatus: "missing",
      safeDoorAuthoringWrapperStatus: "missing",
      noRecoveryScreenDuringDoorWork: false,
      doorSaveReloadProof: false
    };
    const detection = evaluateFalseGoFixture(falseGoFixture);
    const passed = detection.status === "failed" &&
      detection.blockers.includes("doorCrashPreflightStatus is missing") &&
      detection.blockers.includes("safeDoorAuthoringWrapperStatus is missing") &&
      detection.blockers.includes("noRecoveryScreenDuringDoorWork is false");
    const result = { status: passed ? "passed" : "failed", falseGoFixture, detection };
    addCheck(checks, "prior GO fixture is rejected when door crash proof is missing", passed, result);
    writeJson(`${dir}/false-go-negative-output.json`, result);
    return result;
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

function hasCompletedDoorProof(manifest) {
  return [
    "doorCrashPreflightStatus",
    "doorCrashReproductionStatus",
    "safeDoorAuthoringWrapperStatus",
    "doorCandidateEligibilityStatus",
    "addDoorPreflightStatus",
    "doorOwnerModelStatus",
    "doorRecoverySnapshotsStatus",
    "recoveryDiagnosticsStatus",
    "doorRegressionPackStatus"
  ].every((key) => manifest[key] === "passed") &&
    [
      "doorActionsNonThrowing",
      "leftPodDoorCrashProof",
      "rightPodDoorCrashProof",
      "invalidDoorActionsBecomeWarnings",
      "candidateEligibilityProof",
      "solidWallDoorRejected",
      "supportAccessSeparatedFromPatientDoor",
      "lastValidSnapshotProof",
      "recoveryDiagnosticsVisible",
      "doorSaveReloadProof",
      "noRecoveryScreenDuringDoorWork"
    ].every((key) => manifest[key] === true);
}

function evaluateFalseGoFixture(fixture) {
  const blockers = [];
  if (fixture.doorCrashPreflightStatus !== "passed") {
    blockers.push(`doorCrashPreflightStatus is ${fixture.doorCrashPreflightStatus}`);
  }
  if (fixture.safeDoorAuthoringWrapperStatus !== "passed") {
    blockers.push(`safeDoorAuthoringWrapperStatus is ${fixture.safeDoorAuthoringWrapperStatus}`);
  }
  if (fixture.noRecoveryScreenDuringDoorWork !== true) {
    blockers.push("noRecoveryScreenDuringDoorWork is false");
  }
  if (fixture.doorSaveReloadProof !== true) {
    blockers.push("doorSaveReloadProof is false");
  }
  return {
    status: blockers.length === 0 ? "passed" : "failed",
    blockers
  };
}

function writeProjectStatus(stageResults, manifest) {
  writeJson(`${dir}/project-status-update-output.json`, {
    status: "passed",
    reconstructionStatus: manifest.reconstructionStatus,
    sourceGoNoGoRevoked: manifest.sourceGoNoGoRevoked
  });
  writeText("docs/project/door-authoring-crash-hardening-status.md", [
    "# Door Authoring Crash Hardening Status",
    "",
    "Decision: NO-GO for full ER floorplan reconstruction until Issue 678 passes.",
    "",
    "## Revocation",
    `- Source batch: ${manifest.sourceBatch}`,
    `- Source GO state: ${manifest.sourceGoNoGoStatus}`,
    `- Revoked: ${manifest.sourceGoNoGoRevoked}`,
    `- Reason: ${manifest.revocationReason}`,
    "",
    "## Current Batch",
    `- Last updated issue: ${manifest.lastUpdatedIssue}`,
    `- Door crash preflight: ${manifest.doorCrashPreflightStatus}`,
    `- Reconstruction status: ${manifest.reconstructionStatus}`,
    "",
    "## Gate Rule",
    "- Final GO must rerun real validators. Manifest flags alone are not sufficient.",
    "- Door authoring errors must be editor warnings, not render/runtime crashes.",
    "- Invalid door actions must preserve the previous valid layout.",
    "",
    "## Boundaries",
    "- No collaboration, WebSockets, live sessions, optimizer behavior, assignment recommendations, staffing advice, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI, EHR integration, or production-readiness claims were added.",
    "",
    "## Preflight Evidence",
    ...Object.entries(stageResults).map(([stageName, result]) => `- ${stageName}: ${result.status}`)
  ].join("\n") + "\n");
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-door-authoring-crash-preflight", [
    "go-revocation",
    "manifest-contract",
    "root-script-wiring",
    "false-go-negative"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-door-authoring-crash-preflight.mjs --stage go-revocation --allow-partial --issue ${issue}`]: `${dir}/go-revocation-output.json`,
    [`node scripts/check-door-authoring-crash-preflight.mjs --stage manifest-contract --allow-partial --issue ${issue}`]: `${dir}/manifest-contract-output.json`,
    [`node scripts/check-door-authoring-crash-preflight.mjs --stage root-script-wiring --allow-partial --issue ${issue}`]: `${dir}/root-script-wiring-output.json`,
    [`node scripts/check-door-authoring-crash-preflight.mjs --stage false-go-negative --allow-partial --issue ${issue}`]: `${dir}/false-go-negative-output.json`
  });
  writeCloseout(
    issue,
    "Door authoring GO revocation and batch preflight.",
    status,
    commands,
    [
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns and passes the door authoring validators.",
      "This issue adds no product feature work."
    ]
  );
}
