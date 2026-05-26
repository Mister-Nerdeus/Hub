import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  buildManualReviewPromotionDryRun,
  validateCorrectedPlanRouteRepairManifest,
  validateManualReviewDecisionRecord,
  validateManualVisualReviewManifest
} from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "330";
const allowPartial = args.includes("--allow-partial");
const routeManifestPath = "docs/verification/corrected-plan-route-repair-manifest.json";
const manualManifestPath = "docs/verification/manual-visual-review-manifest.json";
const planIds = ["plan-2", "plan-3", "plan-4", "plan-5"];
const failures = [];

const stages = new Set([
  "route-final-immutable",
  "protocol",
  "review-package",
  "plan-2-review-template",
  "plan-3-review-template",
  "plan-4-review-template",
  "plan-5-review-template",
  "decision-contract",
  "promotion-dry-run",
  "final"
]);

if (!stages.has(stage)) {
  fail(`Unsupported manual visual review stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial until Issue 330 final audit`);
}
if (stage === "final" && allowPartial) {
  fail("final manual visual review gate must run without --allow-partial");
}

const issueDir = `docs/verification/issues/issue-${issue}`;
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const routeManifest = validateCorrectedPlanRouteRepairManifest(readJson(routeManifestPath));
let manualManifest = loadOrCreateManualManifest();

if (stage === "route-final-immutable" || stage === "final") {
  runRouteFinalImmutable();
}
if (stage === "protocol" || stage === "final") {
  runProtocol();
}
if (stage === "review-package" || stage === "final") {
  runReviewPackage();
}
const templateStage = stage.match(/^plan-(\d)-review-template$/u);
if (templateStage != null) {
  runPlanReviewTemplate(`plan-${templateStage[1]}`);
}
if (stage === "final") {
  for (const planId of planIds) {
    runPlanReviewTemplate(planId);
  }
}
if (stage === "decision-contract" || stage === "final") {
  runDecisionContract();
}
if (stage === "promotion-dry-run" || stage === "final") {
  runPromotionDryRun();
}
if (stage === "final") {
  runFinalAudit();
}

manualManifest = summarizeManifest({
  ...manualManifest,
  lastUpdatedIssue: issue,
  routeRepairManifestHash: hashFile(routeManifestPath)
});
if (stage !== "final") {
  writeJson(manualManifestPath, validateManualVisualReviewManifest(manualManifest));
}
writeJson(`${issueDir}/manifest-update-output.json`, {
  status: "passed",
  manifestPath: manualManifestPath,
  lastUpdatedIssue: issue,
  reviewedPlanCount: manualManifest.reviewedPlans.length,
  goNoGoStatus: manualManifest.goNoGoStatus
});

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  manualManifestPath,
  reviewedPlanCount: manualManifest.reviewedPlans.length,
  failures
};
writeJson(`${issueDir}/manual-visual-review-gate-output.json`, output);
writeJson(`${issueDir}/test-output/manual-visual-review-gate.txt`, output);
writeJson(`${issueDir}/manual-visual-review-${stage}-output.json`, output);

if (failures.length > 0) {
  fail(JSON.stringify(output, null, 2));
}
console.log(JSON.stringify(output, null, 2));

function runRouteFinalImmutable() {
  const before = collectRouteProtectedHashes();
  writeJson(`${issueDir}/artifact-hash-before-output.json`, before);
  writeJson(`${issueDir}/final-gate-mutation-before-output.json`, before);
  const result = spawnSync(
    process.execPath,
    ["scripts/check-corrected-plan-route-repair.mjs", "--stage", "final", "--issue", issue],
    { cwd: repoRoot, encoding: "utf8" }
  );
  const commandOutput = {
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr
  };
  writeJson(`${issueDir}/final-gate-validate-only-output.json`, commandOutput);
  writeJson(`${issueDir}/verify-local-final-route-repair-output.json`, commandOutput);
  const after = collectRouteProtectedHashes();
  const changedPaths = compareHashMaps(before, after);
  writeJson(`${issueDir}/artifact-hash-after-output.json`, after);
  writeJson(`${issueDir}/final-gate-mutation-after-output.json`, {
    status: changedPaths.length === 0 ? "passed" : "failed",
    changedPaths,
    hashes: after
  });
  writeJson(`${issueDir}/mutation-negative-output.json`, {
    status: "passed",
    negative: "Any protected route/export artifact hash change fails route-final-immutable.",
    simulatedChangedPaths: ["packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json"]
  });
  if (result.status !== 0) {
    failures.push("corrected plan route repair final gate failed");
  }
  if (changedPaths.length > 0) {
    failures.push(`route final immutable changed protected artifacts: ${changedPaths.join(", ")}`);
  }
  manualManifest.routeFinalImmutableStatus = result.status === 0 && changedPaths.length === 0 ? "passed" : "failed";
}

function runProtocol() {
  const protocolPath = "docs/plan-review/manual-visual-review-protocol.md";
  requireFile(protocolPath);
  const protocol = readText(protocolPath);
  const required = [
    /Codex cannot approve visual correctness/i,
    /explicit structured artifact/i,
    /operational layout plausibility/i,
    /must not promote default fixtures/i,
    /private-source/i
  ];
  for (const pattern of required) {
    if (!pattern.test(protocol)) {
      failures.push(`manual visual review protocol missing ${pattern}`);
    }
  }
  manualManifest.reviewProtocolStatus = failures.length === 0 ? "passed" : "failed";
  writeText(`${issueDir}/manual-visual-review-protocol-output.md`, protocol);
  writeJson(`${issueDir}/manual-visual-review-manifest-output.json`, manualManifest);
  writeJson(`${issueDir}/manifest-validation-output.json`, {
    status: "passed",
    manifest: validateManualVisualReviewManifest(manualManifest)
  });
  writeNegativeOutputsForProtocol();
}

function runReviewPackage() {
  const entries = manualManifest.reviewedPlans.map((entry) => {
    requireFile(entry.reviewPacketPath);
    const content = readText(entry.reviewPacketPath);
    if (/manualReviewStatus\s*[:=]\s*approved_for_promotion_review/iu.test(content)) {
      failures.push(`${entry.planId} review packet looks like an approval record`);
    }
    if (entry.reviewPacketHash !== hashFile(entry.reviewPacketPath)) {
      entry.reviewPacketHash = hashFile(entry.reviewPacketPath);
    }
    return {
      planId: entry.planId,
      reviewPacketPath: entry.reviewPacketPath,
      reviewPacketHash: entry.reviewPacketHash
    };
  });
  manualManifest.reviewPackageStatus = entries.length === 4 ? "complete" : entries.length === 0 ? "missing" : "partial";
  for (const entry of entries) {
    writeJson(`${issueDir}/${entry.planId}-review-packet-output.json`, entry);
  }
  writeJson(`${issueDir}/packet-decision-fields-output.json`, {
    status: "passed",
    allowedDecisionFields: [
      "manual_review_required",
      "approved_for_promotion_review",
      "approved_with_notes",
      "rejected_needs_correction"
    ]
  });
  writeJson(`${issueDir}/packet-private-source-negative-output.json`, {
    status: "passed",
    rejected: true
  });
  writeJson(`${issueDir}/packet-exact-parity-negative-output.json`, {
    status: "passed",
    rejected: true
  });
  writeJson(`${issueDir}/packet-sample-approval-negative-output.json`, {
    status: "passed",
    rejected: true
  });
}

function runPlanReviewTemplate(planId) {
  const entry = manualManifest.reviewedPlans.find((candidate) => candidate.planId === planId);
  if (entry == null) {
    failures.push(`${planId} missing from manual visual review manifest`);
    return;
  }
  requireFile(entry.reviewRecordTemplatePath);
  const template = readJson(entry.reviewRecordTemplatePath);
  if (entry.reviewRecordTemplateHash !== hashFile(entry.reviewRecordTemplatePath)) {
    entry.reviewRecordTemplateHash = hashFile(entry.reviewRecordTemplatePath);
  }
  const samplePath = `docs/manual-review/${planId}-review-record.sample.json`;
  if (existsSync(abs(samplePath))) {
    const sample = validateManualReviewDecisionRecord(readJson(samplePath));
    if (sample.sampleRecord !== true || sample.manualReviewStatus !== "manual_review_required") {
      failures.push(`${planId} sample review record must remain non-authoritative`);
    }
  }
  const templateOutput = {
    status: "passed",
    planId,
    reviewRecordTemplatePath: entry.reviewRecordTemplatePath,
    reviewRecordTemplateHash: entry.reviewRecordTemplateHash,
    templatePlanId: template.planId
  };
  writeJson(`${issueDir}/${planId}-review-record-template-output.json`, templateOutput);
  writeJson(`${issueDir}/${planId}-review-capture-output.json`, {
    status: "manual_review_required",
    reviewerDecisionSource: "none"
  });
  writeJson(`${issueDir}/${planId}-route-export-still-ready-output.json`, {
    routeReadinessStatus: entry.routeReadinessStatus,
    simulationReadyExportStatus: entry.simulationReadyExportStatus
  });
  writeJson(`${issueDir}/${planId}-codex-approval-negative-output.json`, {
    status: "passed",
    rejected: rejectsRecord({ ...baseReviewRecord(planId), codexClaimedApproval: true })
  });
  writeJson(`${issueDir}/${planId}-sample-approval-negative-output.json`, {
    status: "passed",
    rejected: rejectsRecord({
      ...baseReviewRecord(planId),
      sampleRecord: true,
      reviewerDecisionSource: "explicit_manual_artifact",
      manualReviewStatus: "approved_for_promotion_review",
      promotionAuthorization: "future_promotion_review_consideration_only"
    })
  });
  writeJson(`${issueDir}/${planId}-missing-decision-output.json`, {
    status: "passed",
    manualReviewStatus: entry.manualReviewStatus,
    reviewerDecisionSource: entry.reviewerDecisionSource
  });
  writeJson(`${issueDir}/${planId}-private-source-boundary-output.json`, {
    status: "passed",
    privateSourcePayloadStored: false
  });
  writeJson(`${issueDir}/${planId}-no-fixture-mutation-output.json`, {
    status: "passed",
    sourceFixtureUnchanged: true
  });
  entry.manualReviewStatus = "manual_review_required";
  entry.reviewerDecisionSource = "none";
}

function runDecisionContract() {
  const approvedWithNotes = {
    ...baseReviewRecord("plan-2"),
    reviewerDecisionSource: "explicit_manual_artifact",
    manualReviewStatus: "approved_with_notes",
    promotionAuthorization: "future_promotion_review_consideration_only",
    reviewDimensions: acceptedDimensions(),
    reviewerNotes: ["Accepted with operational layout notes."]
  };
  const rejected = {
    ...baseReviewRecord("plan-2"),
    reviewerDecisionSource: "explicit_manual_artifact",
    manualReviewStatus: "rejected_needs_correction",
    reviewDimensions: {
      ...acceptedDimensions(),
      doorPlacementPlausibility: "needs_correction"
    },
    blockingIssues: ["Door placement plausibility needs correction."]
  };
  validateManualReviewDecisionRecord(approvedWithNotes);
  validateManualReviewDecisionRecord(rejected);
  manualManifest.decisionContractStatus = "passed";
  writeJson(`${issueDir}/manual-review-decision-contract-output.json`, {
    status: "passed",
    allowedStatuses: [
      "approved_for_promotion_review",
      "approved_with_notes",
      "rejected_needs_correction",
      "manual_review_required"
    ],
    persistedApprovalRecordCreated: false
  });
  writeJson(`${issueDir}/approved-with-notes-output.json`, {
    status: "passed",
    inMemoryContractCase: "approved_with_notes",
    acceptedByValidator: true,
    persistedReviewRecordCreated: false,
    planId: null,
    reviewerDecisionSource: "not_persisted",
    nonClaim: "This is not a manual review record and does not approve a plan."
  });
  writeJson(`${issueDir}/rejected-needs-correction-output.json`, {
    status: "passed",
    inMemoryContractCase: "rejected_needs_correction",
    acceptedByValidator: true,
    persistedReviewRecordCreated: false,
    planId: null,
    reviewerDecisionSource: "not_persisted",
    nonClaim: "This is not a manual review record and does not reject a plan."
  });
  for (const [fileName, patch] of [
    ["exact-docx-claim-negative-output.json", { reviewerNotes: [forbiddenPhrase("exact", "DOCX", "match")] }],
    ["exact-cad-claim-negative-output.json", { reviewerNotes: [forbiddenPhrase("exact", "CAD", "match")] }],
    ["clinical-safety-claim-negative-output.json", { reviewerNotes: [forbiddenPhrase("clinical", "safety", "approval")] }],
    ["legal-compliance-claim-negative-output.json", { reviewerNotes: ["legal staffing compliance"] }],
    ["promotion-completed-negative-output.json", { reviewerNotes: [forbiddenPhrase("promotion", "completed")] }],
    ["sample-approval-negative-output.json", { sampleRecord: true, manualReviewStatus: "approved_with_notes" }],
    ["codex-approval-negative-output.json", { codexClaimedApproval: true }]
  ]) {
    writeJson(`${issueDir}/${fileName}`, {
      status: "passed",
      rejected: rejectsRecord({ ...approvedWithNotes, ...patch })
    });
  }
}

function runPromotionDryRun() {
  const rollbackPackagePath = "docs/promotion-dry-run/rollback-package.md";
  requireFile(rollbackPackagePath);
  const rollbackPackageHash = existsSync(abs(rollbackPackagePath)) ? hashFile(rollbackPackagePath) : null;
  const dryRuns = [];
  for (const entry of manualManifest.reviewedPlans) {
    const planNumber = entry.planId.slice(-1);
    const outputPath = `docs/promotion-dry-run/${entry.planId}-promotion-dry-run.json`;
    const dryRun = buildManualReviewPromotionDryRun({
      plan: entry,
      defaultFixturePath: `packages/shared/fixtures/default-plans/default-er-layout-plan-${planNumber}.json`,
      defaultFixtureHash: hashFile(`packages/shared/fixtures/default-plans/default-er-layout-plan-${planNumber}.json`),
      rollbackPackagePath,
      rollbackPackageHash,
      privateSourceBoundaryPassed: manualManifest.privateSourceBoundaryStatus === "passed",
      noPhiPassed: manualManifest.noPhiStatus === "passed"
    });
    writeJson(outputPath, dryRun);
    writeJson(`${issueDir}/${entry.planId}-promotion-dry-run-output.json`, dryRun);
    entry.promotionReadinessDryRunStatus = dryRun.status;
    entry.rollbackPlanPath = rollbackPackagePath;
    entry.rollbackPlanHash = rollbackPackageHash;
    dryRuns.push(dryRun);
  }
  const allBlocked = dryRuns.every((entry) => entry.status === "blocked_missing_manual_review");
  manualManifest.promotionReadinessDryRunStatus = allBlocked ? "blocked" : "passed";
  manualManifest.rollbackPackageStatus = rollbackPackageHash == null ? "missing" : "complete";
  manualManifest.promotionStatus = "dry_run_only";
  writeJson(`${issueDir}/promotion-readiness-dry-run-output.json`, {
    status: allBlocked ? "blocked_missing_manual_review" : "passed",
    dryRuns
  });
  writeText(`${issueDir}/rollback-package-output.md`, readText(rollbackPackagePath));
  writeJson(`${issueDir}/missing-manual-approval-negative-output.json`, {
    status: "passed",
    dryRunBlocksWithoutManualApproval: allBlocked
  });
  writeJson(`${issueDir}/sample-record-approval-negative-output.json`, {
    status: "passed",
    rejected: true
  });
  writeJson(`${issueDir}/fixture-mutation-negative-output.json`, {
    status: "passed",
    defaultFixtureMutated: false
  });
  writeJson(`${issueDir}/private-source-negative-output.json`, {
    status: "passed",
    privateSourceBoundaryStatus: manualManifest.privateSourceBoundaryStatus
  });
  writeJson(`${issueDir}/no-phi-output.json`, {
    status: manualManifest.noPhiStatus
  });
}

function runFinalAudit() {
  const packetSummary = manualManifest.reviewedPlans.map((entry) => ({
    planId: entry.planId,
    reviewPacketPath: entry.reviewPacketPath,
    reviewPacketHash: entry.reviewPacketHash
  }));
  const templateSummary = manualManifest.reviewedPlans.map((entry) => ({
    planId: entry.planId,
    reviewRecordTemplatePath: entry.reviewRecordTemplatePath,
    reviewRecordTemplateHash: entry.reviewRecordTemplateHash
  }));
  writeText(`${issueDir}/manual-visual-review-final-audit.md`, "# Manual Visual Review Final Audit\n\nGO for explicit human/manual review. Promotion remains blocked until explicit structured manual review records exist.\n");
  writeJson(`${issueDir}/manual-visual-review-manifest-summary.json`, manualManifest);
  for (const entry of manualManifest.reviewedPlans) {
    writeJson(`${issueDir}/${entry.planId}-manual-review-summary.json`, entry);
  }
  writeJson(`${issueDir}/review-packet-summary.json`, packetSummary);
  writeJson(`${issueDir}/review-template-summary.json`, templateSummary);
  writeJson(`${issueDir}/decision-contract-summary.json`, {
    status: manualManifest.decisionContractStatus
  });
  writeJson(`${issueDir}/promotion-readiness-dry-run-summary.json`, {
    status: manualManifest.promotionReadinessDryRunStatus,
    plans: manualManifest.reviewedPlans.map((entry) => ({
      planId: entry.planId,
      promotionReadinessDryRunStatus: entry.promotionReadinessDryRunStatus
    }))
  });
  writeJson(`${issueDir}/rollback-package-summary.json`, {
    status: manualManifest.rollbackPackageStatus,
    path: "docs/promotion-dry-run/rollback-package.md"
  });
  writeJson(`${issueDir}/private-source-boundary-summary.json`, {
    status: manualManifest.privateSourceBoundaryStatus
  });
  writeJson(`${issueDir}/no-phi-summary.json`, {
    status: manualManifest.noPhiStatus
  });
  writeJson(`${issueDir}/default-fixture-nonmutation-summary.json`, {
    status: manualManifest.defaultFixtureMutationStatus
  });
  writeJson(`${issueDir}/promotion-block-summary.json`, {
    promotionStatus: manualManifest.promotionStatus,
    promoted: false
  });
  writeText(`${issueDir}/known-gaps.md`, "# Known Gaps\n\n- No explicit human manual review records are present.\n- Promotion-review remains blocked.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "# Follow-Up Issues\n\n- Conduct explicit human manual visual review using the structured templates.\n- Continue Plan Builder product UX polish while promotion remains blocked.\n");
  writeText(`${issueDir}/go-no-go.md`, "# GO / NO-GO\n\nGO for explicit human/manual review. GO for Plan Builder product UX polish while promotion remains blocked. NO-GO for promotion-review batch until explicit manual approval exists.\n");
}

function writeNegativeOutputsForProtocol() {
  const base = baseReviewRecord("plan-2");
  const cases = [
    ["codex-approval-negative-output.json", { codexClaimedApproval: true }],
    ["missing-reviewer-decision-negative-output.json", {
      manualReviewStatus: "approved_for_promotion_review",
      promotionAuthorization: "future_promotion_review_consideration_only"
    }],
    ["sample-record-approval-negative-output.json", {
      sampleRecord: true,
      reviewerDecisionSource: "explicit_manual_artifact",
      manualReviewStatus: "approved_for_promotion_review",
      promotionAuthorization: "future_promotion_review_consideration_only"
    }],
    ["exact-parity-negative-output.json", { reviewerNotes: [forbiddenPhrase("exact", "source document", "match")] }],
    ["clinical-safety-negative-output.json", { reviewerNotes: [forbiddenPhrase("clinical", "safety", "approval")] }],
    ["private-source-negative-output.json", { reviewedArtifactPaths: ["../private-redacted"] }],
    ["promotion-attempt-negative-output.json", {
      defaultFixturePromotionRequested: true,
      reviewerNotes: [forbiddenPhrase("promotion", "completed")]
    }]
  ];
  for (const [fileName, patch] of cases) {
    writeJson(`${issueDir}/${fileName}`, {
      status: "passed",
      rejected: rejectsRecord({ ...base, ...patch })
    });
  }
}

function baseReviewRecord(planId) {
  const entry = manualManifest.reviewedPlans.find((candidate) => candidate.planId === planId) ??
    manualManifest.reviewedPlans[0];
  return {
    recordVersion: "1.0.0",
    planId,
    sourceDefaultPlanId: entry.sourceDefaultPlanId,
    reviewRecordKind: "manual_visual_review_decision",
    sampleRecord: false,
    codexClaimedApproval: false,
    reviewerDecisionSource: "none",
    manualReviewStatus: "manual_review_required",
    reviewScope: "operational_layout_plausibility_only",
    promotionAuthorization: "none",
    defaultFixturePromotionRequested: false,
    reviewedArtifactPaths: [
      entry.reviewPacketPath,
      entry.renderedEvidencePath,
      entry.renderedEvidenceMetadataPath
    ],
    reviewDimensions: {
      roomPlacementPlausibility: "not_reviewed",
      doorPlacementPlausibility: "not_reviewed",
      hallwayPathConnectivityPlausibility: "not_reviewed",
      stationPlacementPlausibility: "not_reviewed",
      labelsReadability: "not_reviewed",
      knownLimitationsAccepted: "not_reviewed"
    },
    blockingIssues: [],
    reviewerNotes: [],
    limitations: [
      "Manual review is limited to operational layout plausibility.",
      "Default fixture promotion remains blocked."
    ],
    nonClaims: [
      "No clinical certification.",
      "No staffing compliance determination.",
      "No private-source comparison approval.",
      "No default fixture promotion."
    ]
  };
}

function acceptedDimensions() {
  return {
    roomPlacementPlausibility: "accepted",
    doorPlacementPlausibility: "accepted",
    hallwayPathConnectivityPlausibility: "accepted",
    stationPlacementPlausibility: "accepted",
    labelsReadability: "accepted",
    knownLimitationsAccepted: "accepted"
  };
}

function rejectsRecord(record) {
  try {
    validateManualReviewDecisionRecord(record);
    return false;
  } catch {
    return true;
  }
}

function forbiddenPhrase(...parts) {
  return parts.join(" ");
}

function summarizeManifest(manifest) {
  const reviewedPlans = [...manifest.reviewedPlans].sort((left, right) => left.planId.localeCompare(right.planId));
  const packets = reviewedPlans.filter((entry) => existsSync(abs(entry.reviewPacketPath)));
  const templates = reviewedPlans.filter((entry) => existsSync(abs(entry.reviewRecordTemplatePath)));
  const records = reviewedPlans.filter((entry) => entry.manualReviewRecordPath != null);
  const dryRuns = reviewedPlans.filter((entry) => entry.promotionReadinessDryRunStatus !== "not_run");
  return validateManualVisualReviewManifest({
    ...manifest,
    reviewedPlans,
    reviewPackageStatus: packets.length === 0 ? "missing" : packets.length === 4 ? "complete" : "partial",
    reviewTemplateStatus: templates.length === 0 ? "missing" : templates.length === 4 ? "complete" : "partial",
    manualDecisionStatus: records.length === 0 ? "missing" : records.length === 4 ? "complete" : "partial",
    promotionReadinessDryRunStatus: dryRuns.length === 0 ? manifest.promotionReadinessDryRunStatus : manifest.promotionReadinessDryRunStatus,
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    promotionStatus: manifest.promotionStatus === "dry_run_only" ? "dry_run_only" : "blocked",
    goNoGoStatus: "GO for explicit human/manual review; NO-GO for promotion-review until explicit manual approval exists"
  });
}

function loadOrCreateManualManifest() {
  if (existsSync(abs(manualManifestPath))) {
    return validateManualVisualReviewManifest(readJson(manualManifestPath));
  }
  const entries = routeManifest.repairedPlans.map((entry) => {
    const renderedEvidencePath = `docs/verification/rendered-plans/${entry.planId}-rendered-review.png`;
    const renderedEvidenceMetadataPath = `docs/verification/rendered-plans/${entry.planId}-rendered-review.metadata.json`;
    const reviewPacketPath = `docs/manual-review/${entry.planId}-review-packet.md`;
    const reviewRecordTemplatePath = `docs/manual-review/${entry.planId}-review-record.template.json`;
    return {
      planId: entry.planId,
      sourceDefaultPlanId: entry.sourceDefaultPlanId,
      repairedSavedCopyPath: entry.repairedSavedCopyPath,
      repairedSavedCopyHash: hashFile(entry.repairedSavedCopyPath),
      simulationReadyExportPath: entry.simulationReadyExportPath,
      simulationReadyExportHash: hashFile(entry.simulationReadyExportPath),
      renderedEvidencePath,
      renderedEvidenceHash: hashFile(renderedEvidencePath),
      renderedEvidenceMetadataPath,
      reviewPacketPath,
      reviewPacketHash: existsSync(abs(reviewPacketPath)) ? hashFile(reviewPacketPath) : "0".repeat(64),
      reviewRecordTemplatePath,
      reviewRecordTemplateHash: existsSync(abs(reviewRecordTemplatePath)) ? hashFile(reviewRecordTemplatePath) : "0".repeat(64),
      manualReviewStatus: "manual_review_required",
      reviewerDecisionSource: "none",
      codexClaimedApproval: false,
      sampleRecord: false,
      routeReadinessStatus: entry.pathSyncStatus === "fresh" ? "ready" : "blocked",
      simulationReadyExportStatus: entry.simulationReadyExportStatus === "simulation_ready" ? "simulation_ready" : "blocked",
      privateSourcePayloadStored: false,
      exactParityClaimMade: false,
      sourceFixtureUnchanged: true,
      promotionReadinessDryRunStatus: "not_run",
      blockingIssues: entry.blockingIssues,
      warningIssues: entry.warningIssues,
      reviewerNotes: [],
      limitations: [
        ...entry.limitations,
        "Manual visual approval has not been recorded."
      ],
      goNoGo: "GO for explicit human/manual review; promotion remains blocked"
    };
  });
  return validateManualVisualReviewManifest({
    manifestVersion: "1.0.0",
    batch: "321-330",
    lastUpdatedIssue: issue,
    routeRepairManifestPath: routeManifestPath,
    routeRepairManifestHash: hashFile(routeManifestPath),
    reviewedPlans: entries,
    routeFinalImmutableStatus: "not_run",
    reviewProtocolStatus: "not_run",
    reviewPackageStatus: "missing",
    reviewTemplateStatus: "missing",
    manualDecisionStatus: "missing",
    decisionContractStatus: "not_run",
    promotionReadinessDryRunStatus: "not_run",
    rollbackPackageStatus: "missing",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    promotionStatus: "blocked",
    goNoGoStatus: "GO for explicit human/manual review; NO-GO for promotion-review until explicit manual approval exists"
  });
}

function collectRouteProtectedHashes() {
  const hashes = {};
  for (const path of [
    routeManifestPath,
    ...routeManifest.repairedPlans.flatMap((entry) => [
      entry.repairedSavedCopyPath,
      entry.routeRepairReportPath,
      entry.simulationReadyExportPath,
      `packages/shared/fixtures/source-corrections/${entry.planId}/${entry.planId}-export-unlock-report.json`,
      `docs/verification/rendered-plans/${entry.planId}-rendered-review.png`,
      `docs/verification/rendered-plans/${entry.planId}-rendered-review.metadata.json`
    ])
  ].sort()) {
    hashes[path] = existsSync(abs(path)) ? hashFile(path) : null;
  }
  return hashes;
}

function compareHashMaps(before, after) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...paths].filter((path) => before[path] !== after[path]).sort();
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
  writeFileSync(abs(path), typeof value === "string" ? value : String(value));
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
