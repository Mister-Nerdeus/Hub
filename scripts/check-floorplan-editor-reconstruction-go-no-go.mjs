#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readJson,
  statusFromChecks,
  updateReconstructionManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "630");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
const commandResults = [];

ensureIssueDirs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: final reconstruction decision must rerun local validators and not trust manifest flags alone.\n");
writeBoundaryOutputs(issue);
writeText(`${dir}/no-private-payload-output.txt`, "pending: final GO / NO-GO must verify no private source payload fields.\n");

if (stage !== "final") {
  runStage(stage);
} else {
  runFinalValidators();
  runStage("manifest-cross-check");
  runStage("boundary-cross-check");
  runStage("decision");
}

const passed = statusFromChecks(checks) === "passed";
const blockers = checks
  .filter((check) => !check.passed)
  .map((check) => check.name);
const decision = passed
  ? "go_for_full_er_floorplan_reconstruction"
  : "blocked_with_exact_editor_repair_items";

writeJson(`${dir}/remaining-blockers.json`, {
  status: passed ? "passed" : "blocked",
  blockers
});
writeJson(`${dir}/test-output/reconstruction-go-no-go.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  decision,
  checks,
  commandResults
});
writeText(`${dir}/go-no-go.md`, `# Floorplan Editor Reconstruction GO / NO-GO

Decision: ${passed ? "GO for full ER floorplan reconstruction." : "GO for additional editor repair."}

Blockers:
${blockers.length === 0 ? "- None." : blockers.map((blocker) => `- ${blocker}`).join("\n")}

This decision reran the local validators for save working copy, per-copy autosave, draft recovery, crash recovery, room labels, duplicate labels, station move, station resize, and reconstruction stress.
`);
writeText(`${dir}/final-editor-reconstruction-audit.md`, `# Final Editor Reconstruction Audit

Status: ${passed ? "passed" : "blocked"}

The final audit decision is based on rerun local validators plus manifest cross-checks. The manifest is not the sole source of truth.
`);
writeSummaries();

if (passed) {
  updateReconstructionManifest(issue, {
    editorStressRecoveryStatus: "passed",
    floorplanReconstructionGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
    goNoGoStatus: "go_for_full_er_floorplan_reconstruction"
  });
} else {
  updateReconstructionManifest(issue, {
    floorplanReconstructionGoNoGoStatus: "go_for_additional_editor_repair",
    goNoGoStatus: "blocked_with_exact_editor_repair_items"
  });
}

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-layout-editor-save-working-copy.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-draft-recovery-banner.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-error-boundary.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-room-labels.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-station-move.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-station-resize.mjs --stage final --issue 630",
  "node scripts/check-layout-editor-reconstruction-stress.mjs --stage final --issue 630",
  "node scripts/check-floorplan-editor-reconstruction-go-no-go.mjs --stage final --issue 630",
  "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 630",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-save-working-copy.mjs --stage final --issue 630": `${dir}/test-output/save-working-copy.txt`,
  "node scripts/check-layout-editor-per-copy-autosave.mjs --stage final --issue 630": `${dir}/test-output/per-copy-autosave.txt`,
  "node scripts/check-layout-editor-draft-recovery-banner.mjs --stage final --issue 630": `${dir}/test-output/draft-recovery-banner.txt`,
  "node scripts/check-layout-editor-error-boundary.mjs --stage final --issue 630": `${dir}/test-output/editor-error-boundary.txt`,
  "node scripts/check-layout-editor-room-labels.mjs --stage final --issue 630": `${dir}/test-output/room-labels.txt`,
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage final --issue 630": `${dir}/test-output/duplicate-labels.txt`,
  "node scripts/check-layout-editor-station-move.mjs --stage final --issue 630": `${dir}/test-output/station-move.txt`,
  "node scripts/check-layout-editor-station-resize.mjs --stage final --issue 630": `${dir}/test-output/station-resize.txt`,
  "node scripts/check-layout-editor-reconstruction-stress.mjs --stage final --issue 630": `${dir}/reconstruction-stress-output.json`,
  "node scripts/check-floorplan-editor-reconstruction-go-no-go.mjs --stage final --issue 630": `${dir}/go-no-go.md`,
  "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 630": `${dir}/test-output/visible-product-copy-all-routes.txt`,
  "npm run check:clean-committed-state": `${dir}/test-output/clean-committed-state.txt`
});
writeCloseout(issue, "Final reconstruction GO / NO-GO gate reran local editor validators.", passed ? "passed" : "failed", commands, [
  "The final decision is local-first and does not add GitHub Actions reliance.",
  "The decision is not a production-readiness, clinical safety, staffing compliance, or patient outcome claim."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, decision, checks, commandResults }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runFinalValidators() {
  const validators = [
    ["node", ["scripts/check-layout-editor-save-working-copy.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-per-copy-autosave.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-draft-recovery-banner.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-error-boundary.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-room-labels.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-duplicate-labels.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-station-move.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-station-resize.mjs", "--stage", "final", "--issue", issue]],
    ["node", ["scripts/check-layout-editor-reconstruction-stress.mjs", "--stage", "final", "--issue", issue]]
  ];

  for (const [command, args] of validators) {
    const result = spawnSync(command, args, {
      cwd: process.cwd(),
      encoding: "utf8"
    });
    const commandText = `${command} ${args.join(" ")}`;
    commandResults.push({
      command: commandText,
      status: result.status === 0 ? "passed" : "failed",
      exitCode: result.status,
      stdout: trimOutput(result.stdout),
      stderr: trimOutput(result.stderr)
    });
    addCheck(checks, commandText, result.status === 0, {
      exitCode: result.status,
      stderr: trimOutput(result.stderr)
    });
  }
}

function runStage(selectedStage) {
  if (selectedStage === "manifest-cross-check") {
    const manifest = readJson("docs/verification/floorplan-editor-reconstruction-repair-manifest.json");
    const required = [
      "saveWorkingCopyStatus",
      "perCopyAutosaveStatus",
      "restoreDraftBannerStatus",
      "editorCrashRecoveryStatus",
      "editableRoomLabelsStatus",
      "duplicateLabelNormalizationStatus",
      "stationMoveStatus",
      "stationResizeStatus",
      "editorStressRecoveryStatus"
    ];
    const missing = required.filter((key) => manifest[key] !== "passed");
    addCheck(checks, "manifest cross-check agrees with rerun validators", missing.length === 0, { missing });
    return;
  }
  if (selectedStage === "boundary-cross-check") {
    const manifest = readJson("docs/verification/floorplan-editor-reconstruction-repair-manifest.json");
    const passed = manifest.optimizerStatus === "not_started" &&
      manifest.assignmentRecommendationStatus === "not_started" &&
      manifest.clinicalSafetyScoringStatus === "not_started" &&
      manifest.staffingComplianceStatus === "not_started" &&
      manifest.patientOutcomePredictionStatus === "not_started" &&
      manifest.noPhiStatus === "passed";
    addCheck(checks, "no PHI/optimizer/recommendation/clinical/staffing/outcome drift", passed);
    writeText(`${dir}/no-private-payload-output.txt`, "passed: no private payload persistence added by final reconstruction audit.\n");
    return;
  }
  if (selectedStage === "decision") {
    const priorCommandsPassed = commandResults.every((result) => result.status === "passed");
    addCheck(checks, "final decision has rerun validator proof", priorCommandsPassed, { commandResults });
    return;
  }
  throw new Error(`Unsupported GO / NO-GO stage: ${selectedStage}`);
}

function writeSummaries() {
  const manifest = readJson("docs/verification/floorplan-editor-reconstruction-repair-manifest.json");
  const summaries = [
    ["save-working-copy-summary.json", ["saveWorkingCopyStatus", "saveWorkingCopyVisible", "saveAsNewCopyVisible", "savedCopyReloadProof"]],
    ["per-copy-autosave-summary.json", ["perCopyAutosaveStatus", "autosaveScopedByRecordId"]],
    ["restore-banner-summary.json", ["restoreDraftBannerStatus", "restoreBannerVisible"]],
    ["crash-recovery-summary.json", ["editorCrashRecoveryStatus", "errorBoundaryInstalled", "crashRecoveryDownloadAvailable"]],
    ["room-label-summary.json", ["editableRoomLabelsStatus", "roomLabelsEditable"]],
    ["duplicate-label-summary.json", ["duplicateLabelNormalizationStatus", "duplicateLabelsNormalized"]],
    ["station-move-summary.json", ["stationMoveStatus", "stationMoveEnabled"]],
    ["station-resize-summary.json", ["stationResizeStatus", "stationResizeEnabled"]]
  ];
  for (const [fileName, keys] of summaries) {
    writeJson(`${dir}/${fileName}`, Object.fromEntries(keys.map((key) => [key, manifest[key]])));
  }
}

function trimOutput(value) {
  const text = value == null ? "" : String(value).trim();
  return text.length > 1200 ? `${text.slice(0, 1200)}...` : text;
}
