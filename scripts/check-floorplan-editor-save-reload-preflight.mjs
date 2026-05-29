#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readJson,
  readText,
  requiredSaveReloadManifest,
  saveReloadManifestPath,
  statusFromChecks,
  updateSaveReloadManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "631");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: previous reconstruction GO lacked same-record browser save/reload proof for changed room and door geometry.\n"
);
writeBoundaryOutputs(issue);

const stages = stage === "final"
  ? ["go-revocation", "manifest-contract", "root-script-wiring", "false-go-negative", "project-status-update"]
  : [stage];

for (const selectedStage of stages) {
  runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    preflightRevocationStatus: "passed",
    sourceGoNoGoRevoked: true,
    reconstructionStatus: "no_go_until_save_reload_truth_loop_passes",
    goNoGoStatus: "not_ready"
  });
}
writeJson(`${dir}/test-output/save-reload-preflight.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage go-revocation --allow-partial --issue 631",
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage manifest-contract --allow-partial --issue 631",
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage root-script-wiring --allow-partial --issue 631",
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage false-go-negative --allow-partial --issue 631",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage go-revocation --allow-partial --issue 631": `${dir}/go-revocation-output.json`,
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage manifest-contract --allow-partial --issue 631": `${dir}/manifest-contract-output.json`,
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage root-script-wiring --allow-partial --issue 631": `${dir}/root-script-wiring-output.json`,
  "node scripts/check-floorplan-editor-save-reload-preflight.mjs --stage false-go-negative --allow-partial --issue 631": `${dir}/false-go-negative-output.json`
});
writeCloseout(issue, "Previous reconstruction GO is revoked until same-record save/reload proof passes.", passed ? "passed" : "failed", commands, [
  "This issue is preflight only and intentionally performs no product feature work.",
  "Issues 632-640 remain missing until their local browser and audit gates are implemented."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  if (selectedStage === "go-revocation") {
    const manifest = readJson(saveReloadManifestPath);
    const previous = readJson("docs/verification/floorplan-editor-reconstruction-repair-manifest.json");
    const statusDoc = readText("docs/project/floorplan-editor-reconstruction-repair-status.md");
    const passed =
      previous.floorplanReconstructionGoNoGoStatus === "go_for_full_er_floorplan_reconstruction" &&
      manifest.sourceGoNoGoRevoked === true &&
      manifest.reconstructionStatus === "no_go_until_save_reload_truth_loop_passes" &&
      statusDoc.includes("REVOKED") &&
      statusDoc.includes("NO-GO");
    addCheck(checks, "previous reconstruction GO is explicitly revoked", passed, {
      sourceGoNoGoStatus: previous.floorplanReconstructionGoNoGoStatus,
      sourceGoNoGoRevoked: manifest.sourceGoNoGoRevoked,
      reconstructionStatus: manifest.reconstructionStatus
    });
    writeJson(`${dir}/go-revocation-output.json`, {
      status: passed ? "passed" : "failed",
      sourceGoNoGoStatus: previous.floorplanReconstructionGoNoGoStatus,
      sourceGoNoGoRevoked: manifest.sourceGoNoGoRevoked,
      reconstructionStatus: manifest.reconstructionStatus,
      revocationReason: manifest.revocationReason
    });
    return;
  }

  if (selectedStage === "manifest-contract") {
    const manifest = readJson(saveReloadManifestPath);
    const missing = Object.keys(requiredSaveReloadManifest).filter((key) => !Object.hasOwn(manifest, key));
    const mismatched = [
      ["manifestVersion", "1.0.0"],
      ["batch", "631-640"],
      ["sourceBatch", "621-630"],
      ["sourceGoNoGoRevoked", true],
      ["saveReloadGoNoGoStatus", "not_ready"],
      ["reconstructionStatus", "no_go_until_save_reload_truth_loop_passes"],
      ["collaborationStatus", "not_started"],
      ["optimizerStatus", "not_started"],
      ["assignmentRecommendationStatus", "not_started"],
      ["clinicalSafetyScoringStatus", "not_started"],
      ["staffingComplianceStatus", "not_started"],
      ["patientOutcomePredictionStatus", "not_started"],
      ["noPhiStatus", "passed"]
    ].filter(([key, expected]) => manifest[key] !== expected);
    const passed = missing.length === 0 && mismatched.length === 0;
    addCheck(checks, "save/reload manifest contract is present and fail-closed", passed, { missing, mismatched });
    writeJson(`${dir}/manifest-contract-output.json`, {
      status: passed ? "passed" : "failed",
      missing,
      mismatched,
      manifestPath: saveReloadManifestPath
    });
    return;
  }

  if (selectedStage === "root-script-wiring") {
    const packageJson = readJson("package.json");
    const verifyLocal = readText("scripts/verify-local.mjs");
    const requiredScripts = [
      "check:floorplan-editor-save-reload-preflight",
      "check:layout-editor-save-failure-repro",
      "check:layout-editor-active-copy-identity",
      "check:layout-editor-save-pipeline-trace",
      "check:layout-editor-room-move-persistence",
      "check:layout-editor-door-change-persistence",
      "check:layout-editor-local-draft-vs-named-save",
      "check:layout-editor-truthful-save-status",
      "check:layout-editor-browser-reload-regression",
      "check:floorplan-editor-save-reload-go-no-go"
    ];
    const missing = requiredScripts.filter((scriptName) => packageJson.scripts?.[scriptName] == null);
    const missingVerify = requiredScripts.filter((scriptName) => !verifyLocal.includes(`npm run ${scriptName}`));
    const passed = missing.length === 0 && missingVerify.length === 0;
    addCheck(checks, "root scripts and local verifier include Issues 631-640 gates", passed, { missing, missingVerify });
    writeJson(`${dir}/root-script-wiring-output.json`, {
      status: passed ? "passed" : "failed",
      requiredScripts,
      missing,
      missingVerify
    });
    return;
  }

  if (selectedStage === "false-go-negative") {
    const previous = readJson("docs/verification/floorplan-editor-reconstruction-repair-manifest.json");
    const manifest = readJson(saveReloadManifestPath);
    const sourceSaysGo = previous.goNoGoStatus === "go_for_full_er_floorplan_reconstruction";
    const browserProofMissing =
      manifest.greenPersistenceProof !== true ||
      manifest.roomMoveReloadProof !== true ||
      manifest.doorChangeReloadProof !== true ||
      manifest.sameRecordReloadProof !== true;
    const revoked = manifest.sourceGoNoGoRevoked === true &&
      manifest.reconstructionStatus === "no_go_until_save_reload_truth_loop_passes";
    const passed = sourceSaysGo && browserProofMissing && revoked;
    addCheck(checks, "manifest GO without browser save/reload proof is treated as false positive", passed, {
      sourceSaysGo,
      browserProofMissing,
      revoked
    });
    writeJson(`${dir}/false-go-negative-output.json`, {
      status: passed ? "passed" : "failed",
      sourceSaysGo,
      browserProofMissing,
      revoked,
      negativeFixture: "621-630 GO plus missing room/door/same-record browser reload proof"
    });
    return;
  }

  if (selectedStage === "project-status-update") {
    const statusDoc = readText("docs/project/floorplan-editor-reconstruction-repair-status.md");
    const passed =
      statusDoc.includes("Batch: 621-630") &&
      statusDoc.includes("REVOKED") &&
      statusDoc.includes("save/reload truth loop") &&
      statusDoc.includes("Issue 640");
    addCheck(checks, "project status records NO-GO until Issue 640", passed);
    writeJson(`${dir}/project-status-update-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }

  throw new Error(`Unsupported save/reload preflight stage: ${selectedStage}`);
}
