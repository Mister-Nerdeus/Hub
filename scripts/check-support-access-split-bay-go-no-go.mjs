#!/usr/bin/env node
import {
  addCheck,
  authoringReadinessManifestPath,
  ensureIssueDirs,
  hasFlag,
  issueDir,
  loadAuthoringReadinessManifest,
  readArg,
  statusFromChecks,
  updateAuthoringReadinessManifest,
  writeBoundaryOutputs,
  writeCommands,
  writeIssueResult,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/editor-reconstruction-authoring-readiness-utils.mjs";

const issue = readArg("--issue", "668");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
if (stage !== "final") throw new Error(`Unsupported issue 668 stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: full floorplan reconstruction remains NO-GO until runtime, saved-copy, support-access, split-bay, visual, and non-PHI proofs all pass.\n"
);

const manifest = loadAuthoringReadinessManifest(issue);
const requiredStatusChecks = [
  ["rootScriptWiringStatus", "passed"],
  ["blockerReportingStatus", "passed"],
  ["manualChecklistHardeningStatus", "passed"],
  ["freshVsExistingRuntimeProofStatus", "passed"],
  ["existingLocalhostGoNoGoStatus", "go_for_editable_saved_copy_persistence_proof"],
  ["editableSavedCopyEntryStatus", "passed"],
  ["savedCopyPersistenceSmokeStatus", "passed"],
  ["savedCopyReadinessGoNoGoStatus", "go_for_support_access_and_split_bay_authoring"],
  ["supportAccessContractStatus", "passed"],
  ["providerPharmacyAccessUxStatus", "passed"],
  ["roomDoorFeedbackStatus", "passed"],
  ["splitBayOverlayContractStatus", "passed"],
  ["splitBayAuthoringUiStatus", "passed"],
  ["splitBayRendererStatus", "passed"],
  ["canonicalSplitBayBridgeStatus", "passed"],
  ["splitBayPersistenceStatus", "passed"],
  ["providerSplitBayVisualReconstructionStatus", "passed"]
];
const requiredBooleanFields = [
  "rootScripts641To650Present",
  "verifyLocalIncludes641To650",
  "rootScriptFailureListedAsBlocker",
  "verifyLocalFailureListedAsBlocker",
  "manualChecklistCannotAutoPass",
  "manualChecklistRequiresHumanOrBrowserProof",
  "freshRuntimeProofSeparated",
  "existingLocalhostProofSeparated",
  "freshRuntimeCannotOverrideExistingFailure",
  "localhost5180RuntimeProofPassed",
  "canonicalDefaultReadOnlyProof",
  "editableSavedCopyOpened",
  "editableSavedCopyRecordIdCaptured",
  "saveWorkingCopyEnabledForSavedCopy",
  "roomMovePersisted",
  "doorChangePersisted",
  "sameSavedRecordReloaded",
  "exportJsonBackupMatched",
  "supportAccessPointContractSupported",
  "providerPharmacyAccessPointsSupported",
  "roomDoorAddFeedbackSupported",
  "editableSplitBayOverlaySupported",
  "splitBayAuthoringUiSupported",
  "splitBayDiagonalRendererSupported",
  "canonicalSplitBayBridgeSupported",
  "splitBaySaveReloadExportProof",
  "providerPharmacyVisualProof",
  "splitBayVisualProof"
];
const boundaryStatusChecks = [
  ["collaborationStatus", "not_started"],
  ["simulationV0Status", "internal_dry_run_only"],
  ["fullFutureSimulationEventModelStatus", "dormant"],
  ["optimizerStatus", "not_started"],
  ["assignmentRecommendationStatus", "not_started"],
  ["clinicalSafetyScoringStatus", "not_started"],
  ["staffingComplianceStatus", "not_started"],
  ["patientOutcomePredictionStatus", "not_started"],
  ["promotionStatus", "blocked"],
  ["noPhiStatus", "passed"]
];

for (const [field, expected] of requiredStatusChecks) {
  const passed = manifest[field] === expected;
  addCheck(checks, `${field} is ${expected}`, passed, manifest[field]);
  if (!passed) blockers.push(`${field} expected ${expected}; actual ${manifest[field]}`);
}
for (const field of requiredBooleanFields) {
  const passed = manifest[field] === true;
  addCheck(checks, `${field} is true`, passed, manifest[field]);
  if (!passed) blockers.push(`${field} must be true`);
}
for (const [field, expected] of boundaryStatusChecks) {
  const passed = manifest[field] === expected;
  addCheck(checks, `${field} remains ${expected}`, passed, manifest[field]);
  if (!passed) blockers.push(`${field} expected ${expected}; actual ${manifest[field]}`);
}

const passed = statusFromChecks(checks) === "passed" && blockers.length === 0;
const finalStatus = passed ? "go_for_full_er_floorplan_reconstruction" : "no_go_with_exact_blockers";
const updatedManifest = updateAuthoringReadinessManifest(issue, {
  floorplanReconstructionGoNoGoStatus: finalStatus,
  reconstructionStatus: finalStatus,
  goNoGoStatus: finalStatus
});

writeText("docs/project/support-access-split-bay-authoring-status.md", [
  "# Support Access and Split-Bay Authoring Status",
  "",
  `Decision: ${finalStatus}`,
  "",
  "## Required Proofs",
  ...requiredStatusChecks.map(([field, expected]) => `- ${field}: expected ${expected}; actual ${manifest[field]}`),
  "",
  "## Remaining Blockers",
  ...(blockers.length === 0 ? ["- None"] : blockers.map((blocker) => `- ${blocker}`)),
  "",
  "## Boundaries",
  "- No collaboration, WebSockets, live sessions, optimizer behavior, assignment recommendations, staffing advice, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI, EHR integration, or production-readiness claims were added."
].join("\n") + "\n");

writeJson(`${dir}/support-access-split-bay-go-no-go-output.json`, {
  status: passed ? "passed" : "failed",
  finalStatus,
  blockers,
  manifest: updatedManifest
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-saved-copy-readiness-go-no-go.mjs --stage final --issue 658",
  "node scripts/check-support-access-point-contract.mjs --stage final --issue 668",
  "node scripts/check-provider-pharmacy-access-ux.mjs --stage final --issue 668",
  "node scripts/check-room-door-add-feedback.mjs --stage final --issue 668",
  "node scripts/check-editable-split-bay-overlay-contract.mjs --stage final --issue 668",
  "node scripts/check-split-bay-authoring-ui.mjs --stage final --issue 668",
  "node scripts/check-split-bay-renderer.mjs --stage final --issue 668",
  "node scripts/check-canonical-split-bay-editable-bridge.mjs --stage final --issue 668",
  "node scripts/check-split-bay-save-reload-export.mjs --stage final --issue 668",
  "node scripts/check-provider-split-bay-visual-reconstruction.mjs --stage final --issue 668",
  "node scripts/check-support-access-split-bay-go-no-go.mjs --stage final --issue 668",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands);
writeIssueResult({
  issue,
  scriptName: "check-support-access-split-bay-go-no-go",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands,
  title: "Floorplan reconstruction GO / NO-GO requires Issues 651-667 plus boundary and non-PHI proof.",
  limitations: [
    passed
      ? "Full reconstruction may begin; manual visual review remains part of final fidelity work."
      : `NO-GO blockers: ${blockers.join("; ")}`
  ]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, finalStatus, blockers, manifestPath: authoringReadinessManifestPath }, null, 2));
if (!passed && !allowPartial) process.exit(1);
