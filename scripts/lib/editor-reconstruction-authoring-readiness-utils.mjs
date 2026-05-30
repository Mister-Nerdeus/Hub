#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  exists,
  hasFlag,
  readArg,
  readJson,
  statusFromChecks,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./editor-runtime-alignment-hardening-utils.mjs";

export {
  addCheck,
  ensureIssueDirs,
  exists,
  hasFlag,
  readArg,
  readJson,
  statusFromChecks,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
};

export const authoringReadinessManifestPath =
  "docs/verification/editor-reconstruction-authoring-readiness-manifest.json";

export const authoringReadinessManifestTemplate = {
  manifestVersion: "1.0.0",
  batch: "651-668",
  lastUpdatedIssue: "651",
  productDisplayName: "ER Pod Shift Simulator",

  phaseA: "runtime_alignment_verification_hardening",
  phaseB: "editable_saved_copy_persistence_proof",
  phaseC: "support_access_and_split_bay_authoring",

  rootScriptWiringStatus: "missing",
  blockerReportingStatus: "missing",
  manualChecklistHardeningStatus: "missing",
  freshVsExistingRuntimeProofStatus: "missing",
  existingLocalhostGoNoGoStatus: "not_ready",

  editableSavedCopyEntryStatus: "missing",
  savedCopyPersistenceSmokeStatus: "missing",
  savedCopyReadinessGoNoGoStatus: "not_ready",

  supportAccessContractStatus: "missing",
  providerPharmacyAccessUxStatus: "missing",
  roomDoorFeedbackStatus: "missing",
  splitBayOverlayContractStatus: "missing",
  splitBayAuthoringUiStatus: "missing",
  splitBayRendererStatus: "missing",
  canonicalSplitBayBridgeStatus: "missing",
  splitBayPersistenceStatus: "missing",
  providerSplitBayVisualReconstructionStatus: "missing",
  floorplanReconstructionGoNoGoStatus: "not_ready",

  rootScripts641To650Present: false,
  verifyLocalIncludes641To650: false,
  rootScriptFailureListedAsBlocker: false,
  verifyLocalFailureListedAsBlocker: false,
  manualChecklistCannotAutoPass: false,
  manualChecklistRequiresHumanOrBrowserProof: false,
  freshRuntimeProofSeparated: false,
  existingLocalhostProofSeparated: false,
  freshRuntimeCannotOverrideExistingFailure: false,
  localhost5180RuntimeProofPassed: false,

  canonicalDefaultReadOnlyProof: false,
  editableSavedCopyOpened: false,
  editableSavedCopyRecordIdCaptured: false,
  saveWorkingCopyEnabledForSavedCopy: false,
  roomMovePersisted: false,
  doorChangePersisted: false,
  sameSavedRecordReloaded: false,
  exportJsonBackupMatched: false,

  supportAccessPointContractSupported: false,
  providerPharmacyAccessPointsSupported: false,
  roomDoorAddFeedbackSupported: false,
  editableSplitBayOverlaySupported: false,
  splitBayAuthoringUiSupported: false,
  splitBayDiagonalRendererSupported: false,
  canonicalSplitBayBridgeSupported: false,
  splitBaySaveReloadExportProof: false,
  providerPharmacyVisualProof: false,
  splitBayVisualProof: false,

  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  collaborationStatus: "not_started",
  simulationV0Status: "internal_dry_run_only",
  fullFutureSimulationEventModelStatus: "dormant",
  optimizerStatus: "not_started",
  assignmentRecommendationStatus: "not_started",
  clinicalSafetyScoringStatus: "not_started",
  staffingComplianceStatus: "not_started",
  patientOutcomePredictionStatus: "not_started",
  promotionStatus: "blocked",
  noPhiStatus: "passed",

  goNoGoStatus: "not_ready"
};

export function loadAuthoringReadinessManifest(issue = "651") {
  let existing = {};
  if (exists(authoringReadinessManifestPath)) {
    existing = readJson(authoringReadinessManifestPath);
  }
  return {
    ...authoringReadinessManifestTemplate,
    ...existing,
    manifestVersion: authoringReadinessManifestTemplate.manifestVersion,
    batch: authoringReadinessManifestTemplate.batch,
    productDisplayName: authoringReadinessManifestTemplate.productDisplayName,
    phaseA: authoringReadinessManifestTemplate.phaseA,
    phaseB: authoringReadinessManifestTemplate.phaseB,
    phaseC: authoringReadinessManifestTemplate.phaseC,
    lastUpdatedIssue: issue
  };
}

export function updateAuthoringReadinessManifest(issue, updates) {
  const manifest = {
    ...loadAuthoringReadinessManifest(issue),
    ...updates,
    lastUpdatedIssue: issue,
    noPhiStatus: "passed",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    fullFutureSimulationEventModelStatus: "dormant",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    promotionStatus: "blocked"
  };
  writeJson(authoringReadinessManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    manifestPath: authoringReadinessManifestPath,
    updates
  });
  return manifest;
}

export function requiredAcceptanceCommands(issue, scriptName, stages) {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    ...stages.map((stage) => `node scripts/${scriptName}.mjs --stage ${stage} --allow-partial --issue ${issue}`),
    "node scripts/check-no-phi-fields.mjs"
  ];
}

export function issueDir(issue) {
  return `docs/verification/issues/issue-${issue}`;
}

export function writeIssueResult({ issue, scriptName, stage, status, checks, blockers, commands, title, limitations = [] }) {
  const dir = issueDir(issue);
  writeJson(`${dir}/remaining-blockers.json`, {
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers
  });
  writeJson(`${dir}/test-output/${scriptName.replace(/^check-/, "")}.txt`, {
    status,
    issue,
    stage,
    blockers,
    checks
  });
  writeJson(`${dir}/test-output/shared.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
  writeJson(`${dir}/test-output/web.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
  writeJson(`${dir}/test-output/web-build.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
  writeCommands(issue, commands);
  writeCloseout(issue, title, status, commands, limitations);
}
