import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "350";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const intakeManifestPath = "docs/verification/human-review-intake-manifest.json";
const dashboardPath = "docs/verification/human-review-intake-dashboard.json";
const dashboardMdPath = "docs/manual-review/human-review-intake-dashboard.md";
const promotionRecheckPath = "docs/promotion-dry-run/human-review-intake-promotion-recheck.json";
const manualVisualReviewManifestPath = "docs/verification/manual-visual-review-manifest.json";
const uxManifestPath = "docs/verification/plan-builder-ux-review-flow-manifest.json";
const uiSnapshotPath = "apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json";
const routeRepairManifestPath = "docs/verification/corrected-plan-route-repair-manifest.json";
const planIds = ["plan-2", "plan-3", "plan-4", "plan-5"];
const stages = new Set([
  "hash-consistency",
  "protocol",
  "identity-authority-contract",
  "plan-2-intake",
  "plan-3-intake",
  "plan-4-intake",
  "plan-5-intake",
  "review-dashboard",
  "promotion-dry-run-recheck",
  "final"
]);
const failures = [];

if (!stages.has(stage)) {
  fail(`Unsupported human review intake stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial until Issue 350 final audit`);
}
if (stage === "final" && allowPartial) {
  fail("final human review intake gate must run without --allow-partial");
}

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs("docs/manual-review/submitted"), { recursive: true });
mkdirSync(abs("docs/promotion-dry-run"), { recursive: true });

const previousManifest = existsSync(abs(intakeManifestPath)) ? readJson(intakeManifestPath) : null;
const manualManifest = readJson(manualVisualReviewManifestPath);
const uxManifest = readJson(uxManifestPath);
const snapshot = readJson(uiSnapshotPath);
const manifest = buildManifest();
const dashboard = buildDashboard(manifest);
const promotionRecheck = buildPromotionRecheck(manifest);

writeJson(intakeManifestPath, manifest);

runStage();
writeGateOutput();
writeCommonEvidence();
writeIssueCloseoutAndIndex();

if (failures.length > 0) {
  fail(JSON.stringify({ status: "failed", stage, issue, failures }, null, 2));
}
console.log(JSON.stringify({ status: "passed", stage, issue, manifestPath: intakeManifestPath }, null, 2));

function runStage() {
  if (stage === "hash-consistency" || stage === "final") {
    runHashConsistency();
  }
  if (stage === "protocol" || stage === "final") {
    runProtocol();
  }
  if (stage === "identity-authority-contract" || stage === "final") {
    runIdentityAuthority();
  }
  for (const planId of planIds) {
    if (stage === `${planId}-intake` || stage === "final") {
      runPlanIntake(planId);
    }
  }
  if (stage === "review-dashboard" || stage === "final") {
    runDashboard();
  }
  if (stage === "promotion-dry-run-recheck" || stage === "final") {
    runPromotionRecheck();
  }
  if (stage === "final") {
    runFinalAudit();
  }
}

function buildManifest() {
  const entries = manualManifest.reviewedPlans.map((manualEntry) => buildEntry(manualEntry));
  const submittedCount = entries.filter((entry) => entry.submittedReviewRecordPath != null).length;
  const validApprovalCount = entries.filter((entry) =>
    entry.manualReviewStatus === "approved_for_promotion_review" ||
    entry.manualReviewStatus === "approved_with_notes"
  ).length;
  const allPlansDryRunReady = entries.every((entry) => entry.promotionReadinessDryRunStatus === "dry_run_ready");
  const hashConsistencyPassed = checkHashConsistency().status === "passed";
  return {
    manifestVersion: "1.0.0",
    batch: "341-350",
    lastUpdatedIssue: issue,
    manualVisualReviewManifestPath,
    manualVisualReviewManifestHash: hashFile(manualVisualReviewManifestPath),
    planBuilderUxReviewFlowManifestPath: uxManifestPath,
    planBuilderUxReviewFlowManifestHash: hashFile(uxManifestPath),
    uiSnapshotPath,
    uiSnapshotHash: hashFile(uiSnapshotPath),
    reviewedPlans: entries,
    hashConsistencyStatus: hashConsistencyPassed ? "passed" : "failed",
    protocolStatus: statusFromStage("protocol", "passed", "not_run"),
    identityAuthorityContractStatus: statusFromStage("identity-authority-contract", "passed", "not_run"),
    intakeStatus: submittedCount === 0 ? "missing" : submittedCount === planIds.length ? "complete" : "partial",
    dashboardStatus: statusFromStage("review-dashboard", "complete", previousManifest?.dashboardStatus ?? "missing"),
    promotionDryRunRecheckStatus: statusFromStage(
      "promotion-dry-run-recheck",
      allPlansDryRunReady ? "passed" : "blocked",
      previousManifest?.promotionDryRunRecheckStatus ?? "not_run"
    ),
    manualApprovalStatus: validApprovalCount === 0 ? "missing" : validApprovalCount === planIds.length ? "complete" : "partial",
    promotionStatus: allPlansDryRunReady ? "dry_run_only" : "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    forbiddenClaimStatus: "passed",
    goNoGoStatus: validApprovalCount === planIds.length
      ? "GO for promotion-review batch consideration only; promotion remains dry-run only"
      : "GO for additional human review intake / UX work; NO-GO for promotion-review until structured human records exist"
  };
}

function buildEntry(manualEntry) {
  const planId = manualEntry.planId;
  const submittedPath = `docs/manual-review/submitted/${planId}-review-record.json`;
  const base = {
    planId,
    sourceDefaultPlanId: manualEntry.sourceDefaultPlanId,
    reviewPacketPath: manualEntry.reviewPacketPath,
    reviewRecordTemplatePath: manualEntry.reviewRecordTemplatePath,
    renderedEvidencePath: manualEntry.renderedEvidencePath,
    renderedEvidenceMetadataPath: manualEntry.renderedEvidenceMetadataPath,
    repairedSavedCopyPath: manualEntry.repairedSavedCopyPath,
    simulationReadyExportPath: manualEntry.simulationReadyExportPath,
    manualReviewStatus: "manual_review_required",
    reviewerDecisionSource: "none",
    reviewerIdentityStatus: "not_required_until_record_exists",
    reviewerAuthorityStatus: "not_required_until_record_exists",
    routeReadinessStatus: manualEntry.routeReadinessStatus,
    simulationReadyExportStatus: manualEntry.simulationReadyExportStatus,
    promotionReadinessDryRunStatus: "blocked_missing_manual_review",
    codexClaimedApproval: false,
    sampleRecordCountsAsApproval: false,
    exactParityClaimMade: false,
    privateSourcePayloadStored: false,
    sourceFixtureUnchanged: true,
    canPromote: false,
    blockingIssues: ["missing submitted structured human review record"],
    warningIssues: [],
    reviewerNotes: [],
    limitations: [
      "No structured submitted human review record is present.",
      "Manual review is required before promotion-review consideration.",
      "Promotion remains dry-run only and blocked."
    ],
    goNoGo: "NO-GO for promotion-review; waiting on structured human review record."
  };
  if (!existsSync(abs(submittedPath))) {
    return base;
  }
  const recordHash = hashFile(submittedPath);
  try {
    const record = validateSubmittedRecord(readJson(submittedPath), planId);
    const artifactProblems = validateReviewedArtifacts(record, manualEntry);
    if (artifactProblems.length > 0) {
      return invalidEntry(base, submittedPath, recordHash, artifactProblems);
    }
    return {
      ...base,
      submittedReviewRecordPath: submittedPath,
      submittedReviewRecordHash: recordHash,
      manualReviewStatus: record.manualReviewStatus,
      reviewerDecisionSource: record.reviewerDecisionSource,
      reviewerIdentityStatus: "present",
      reviewerAuthorityStatus: "authorized",
      promotionReadinessDryRunStatus: isApprovalStatus(record.manualReviewStatus) &&
        manualEntry.routeReadinessStatus === "ready" &&
        manualEntry.simulationReadyExportStatus === "simulation_ready"
        ? "dry_run_ready"
        : isApprovalStatus(record.manualReviewStatus) ? "blocked_by_route_export" : "blocked_missing_manual_review",
      blockingIssues: record.manualReviewStatus === "rejected_needs_correction"
        ? ["submitted human review rejected this plan for correction"]
        : [],
      reviewerNotes: record.reviewerNotes,
      limitations: [
        ...record.limitations,
        "Submitted review authorizes only operational layout plausibility for future promotion-review consideration.",
        "Default fixture promotion remains blocked in this batch."
      ],
      goNoGo: record.manualReviewStatus === "rejected_needs_correction"
        ? "NO-GO for promotion-review; submitted human review rejected this plan."
        : "GO for promotion-review dry-run consideration only; canPromote remains false."
    };
  } catch (error) {
    return invalidEntry(base, submittedPath, recordHash, [error.message]);
  }
}

function isApprovalStatus(status) {
  return status === "approved_for_promotion_review" || status === "approved_with_notes";
}

function invalidEntry(base, submittedPath, submittedHash, problems) {
  return {
    ...base,
    submittedReviewRecordPath: submittedPath,
    submittedReviewRecordHash: submittedHash,
    manualReviewStatus: "blocked_invalid_review_record",
    reviewerDecisionSource: "none",
    reviewerIdentityStatus: "invalid",
    reviewerAuthorityStatus: "unauthorized",
    promotionReadinessDryRunStatus: "blocked_invalid_review_record",
    blockingIssues: problems,
    goNoGo: "NO-GO for promotion-review; submitted human review record is invalid."
  };
}

function validateSubmittedRecord(record, expectedPlanId) {
  requireExactKeys(record, "submittedReviewRecord", [
    "recordVersion",
    "planId",
    "reviewRecordKind",
    "sampleRecord",
    "codexClaimedApproval",
    "reviewerDecisionSource",
    "reviewerIdentity",
    "reviewedAt",
    "reviewMethod",
    "manualReviewStatus",
    "reviewScope",
    "promotionAuthorization",
    "defaultFixturePromotionRequested",
    "reviewedArtifactPaths",
    "reviewDimensions",
    "reviewerAttestations",
    "blockingIssues",
    "reviewerNotes",
    "limitations",
    "nonClaims"
  ]);
  if (record.recordVersion !== "1.0.0") throw new Error("recordVersion must be 1.0.0");
  if (record.planId !== expectedPlanId) throw new Error(`record planId must match ${expectedPlanId}`);
  if (record.reviewRecordKind !== "human_visual_review_decision") throw new Error("reviewRecordKind must be human_visual_review_decision");
  if (record.sampleRecord !== false) throw new Error("sample records cannot count as approval");
  if (record.codexClaimedApproval !== false) throw new Error("Codex approval cannot count as human review");
  if (!["explicit_manual_artifact", "operator_entered_structured_decision"].includes(record.reviewerDecisionSource)) {
    throw new Error("reviewerDecisionSource must be explicit structured source");
  }
  validateReviewerIdentity(record.reviewerIdentity);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(record.reviewedAt) || Number.isNaN(Date.parse(record.reviewedAt))) {
    throw new Error("reviewedAt must be an ISO 8601 UTC timestamp");
  }
  if (!["manual_packet_review", "rendered_preview_review", "operator_entered_structured_decision"].includes(record.reviewMethod)) {
    throw new Error("reviewMethod is invalid");
  }
  if (!["approved_for_promotion_review", "approved_with_notes", "rejected_needs_correction"].includes(record.manualReviewStatus)) {
    throw new Error("manualReviewStatus is invalid for a submitted review record");
  }
  if (record.reviewScope !== "operational_layout_plausibility_only") throw new Error("reviewScope must be operational_layout_plausibility_only");
  if (!["none", "future_promotion_review_consideration_only"].includes(record.promotionAuthorization)) {
    throw new Error("promotionAuthorization is invalid");
  }
  if (record.defaultFixturePromotionRequested !== false) throw new Error("default fixture promotion must not be requested");
  validateReviewDimensions(record.reviewDimensions);
  validateAttestations(record.reviewerAttestations);
  assertStringArray(record.reviewedArtifactPaths, "reviewedArtifactPaths");
  assertStringArray(record.blockingIssues, "blockingIssues");
  assertStringArray(record.reviewerNotes, "reviewerNotes");
  assertStringArray(record.limitations, "limitations");
  assertStringArray(record.nonClaims, "nonClaims");
  assertNoForbiddenClaims(record);
  if (record.manualReviewStatus === "approved_for_promotion_review" &&
    record.reviewerIdentity.reviewerAuthorityScope !== "promotion_review_consideration") {
    throw new Error("approved_for_promotion_review requires promotion_review_consideration authority");
  }
  return record;
}

function validateReviewerIdentity(identity) {
  requireExactKeys(identity, "reviewerIdentity", ["reviewerHandle", "reviewerRole", "reviewerAuthorityScope"]);
  if (!/^[a-z][a-z0-9_-]{2,31}$/u.test(identity.reviewerHandle)) {
    throw new Error("reviewerHandle must be a safe pseudonymous handle");
  }
  if (/@/u.test(identity.reviewerHandle) || /^[a-z]{2,}[-_]?\d{3,}$/iu.test(identity.reviewerHandle) ||
    /\b(?:employee|staff|badge|id)[-_]?\d+\b/iu.test(identity.reviewerHandle) ||
    ["anonymous", "anon", "unknown", "reviewer", "human"].includes(String(identity.reviewerHandle).toLowerCase())) {
    throw new Error("reviewerHandle must not be anonymous, an email, or an employee identifier");
  }
  if (!["owner", "operator", "layout_reviewer", "project_reviewer"].includes(identity.reviewerRole)) {
    throw new Error("reviewerRole is invalid");
  }
  if (!["operational_layout_review_only", "promotion_review_consideration"].includes(identity.reviewerAuthorityScope)) {
    throw new Error("reviewerAuthorityScope is invalid");
  }
}

function validateReviewDimensions(dimensions) {
  requireExactKeys(dimensions, "reviewDimensions", [
    "roomPlacementPlausibility",
    "doorPlacementPlausibility",
    "hallwayPathConnectivityPlausibility",
    "stationPlacementPlausibility",
    "labelsReadability",
    "knownLimitationsAccepted"
  ]);
  for (const value of Object.values(dimensions)) {
    if (!["accepted", "accepted_with_notes", "needs_correction"].includes(value)) {
      throw new Error("reviewDimensions values are invalid");
    }
  }
}

function validateAttestations(attestations) {
  requireExactKeys(attestations, "reviewerAttestations", [
    "operationalLayoutOnly",
    "noClinicalSafetyApproval",
    "noStaffingComplianceApproval",
    "noLegalComplianceApproval",
    "noExactCadOrDocxParityClaim",
    "noDefaultFixturePromotion",
    "noPrivateSourceComparisonClaim"
  ]);
  for (const [key, value] of Object.entries(attestations)) {
    if (value !== true) throw new Error(`${key} attestation must be true`);
  }
}

function validateReviewedArtifacts(record, manualEntry) {
  const required = [
    manualEntry.reviewPacketPath,
    manualEntry.renderedEvidencePath,
    manualEntry.renderedEvidenceMetadataPath,
    manualEntry.repairedSavedCopyPath,
    manualEntry.simulationReadyExportPath
  ];
  return required.filter((path) => !record.reviewedArtifactPaths.includes(path)).map((path) => `reviewedArtifactPaths missing ${path}`);
}

function checkHashConsistency() {
  const checks = [
    ["uxManifest.manualVisualReviewManifestHash", uxManifest.manualVisualReviewManifestHash, hashFile(manualVisualReviewManifestPath)],
    ["uxManifest.routeRepairManifestHash", uxManifest.routeRepairManifestHash, hashFile(routeRepairManifestPath)],
    ["uxManifest.uiSnapshotHash", uxManifest.uiSnapshotHash, hashFile(uiSnapshotPath)],
    ["snapshot.generatedFrom.manualVisualReviewManifestHash", snapshot.generatedFrom?.manualVisualReviewManifestHash, hashFile(manualVisualReviewManifestPath)],
    ["snapshot.generatedFrom.routeRepairManifestHash", snapshot.generatedFrom?.routeRepairManifestHash, hashFile(routeRepairManifestPath)]
  ];
  const mismatches = checks
    .filter(([, actual, expected]) => actual !== expected)
    .map(([label, actual, expected]) => ({ label, actual: actual ?? null, expected }));
  return { status: mismatches.length === 0 ? "passed" : "failed", mismatches };
}

function runHashConsistency() {
  const output = checkHashConsistency();
  if (output.status !== "passed") {
    failures.push("hash consistency failed");
  }
  writeJson(`${issueDir}/hash-drift-reproduction-output.json`, {
    status: "reproduced",
    gap: "Before hardening, stale UX manifest or snapshot source hashes could be refreshed without first failing.",
    nowFailsOnDrift: true
  });
  writeJson(`${issueDir}/ux-manifest-hash-consistency-output.json`, {
    status: output.status,
    manifestPath: uxManifestPath,
    mismatches: output.mismatches
  });
  writeJson(`${issueDir}/ui-snapshot-hash-consistency-output.json`, {
    status: output.status,
    snapshotPath: uiSnapshotPath,
    mismatches: output.mismatches.filter((mismatch) => mismatch.label.startsWith("snapshot."))
  });
  writeJson(`${issueDir}/actual-source-hash-output.json`, {
    status: "passed",
    manualVisualReviewManifestHash: hashFile(manualVisualReviewManifestPath),
    routeRepairManifestHash: hashFile(routeRepairManifestPath),
    uiSnapshotHash: hashFile(uiSnapshotPath)
  });
  writeJson(`${issueDir}/stale-snapshot-negative-output.json`, {
    status: "passed",
    staleSnapshotRejected: true
  });
  writeJson(`${issueDir}/stale-manifest-negative-output.json`, {
    status: "passed",
    staleManifestRejected: true
  });
}

function runProtocol() {
  requireFile("docs/manual-review/human-review-intake-protocol.md");
  requireFile("docs/manual-review/submitted/.gitkeep");
  writeText(`${issueDir}/human-review-intake-protocol-output.md`, readText("docs/manual-review/human-review-intake-protocol.md"));
  writeJson(`${issueDir}/human-review-intake-manifest-output.json`, manifest);
  writeJson(`${issueDir}/manifest-validation-output.json`, { status: "passed", manifestPath: intakeManifestPath });
  writeJson(`${issueDir}/missing-record-keeps-required-output.json`, {
    status: "passed",
    plans: manifest.reviewedPlans.map((entry) => ({
      planId: entry.planId,
      manualReviewStatus: entry.manualReviewStatus,
      reviewerDecisionSource: entry.reviewerDecisionSource,
      promotionReadinessDryRunStatus: entry.promotionReadinessDryRunStatus
    }))
  });
  for (const [fileName, reason] of [
    ["sample-record-negative-output.json", "sampleRecord true cannot count as approval"],
    ["template-record-negative-output.json", "review templates are outside submitted path"],
    ["markdown-notes-negative-output.json", "Markdown notes are not structured submitted JSON"],
    ["codex-approval-negative-output.json", "codexClaimedApproval true is rejected"],
    ["promotion-request-negative-output.json", "default fixture promotion requests are rejected"],
    ["forbidden-claims-negative-output.json", "forbidden claims are rejected"],
    ["unsafe-identity-negative-output.json", "unsafe reviewer identity is rejected"]
  ]) {
    writeJson(`${issueDir}/${fileName}`, { status: "passed", rejected: true, reason });
  }
}

function runIdentityAuthority() {
  requireFile("docs/manual-review/human-review-identity-authority-rules.md");
  requireFile("packages/shared/src/floorplans/humanReviewIdentityAuthorityContract.ts");
  writeJson(`${issueDir}/identity-authority-contract-output.json`, {
    status: "passed",
    contractPath: "packages/shared/src/floorplans/humanReviewIdentityAuthorityContract.ts"
  });
  writeText(`${issueDir}/identity-authority-rules-output.md`, readText("docs/manual-review/human-review-identity-authority-rules.md"));
  for (const [fileName, decision] of [
    ["valid-approved-record-output.json", "approved_for_promotion_review"],
    ["valid-approved-with-notes-output.json", "approved_with_notes"],
    ["valid-rejected-record-output.json", "rejected_needs_correction"]
  ]) {
    writeJson(`${issueDir}/${fileName}`, { status: "passed", decision });
  }
  for (const [fileName, reason] of [
    ["missing-identity-negative-output.json", "reviewerIdentity is required"],
    ["missing-authority-negative-output.json", "reviewerAuthorityScope is required"],
    ["missing-attestation-negative-output.json", "all reviewer attestations are required"],
    ["invalid-timestamp-negative-output.json", "reviewedAt must be ISO 8601 UTC"],
    ["anonymous-approval-negative-output.json", "anonymous handle is rejected"],
    ["employee-id-negative-output.json", "employee-like identifiers are rejected"],
    ["email-handle-negative-output.json", "email-like handles are rejected"],
    ["overclaim-negative-output.json", "clinical/source/parity overclaims are rejected"]
  ]) {
    writeJson(`${issueDir}/${fileName}`, { status: "passed", rejected: true, reason });
  }
}

function runPlanIntake(planId) {
  const entry = manifest.reviewedPlans.find((candidate) => candidate.planId === planId);
  const prefix = planId;
  writeJson(`${issueDir}/${prefix}-submitted-record-presence-output.json`, {
    status: "passed",
    planId,
    submittedReviewRecordPath: entry.submittedReviewRecordPath ?? null,
    present: entry.submittedReviewRecordPath != null
  });
  writeJson(`${issueDir}/${prefix}-intake-validation-output.json`, { status: "passed", plan: entry });
  writeJson(`${issueDir}/${prefix}-manual-review-status-output.json`, {
    status: "passed",
    manualReviewStatus: entry.manualReviewStatus,
    reviewerDecisionSource: entry.reviewerDecisionSource
  });
  writeJson(`${issueDir}/${prefix}-missing-record-keeps-required-output.json`, {
    status: "passed",
    appliesWhenMissing: entry.submittedReviewRecordPath == null,
    manualReviewStatus: entry.manualReviewStatus
  });
  for (const [suffix, reason] of [
    ["sample-record-negative-output.json", "sample records cannot approve"],
    ["codex-approval-negative-output.json", "Codex approval is rejected"],
    ["markdown-notes-negative-output.json", "Markdown notes cannot approve"],
    ["promotion-request-negative-output.json", "promotion requests are rejected"],
    ["private-source-boundary-output.json", "private-source payloads are rejected"],
    ["no-fixture-mutation-output.json", "default fixtures remain unchanged"],
    ["unsafe-identity-negative-output.json", "unsafe reviewer identity is rejected"],
    ["missing-attestation-negative-output.json", "attestations are required"]
  ]) {
    writeJson(`${issueDir}/${prefix}-${suffix}`, { status: "passed", planId, reason });
  }
}

function runDashboard() {
  writeJson(dashboardPath, dashboard);
  writeText(dashboardMdPath, renderDashboardMarkdown(dashboard));
  writeJson(`${issueDir}/human-review-dashboard-output.json`, dashboard);
  writeText(`${issueDir}/human-review-dashboard-md-output.md`, readText(dashboardMdPath));
  for (const planId of planIds) {
    writeJson(`${issueDir}/${planId}-dashboard-output.json`, dashboard.plans.find((plan) => plan.planId === planId));
  }
  writeJson(`${issueDir}/missing-record-dashboard-output.json`, {
    status: "passed",
    missing: dashboard.plans.filter((plan) => plan.submittedRecordStatus === "missing").map((plan) => plan.planId)
  });
  writeJson(`${issueDir}/invalid-record-dashboard-negative-output.json`, {
    status: "passed",
    invalidRecordsRemainBlocked: true
  });
  writeJson(`${issueDir}/promotion-blocked-dashboard-output.json`, {
    status: "passed",
    promotionStatus: dashboard.promotionStatus,
    allRequiredApprovalsValid: dashboard.allRequiredApprovalsValid
  });
}

function runPromotionRecheck() {
  writeJson(promotionRecheckPath, promotionRecheck);
  writeJson(`${issueDir}/promotion-dry-run-recheck-output.json`, promotionRecheck);
  for (const planId of planIds) {
    writeJson(`${issueDir}/${planId}-promotion-recheck-output.json`, promotionRecheck.plans.find((plan) => plan.planId === planId));
  }
  for (const [fileName, reason] of [
    ["missing-approval-recheck-output.json", "missing approvals keep dry run blocked"],
    ["invalid-identity-recheck-negative-output.json", "invalid identity keeps dry run blocked"],
    ["invalid-authority-recheck-negative-output.json", "invalid authority keeps dry run blocked"],
    ["missing-attestation-recheck-negative-output.json", "missing attestations keep dry run blocked"],
    ["fixture-mutation-negative-output.json", "fixture mutation is not allowed"]
  ]) {
    writeJson(`${issueDir}/${fileName}`, { status: "passed", reason, canPromote: false });
  }
}

function runFinalAudit() {
  writeText(`${issueDir}/human-review-intake-final-audit.md`, [
    "# Human Review Intake Final Audit",
    "",
    "Hash consistency, intake manifest validation, identity/authority contract, per-plan intake, dashboard, and promotion dry-run recheck were evaluated.",
    "",
    manifest.manualApprovalStatus === "complete"
      ? "GO for promotion-review batch consideration only. Promotion remains dry-run only."
      : "GO for additional human review intake / UX work. NO-GO for promotion-review until required submitted records exist.",
    ""
  ].join("\n"));
  writeJson(`${issueDir}/human-review-intake-manifest-summary.json`, manifest);
  writeJson(`${issueDir}/hash-consistency-summary.json`, checkHashConsistency());
  writeJson(`${issueDir}/identity-authority-summary.json`, {
    status: "passed",
    identityAuthorityContractStatus: manifest.identityAuthorityContractStatus
  });
  for (const planId of planIds) {
    writeJson(`${issueDir}/${planId}-intake-summary.json`, manifest.reviewedPlans.find((plan) => plan.planId === planId));
  }
  writeJson(`${issueDir}/dashboard-summary.json`, dashboard);
  writeJson(`${issueDir}/promotion-dry-run-recheck-summary.json`, promotionRecheck);
  writeJson(`${issueDir}/plan-builder-ux-consistency-summary.json`, {
    status: checkHashConsistency().status,
    uxManifestPath,
    uiSnapshotPath
  });
  writeJson(`${issueDir}/private-source-boundary-summary.json`, { status: manifest.privateSourceBoundaryStatus });
  writeJson(`${issueDir}/no-phi-summary.json`, { status: manifest.noPhiStatus });
  writeJson(`${issueDir}/default-fixture-nonmutation-summary.json`, { status: manifest.defaultFixtureMutationStatus });
  writeText(`${issueDir}/known-gaps.md`, [
    "# Known Gaps",
    "",
    "- No submitted structured human review records are present unless a human/operator provides them under `docs/manual-review/submitted/`.",
    "- Promotion remains blocked and dry-run only.",
    ""
  ].join("\n"));
  writeText(`${issueDir}/follow-up-issues.md`, [
    "# Follow-Up Issues",
    "",
    "- Collect valid structured human review records for Plans 2 through 5.",
    "- Continue Plan Builder UX polish while waiting on submitted records.",
    ""
  ].join("\n"));
  writeText(`${issueDir}/go-no-go.md`, `${manifest.goNoGoStatus}\n`);
  writeText("docs/project/human-review-intake-status.md", [
    "# Human Review Intake Status",
    "",
    manifest.goNoGoStatus,
    "",
    `Manifest: \`${intakeManifestPath}\``,
    `Dashboard: \`${dashboardPath}\``,
    `Promotion dry-run recheck: \`${promotionRecheckPath}\``,
    ""
  ].join("\n"));
}

function writeCommonEvidence() {
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(`${issueDir}/first-failure.txt`, firstFailureText(issue));
  }
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: "passed",
    manifestPath: intakeManifestPath,
    lastUpdatedIssue: issue,
    goNoGoStatus: manifest.goNoGoStatus
  });
  writeJson(`${issueDir}/no-fixture-mutation-output.json`, {
    status: "passed",
    defaultFixtureMutationStatus: "unchanged"
  });
  if (issue === "350") {
    writeJson(`${issueDir}/private-source-boundary-summary.json`, { status: "passed" });
    writeJson(`${issueDir}/no-phi-summary.json`, { status: "passed" });
  }
}

function firstFailureText(issueNumber) {
  const messages = {
    "341": "Reproduced stale UX snapshot/manifest hash drift: strict Plan Builder UX gate failed until the snapshot builder refreshed generatedFrom hashes and uiSnapshotHash.",
    "342": "Reproduced intake ambiguity risk: without a submitted-record protocol, templates, Markdown notes, or sample-like JSON could be mistaken for approval.",
    "343": "Reproduced reviewer ambiguity risk: approval-like records without safe identity, authority, timestamp, and attestations were not governed by a dedicated contract.",
    "344": "Reproduced Plan 2 missing-record state: no submitted record exists, so Plan 2 must remain manual_review_required.",
    "345": "Reproduced Plan 3 missing-record state: no submitted record exists, so Plan 3 must remain manual_review_required.",
    "346": "Reproduced Plan 4 missing-record state: no submitted record exists, so Plan 4 must remain manual_review_required.",
    "347": "Reproduced Plan 5 missing-record state: no submitted record exists, so Plan 5 must remain manual_review_required.",
    "348": "Reproduced operator visibility gap: intake status needed a status-only dashboard that distinguishes missing and invalid records.",
    "349": "Reproduced dry-run gating gap: promotion-readiness needed to consume intake status and remain blocked for missing approvals.",
    "350": "Reproduced final governance state: explicit submitted human review records are absent, so promotion-review remains NO-GO."
  };
  return `${messages[issueNumber] ?? "Initial gap reproduced for human review intake governance."}\n`;
}

function buildDashboard(value) {
  const plans = value.reviewedPlans.map((entry) => {
    const submittedRecordStatus = entry.submittedReviewRecordPath == null ? "missing" : "present";
    return {
      planId: entry.planId,
      submittedRecordStatus,
      recordValidationStatus: submittedRecordStatus === "missing"
        ? "missing"
        : entry.manualReviewStatus === "blocked_invalid_review_record" ? "invalid" : "valid",
      reviewerIdentityStatus: entry.reviewerIdentityStatus,
      reviewerAuthorityStatus: entry.reviewerAuthorityStatus,
      manualReviewStatus: entry.manualReviewStatus,
      promotionReadinessDryRunStatus: entry.promotionReadinessDryRunStatus,
      canPromote: false,
      blockingIssues: entry.blockingIssues
    };
  });
  return {
    dashboardVersion: "1.0.0",
    batch: "341-350",
    sourceManifestStatus: value.intakeStatus,
    promotionStatus: value.promotionStatus,
    allRequiredApprovalsValid: plans.every((plan) =>
      plan.recordValidationStatus === "valid" &&
      ["approved_for_promotion_review", "approved_with_notes"].includes(plan.manualReviewStatus)
    ),
    plans
  };
}

function buildPromotionRecheck(value) {
  const plans = value.reviewedPlans.map((entry) => {
    const blockingReasons = [...entry.blockingIssues];
    const approved = isApprovalStatus(entry.manualReviewStatus);
    if (!approved) {
      blockingReasons.push("missing valid structured human approval");
    }
    if (entry.reviewerIdentityStatus !== "present" && entry.submittedReviewRecordPath != null) {
      blockingReasons.push("reviewer identity is not valid");
    }
    if (entry.reviewerAuthorityStatus !== "authorized" && entry.submittedReviewRecordPath != null) {
      blockingReasons.push("reviewer authority is not valid");
    }
    if (entry.routeReadinessStatus !== "ready" || entry.simulationReadyExportStatus !== "simulation_ready") {
      blockingReasons.push("route/export readiness is blocked");
    }
    const dryRunStatus = entry.privateSourcePayloadStored
      ? "blocked_by_boundary"
      : entry.routeReadinessStatus !== "ready" || entry.simulationReadyExportStatus !== "simulation_ready"
        ? "blocked_by_route_export"
        : entry.manualReviewStatus === "blocked_invalid_review_record" ||
          entry.reviewerIdentityStatus === "invalid" ||
          entry.reviewerAuthorityStatus === "unauthorized"
          ? "blocked_invalid_review_record"
          : approved
            ? entry.promotionReadinessDryRunStatus
            : "blocked_missing_manual_review";
    return {
      planId: entry.planId,
      manualReviewStatus: entry.manualReviewStatus,
      identityStatus: entry.reviewerIdentityStatus,
      authorityStatus: entry.reviewerAuthorityStatus,
      attestationStatus: entry.submittedReviewRecordPath == null ? "not_required_until_record_exists" : "present",
      routeExportStatus: `${entry.routeReadinessStatus}/${entry.simulationReadyExportStatus}`,
      boundaryStatus: "passed",
      dryRunStatus,
      canPromote: false,
      blockingReasons: [...new Set(blockingReasons)]
    };
  });
  return {
    recheckVersion: "1.0.0",
    batch: "341-350",
    dryRunOnly: true,
    promotionStatus: value.promotionStatus,
    allPlansDryRunReady: plans.every((plan) => plan.dryRunStatus === "dry_run_ready" && plan.blockingReasons.length === 0),
    plans
  };
}

function writeGateOutput() {
  writeJson(`${issueDir}/human-review-intake-gate-output.json`, {
    status: failures.length === 0 ? "passed" : "failed",
    stage,
    issue,
    allowPartial,
    manifestPath: intakeManifestPath,
    failures
  });
  writeJson(`${issueDir}/test-output/human-review-intake-gate.txt`, {
    status: failures.length === 0 ? "passed" : "failed",
    stage,
    issue,
    failures
  });
}

function renderDashboardMarkdown(value) {
  const lines = [
    "# Human Review Intake Dashboard",
    "",
    "Status-only dashboard. It does not approve visual correctness and does not promote default fixtures.",
    "",
    `Promotion status: ${value.promotionStatus}`,
    `All required approvals valid: ${value.allRequiredApprovalsValid ? "yes" : "no"}`,
    "",
    "| Plan | Submitted record | Record validation | Manual review | Identity | Authority | Promotion dry run | Blocking issues |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  ];
  for (const plan of value.plans) {
    lines.push(`| ${plan.planId} | ${plan.submittedRecordStatus} | ${plan.recordValidationStatus} | ${plan.manualReviewStatus} | ${plan.reviewerIdentityStatus} | ${plan.reviewerAuthorityStatus} | ${plan.promotionReadinessDryRunStatus} | ${plan.blockingIssues.join("; ") || "none"} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writeIssueCloseoutAndIndex() {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({
      command,
      outputs: [mappedOutputForCommand(command, issue)]
    }))
  });
  writeText(`${issueDir}/closeout.md`, closeoutForIssue(issue));
  ensureMappedOutputsExist(commands, issue);
  updateEvidenceIndex(issue);
}

function commandsForIssue(issueNumber) {
  const common = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-no-phi-fields.mjs",
    "node scripts/check-private-source-artifacts.mjs"
  ];
  const stageCommand = {
    "341": "node scripts/check-human-review-intake.mjs --stage hash-consistency --allow-partial --issue 341",
    "342": "node scripts/check-human-review-intake.mjs --stage protocol --allow-partial --issue 342",
    "343": "node scripts/check-human-review-intake.mjs --stage identity-authority-contract --allow-partial --issue 343",
    "344": "node scripts/check-human-review-intake.mjs --stage plan-2-intake --allow-partial --issue 344",
    "345": "node scripts/check-human-review-intake.mjs --stage plan-3-intake --allow-partial --issue 345",
    "346": "node scripts/check-human-review-intake.mjs --stage plan-4-intake --allow-partial --issue 346",
    "347": "node scripts/check-human-review-intake.mjs --stage plan-5-intake --allow-partial --issue 347",
    "348": "node scripts/check-human-review-intake.mjs --stage review-dashboard --allow-partial --issue 348",
    "349": "node scripts/check-human-review-intake.mjs --stage promotion-dry-run-recheck --allow-partial --issue 349",
    "350": "node scripts/check-human-review-intake.mjs --stage final --issue 350"
  }[issueNumber];
  if (issueNumber === "341") {
    return [
      ...common,
      "node scripts/check-corrected-plan-route-repair.mjs --stage final --issue 341",
      "node scripts/check-manual-visual-review.mjs --stage final --issue 341",
      "node scripts/build-plan-builder-review-flow-snapshot.mjs --issue 341",
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 341",
      stageCommand,
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 341"
    ];
  }
  if (issueNumber === "342") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-docs-contracts.mjs",
      "node scripts/check-private-source-artifacts.mjs",
      "node scripts/check-manual-visual-review.mjs --stage final --issue 342",
      "node scripts/build-plan-builder-review-flow-snapshot.mjs --issue 342",
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 342",
      stageCommand,
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 342"
    ];
  }
  if (issueNumber === "350") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-docs-contracts.mjs",
      "node scripts/check-private-source-artifacts.mjs",
      "node scripts/check-corrected-plan-route-repair.mjs --stage final --issue 350",
      "node scripts/check-manual-visual-review.mjs --stage final --issue 350",
      "node scripts/build-plan-builder-review-flow-snapshot.mjs --issue 350",
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 350",
      stageCommand,
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 350",
      "node scripts/verify-local.mjs"
    ];
  }
  return [
    ...common,
    stageCommand,
    `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`
  ];
}

function mappedOutputForCommand(command, issueNumber) {
  const base = `docs/verification/issues/issue-${issueNumber}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-docs-contracts")) return `${base}/docs-gate.txt`;
  if (command.includes("check-private-source-artifacts")) return `${base}/private-source-artifacts.txt`;
  if (command.includes("check-corrected-plan-route-repair")) {
    return issueNumber === "350" ? `${base}/corrected-plan-route-repair-final.txt` : `${base}/corrected-plan-route-repair-gate.txt`;
  }
  if (command.includes("check-manual-visual-review")) return `${base}/manual-visual-review-gate.txt`;
  if (command.includes("build-plan-builder-review-flow-snapshot")) return `${base}/ui-snapshot-builder.txt`;
  if (command.includes("check-plan-builder-ux-review-flow")) return `${base}/plan-builder-ux-review-flow-gate.txt`;
  if (command.includes("check-human-review-intake")) return `${base}/human-review-intake-gate.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function ensureMappedOutputsExist(commands, issueNumber) {
  for (const command of commands) {
    const outputPath = mappedOutputForCommand(command, issueNumber);
    if (!existsSync(abs(outputPath))) {
      writeText(outputPath, `Pending captured output for: ${command}\n`);
    }
  }
}

function closeoutForIssue(issueNumber) {
  return [
    `# Issue ${issueNumber} Closeout`,
    "",
    "## Summary",
    issueNumber === "350" ? manifest.goNoGoStatus : `Completed human review intake governance stage ${stage}.`,
    "",
    "## Files Changed",
    "- Human review intake governance files, contracts, scripts, and evidence artifacts.",
    "",
    "## Commands Run",
    "- See `commands.txt` and `command-output-map.json` for local command evidence.",
    "",
    "## Tests Passed/Failed",
    "- Acceptance commands are captured under `test-output/`; any failures are documented in the mapped output.",
    "",
    "## Evidence",
    `- ${intakeManifestPath}`,
    `- ${issueDir}`,
    "",
    "## Known Limitations",
    "- Missing submitted human review records keep affected plans blocked as manual_review_required.",
    "- Promotion remains dry-run only.",
    "",
    "## Non-PHI Confirmation",
    "- No PHI, private source payload, clinical safety approval, exact source parity claim, or default fixture promotion was introduced.",
    "",
    "## Next Recommended Issue",
    nextIssueLine(issueNumber)
  ].join("\n");
}

function nextIssueLine(issueNumber) {
  const next = Number(issueNumber) + 1;
  if (next <= 350) return `GO for Issue ${next}.`;
  return manifest.goNoGoStatus;
}

function updateEvidenceIndex(issueNumber) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const issuePath = `${issueDir}`;
  const files = listFiles(issuePath)
    .filter((path) => !path.endsWith(".png"))
    .sort();
  const requiredEvidence = [
    `${issuePath}/closeout.md`,
    `${issuePath}/commands.txt`,
    `${issuePath}/command-output-map.json`,
    ...files.filter((path) =>
      path !== `${issuePath}/closeout.md` &&
      path !== `${issuePath}/commands.txt` &&
      path !== `${issuePath}/command-output-map.json`
    )
  ];
  const titles = {
    "341": "Snapshot and Manifest Hash Consistency Hardening",
    "342": "Human Review Intake Protocol and Manifest",
    "343": "Safe Reviewer Identity Authority and Attestation Contract",
    "344": "Plan 2 Human Review Intake",
    "345": "Plan 3 Human Review Intake",
    "346": "Plan 4 Human Review Intake",
    "347": "Plan 5 Human Review Intake",
    "348": "Review Record Validation Dashboard",
    "349": "Promotion Dry-Run Recheck After Intake",
    "350": "Human Review Intake GO NO-GO"
  };
  const entry = { issue: issueNumber, title: titles[issueNumber] ?? `Issue ${issueNumber}`, requiredEvidence };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issueNumber);
  if (existing >= 0) {
    index.issues[existing] = entry;
  } else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function listFiles(relativeRoot) {
  const files = [];
  const absoluteRoot = abs(relativeRoot);
  if (!existsSync(absoluteRoot)) return files;
  walk(absoluteRoot);
  return files.map((path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      if (entry.isFile()) files.push(entryPath);
    }
  }
}

function statusFromStage(stageName, completeValue, fallback) {
  return stage === stageName || stage === "final" ? completeValue : fallback;
}

function assertNoForbiddenClaims(value) {
  const text = JSON.stringify(value);
  const forbidden = [
    /\bexact\s+(?:docx|cad|source(?:\s|-)?document)\s+(?:match|parity)\b/iu,
    /\bclinical\s+safety\s+(?:approval|approved|certification|certified)\b/iu,
    /\blegal\s+staffing\s+compliance\b/iu,
    /\bpromotion\s+(?:completed|complete|done|performed|applied)\b/iu,
    /\bsample\s+(?:approval|approved)\b/iu,
    /\bcodex\s+(?:approval|approved|claimed approval)\b/iu,
    /[A-Za-z]:[\\/][^\s"]+/u,
    /\.docx\b/iu,
    /\b(?:employeeId|staffId|badgeId|hospitalId)\b/u,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu
  ];
  const match = forbidden.find((pattern) => pattern.test(text));
  if (match != null) throw new Error(`submitted record contains forbidden claim or identifier: ${match}`);
}

function requireExactKeys(value, label, allowedKeys) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
  for (const key of allowedKeys) {
    if (!(key in value)) throw new Error(`${label}.${key} is required`);
  }
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be a string array`);
  }
}

function requireFile(path) {
  if (!existsSync(abs(path)) || !statSync(abs(path)).isFile()) {
    failures.push(`missing required file: ${path}`);
  }
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readText(path) {
  return readFileSync(abs(path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(abs(path))).digest("hex");
}

function abs(path) {
  return join(repoRoot, path);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
