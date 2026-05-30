#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  issueDir,
  readArg,
  readJson,
  statusFromChecks,
  updateAuthoringReadinessManifest,
  writeBoundaryOutputs,
  writeIssueResult,
  writeText,
  writeTextIfMissing
} from "./lib/editor-reconstruction-authoring-readiness-utils.mjs";
import {
  alignmentManifestPath,
  savedCopyPersistenceManifestPath,
  updateAlignmentManifest,
  updateSavedCopyPersistenceManifest
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "658");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");

if (stage !== "final") {
  throw new Error(`Unsupported issue 658 stage: ${stage}`);
}

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: saved-copy readiness remains NO-GO until runtime alignment, editable saved-copy entry, and saved-copy persistence proof all pass.\n"
);

const alignmentManifest = readJson(alignmentManifestPath);
const savedManifest = readJson(savedCopyPersistenceManifestPath);

const issue655Go = alignmentManifest.existingLocalhostGoNoGoStatus === "go_for_editable_saved_copy_persistence_proof" &&
  alignmentManifest.localhost5180RuntimeProofPassed === true;
const issue656Passed = savedManifest.editableSavedCopyEntryStatus === "passed" &&
  savedManifest.canonicalDefaultReadOnlyProof === true &&
  savedManifest.editableSavedCopyOpened === true &&
  savedManifest.editableSavedCopyRecordIdCaptured === true &&
  savedManifest.saveWorkingCopyEnabledForSavedCopy === true;
const issue657Passed = savedManifest.savedCopyPersistenceSmokeStatus === "passed" &&
  savedManifest.roomMovePersisted === true &&
  savedManifest.doorChangePersisted === true &&
  savedManifest.sameSavedRecordReloaded === true &&
  savedManifest.exportJsonBackupMatched === true;

if (!issue655Go) blockers.push("Issue 655 must be GO for editable saved-copy persistence proof.");
if (!issue656Passed) blockers.push("Issue 656 editable saved-copy entry proof is incomplete.");
if (!issue657Passed) blockers.push("Issue 657 editable saved-copy persistence proof is incomplete.");

addCheck(checks, "Issue 655 runtime gate advances only to saved-copy persistence proof", issue655Go);
addCheck(checks, "Issue 656 editable saved-copy entry proof passed", issue656Passed);
addCheck(checks, "Issue 657 editable saved-copy persistence proof passed", issue657Passed);

const passed = statusFromChecks(checks) === "passed" && blockers.length === 0;
const readinessStatus = passed
  ? "go_for_support_access_and_split_bay_authoring"
  : "no_go_with_exact_blockers";
const reconstructionStatus = passed
  ? "go_for_support_access_and_split_bay_authoring"
  : "no_go_until_runtime_alignment_and_saved_copy_persistence_pass";

updateSavedCopyPersistenceManifest(issue, {
  sourceGoNoGoStatus: alignmentManifest.existingLocalhostGoNoGoStatus,
  savedCopyReadinessGoNoGoStatus: readinessStatus,
  editorReconstructionReadinessGoNoGoStatus: readinessStatus,
  reconstructionReadinessGoNoGoStatus: readinessStatus,
  reconstructionStatus,
  goNoGoStatus: readinessStatus
});

updateAlignmentManifest(issue, {
  editableSavedCopyEntryStatus: savedManifest.editableSavedCopyEntryStatus,
  savedCopyPersistenceSmokeStatus: savedManifest.savedCopyPersistenceSmokeStatus,
  savedCopyReadinessGoNoGoStatus: readinessStatus,
  editorReconstructionReadinessGoNoGoStatus: readinessStatus,
  reconstructionReadinessGoNoGoStatus: readinessStatus,
  reconstructionStatus,
  goNoGoStatus: readinessStatus,
  canonicalDefaultReadOnlyProof: savedManifest.canonicalDefaultReadOnlyProof,
  editableSavedCopyOpened: savedManifest.editableSavedCopyOpened,
  editableSavedCopyRecordIdCaptured: savedManifest.editableSavedCopyRecordIdCaptured,
  saveWorkingCopyEnabledForSavedCopy: savedManifest.saveWorkingCopyEnabledForSavedCopy,
  roomMovePersisted: savedManifest.roomMovePersisted,
  doorChangePersisted: savedManifest.doorChangePersisted,
  sameSavedRecordReloaded: savedManifest.sameSavedRecordReloaded,
  exportJsonBackupMatched: savedManifest.exportJsonBackupMatched
});

updateAuthoringReadinessManifest(issue, {
  rootScriptWiringStatus: alignmentManifest.rootScriptWiringStatus,
  blockerReportingStatus: alignmentManifest.blockerReportingStatus,
  manualChecklistHardeningStatus: alignmentManifest.manualChecklistHardeningStatus,
  freshVsExistingRuntimeProofStatus: alignmentManifest.freshVsExistingRuntimeProofStatus,
  existingLocalhostGoNoGoStatus: alignmentManifest.existingLocalhostGoNoGoStatus,
  rootScripts641To650Present: alignmentManifest.rootScripts641To650Present,
  verifyLocalIncludes641To650: alignmentManifest.verifyLocalIncludes641To650,
  rootScriptFailureListedAsBlocker: alignmentManifest.rootScriptFailureListedAsBlocker,
  verifyLocalFailureListedAsBlocker: alignmentManifest.verifyLocalFailureListedAsBlocker,
  manualChecklistCannotAutoPass: alignmentManifest.manualChecklistCannotAutoPass,
  manualChecklistRequiresHumanOrBrowserProof: alignmentManifest.manualChecklistRequiresHumanOrBrowserProof,
  freshRuntimeProofSeparated: alignmentManifest.freshRuntimeProofSeparated,
  existingLocalhostProofSeparated: alignmentManifest.existingLocalhostProofSeparated,
  freshRuntimeCannotOverrideExistingFailure: alignmentManifest.freshRuntimeCannotOverrideExistingFailure,
  localhost5180RuntimeProofPassed: alignmentManifest.localhost5180RuntimeProofPassed,
  editableSavedCopyEntryStatus: savedManifest.editableSavedCopyEntryStatus,
  savedCopyPersistenceSmokeStatus: savedManifest.savedCopyPersistenceSmokeStatus,
  savedCopyReadinessGoNoGoStatus: readinessStatus,
  canonicalDefaultReadOnlyProof: savedManifest.canonicalDefaultReadOnlyProof,
  editableSavedCopyOpened: savedManifest.editableSavedCopyOpened,
  editableSavedCopyRecordIdCaptured: savedManifest.editableSavedCopyRecordIdCaptured,
  saveWorkingCopyEnabledForSavedCopy: savedManifest.saveWorkingCopyEnabledForSavedCopy,
  roomMovePersisted: savedManifest.roomMovePersisted,
  doorChangePersisted: savedManifest.doorChangePersisted,
  sameSavedRecordReloaded: savedManifest.sameSavedRecordReloaded,
  exportJsonBackupMatched: savedManifest.exportJsonBackupMatched,
  reconstructionStatus,
  goNoGoStatus: readinessStatus
});

writeText("docs/project/editor-saved-copy-readiness-status.md", [
  "# Editor Saved-Copy Readiness Status",
  "",
  `Decision: ${readinessStatus}`,
  "",
  "## Required Inputs",
  `- Issue 655 runtime alignment: ${issue655Go ? "passed" : "blocked"}`,
  `- Issue 656 editable saved-copy entry: ${issue656Passed ? "passed" : "blocked"}`,
  `- Issue 657 saved-copy persistence: ${issue657Passed ? "passed" : "blocked"}`,
  "",
  "## Remaining Blockers",
  ...(blockers.length === 0 ? ["- None"] : blockers.map((blocker) => `- ${blocker}`)),
  "",
  "## Boundary",
  "- Full floorplan reconstruction remains blocked until support access and split-bay authoring pass Issue 668."
].join("\n") + "\n");

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-runtime-alignment-go-no-go.mjs --stage final --issue 655",
  "node scripts/check-editor-saved-copy-entry-flow.mjs --stage final --issue 656",
  "node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage final --issue 657",
  `node scripts/check-editor-saved-copy-readiness-go-no-go.mjs --stage final --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

writeIssueResult({
  issue,
  scriptName: "check-editor-saved-copy-readiness-go-no-go",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands,
  title: "Saved-copy reconstruction readiness GO / NO-GO gates support-access and split-bay authoring.",
  limitations: [
    passed
      ? "Full floorplan reconstruction remains blocked until Issue 668 passes."
      : `NO-GO blockers: ${blockers.join("; ")}`
  ]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, readinessStatus, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);
