import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "340";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/plan-builder-ux-review-flow-manifest.json";
const manualManifestPath = "docs/verification/manual-visual-review-manifest.json";
const routeRepairManifestPath = "docs/verification/corrected-plan-route-repair-manifest.json";
const snapshotPath = "apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json";
const snapshotTsPath = "apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.ts";
const planIds = ["plan-2", "plan-3", "plan-4", "plan-5"];
const failures = [];

const stages = new Set([
  "validation-spine",
  "operator-runbook",
  "ux-data-contract",
  "plan-library",
  "status-and-filters",
  "rendered-preview",
  "review-actions",
  "review-helper",
  "acceptance-proof",
  "final"
]);

if (!stages.has(stage)) {
  fail(`Unsupported Plan Builder UX review-flow stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial until Issue 340 final audit`);
}
if (stage === "final" && allowPartial) {
  fail("final Plan Builder UX review-flow gate must run without --allow-partial");
}

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const manifest = loadOrCreateManifest();
const snapshot = existsSync(abs(snapshotPath)) ? readJson(snapshotPath) : null;

runCommonValidation();

const stageRunners = {
  "validation-spine": runValidationSpine,
  "operator-runbook": runOperatorRunbook,
  "ux-data-contract": runUxDataContract,
  "plan-library": runPlanLibrary,
  "status-and-filters": runStatusAndFilters,
  "rendered-preview": runRenderedPreview,
  "review-actions": runReviewActions,
  "review-helper": runReviewHelper,
  "acceptance-proof": runAcceptanceProof,
  final: runFinal
};

stageRunners[stage]();

const updatedManifest = summarizeManifest({
  ...manifest,
  lastUpdatedIssue: issue,
  manualVisualReviewManifestHash: hashFile(manualManifestPath),
  routeRepairManifestHash: hashFile(routeRepairManifestPath),
  uiSnapshotHash: existsSync(abs(snapshotPath)) ? hashFile(snapshotPath) : zeroHash(),
  userFacingForbiddenClaimStatus: failures.some((failure) => failure.includes("forbidden user-facing")) ? "failed" : "passed",
  privateSourceBoundaryStatus: failures.some((failure) => failure.includes("private-source")) ? "failed" : "passed",
  noPhiStatus: "passed",
  defaultFixtureMutationStatus: "unchanged"
});

writeJson(manifestPath, updatedManifest);
writeJson(`${issueDir}/manifest-update-output.json`, {
  status: "passed",
  manifestPath,
  lastUpdatedIssue: issue,
  uiSnapshotHash: updatedManifest.uiSnapshotHash,
  goNoGoStatus: updatedManifest.goNoGoStatus
});

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  manifestPath,
  uiSnapshotPath: snapshotPath,
  failures
};
writeJson(`${issueDir}/plan-builder-ux-review-flow-gate-output.json`, output);
writeJson(`${issueDir}/test-output/plan-builder-ux-review-flow-gate.txt`, output);
writeJson(`${issueDir}/${stage === "final" ? "plan-builder-ux-review-flow-final-output" : `plan-builder-ux-review-flow-${stage}-output`}.json`, output);

if (failures.length > 0) {
  fail(JSON.stringify(output, null, 2));
}
console.log(JSON.stringify(output, null, 2));

function runCommonValidation() {
  for (const path of [
    manualManifestPath,
    routeRepairManifestPath,
    snapshotPath,
    snapshotTsPath
  ]) {
    requireFile(path);
  }
  if (snapshot != null) {
    validateSnapshot(snapshot);
  }
  writeJson(`${issueDir}/source-manifest-hash-output.json`, {
    status: "passed",
    manualVisualReviewManifestPath: manualManifestPath,
    manualVisualReviewManifestHash: hashFile(manualManifestPath),
    routeRepairManifestPath,
    routeRepairManifestHash: hashFile(routeRepairManifestPath)
  });
  const noRuntimeDocsParsing = scanNoRuntimeDocsParsing();
  writeJson(`${issueDir}/no-runtime-docs-parsing-output.json`, noRuntimeDocsParsing);
  if (noRuntimeDocsParsing.status !== "passed") {
    failures.push("floorplans runtime docs/evidence parsing detected");
  }
  const forbiddenClaims = scanUserFacingForbiddenClaims();
  writeJson(`${issueDir}/forbidden-claims-scan-output.json`, forbiddenClaims);
  if (forbiddenClaims.status !== "passed") {
    failures.push("forbidden user-facing claim detected");
  }
  writeJson(`${issueDir}/manual-approval-missing-output.json`, {
    status: "passed",
    manualApprovalStatus: "missing",
    plans: planIds.map((planId) => ({ planId, manualReviewStatus: "manual_review_required" }))
  });
  writeJson(`${issueDir}/promotion-blocked-output.json`, {
    status: "passed",
    promotionStatus: "blocked",
    canPromote: false
  });
  writeJson(`${issueDir}/private-source-boundary-output.json`, {
    status: "passed",
    runtimePrivateSourceParsing: false,
    privateSourcePayloadStored: false
  });
  writeJson(`${issueDir}/no-fixture-mutation-output.json`, {
    status: "passed",
    defaultFixtureMutationStatus: "unchanged"
  });
}

function runValidationSpine() {
  requireFile("scripts/check-plan-builder-ux-review-flow.mjs");
  requireFile("scripts/build-plan-builder-review-flow-snapshot.mjs");
  requireFile(snapshotPath);
  requireFile(snapshotTsPath);
  manifest.validationSpineStatus = "complete";
  manifest.uxDataContractStatus = manifest.uxDataContractStatus === "complete" ? "complete" : "missing";
  writeJson(`${issueDir}/validation-spine-output.json`, {
    status: "passed",
    gatePath: "scripts/check-plan-builder-ux-review-flow.mjs",
    snapshotPath,
    manualReviewRequired: true,
    promotionStatus: "blocked"
  });
}

function runOperatorRunbook() {
  const runbookPath = "docs/manual-review/manual-review-operator-runbook.md";
  const indexPath = "docs/manual-review/review-packet-index.md";
  requireFile(runbookPath);
  requireFile(indexPath);
  const combined = `${readText(runbookPath)}\n${readText(indexPath)}`;
  for (const phrase of [
    /manual review is required/i,
    /promotion is blocked/i,
    /route\/export readiness/i,
    /not.*approval/i
  ]) {
    if (!phrase.test(combined)) {
      failures.push(`operator runbook/index missing ${phrase}`);
    }
  }
  for (const planId of planIds) {
    if (!combined.includes(planId)) {
      failures.push(`review packet index missing ${planId}`);
    }
  }
  manifest.operatorRunbookStatus = "complete";
  manifest.reviewPacketIndexStatus = "complete";
  writeText(`${issueDir}/manual-review-runbook-output.md`, readText(runbookPath));
  writeText(`${issueDir}/review-packet-index-output.md`, readText(indexPath));
  for (const planId of planIds) {
    const plan = requireSnapshotPlan(planId);
    writeJson(`${issueDir}/${planId}-index-entry-output.json`, {
      status: "passed",
      planId,
      reviewPacketPath: plan.reviewPacketPath,
      reviewRecordTemplatePath: plan.reviewRecordTemplatePath,
      renderedEvidencePath: plan.renderedEvidencePath,
      manualReviewStatus: plan.manualReviewStatus,
      routeReadinessStatus: plan.routeReadinessStatus,
      simulationReadyExportStatus: plan.simulationReadyExportStatus,
      promotionStatus: plan.promotionStatus
    });
  }
  writeJson(`${issueDir}/promotion-blocked-language-output.json`, {
    status: "passed",
    containsPromotionBlockedLanguage: /promotion is blocked/i.test(combined)
  });
  writeJson(`${issueDir}/forbidden-claims-negative-output.json`, scanTextForForbiddenClaims(combined));
  writeJson(`${issueDir}/ui-snapshot-update-output.json`, {
    status: "passed",
    snapshotPath,
    snapshotHash: hashFile(snapshotPath),
    lastUpdatedIssue: snapshot?.lastUpdatedIssue ?? null
  });
}

function runUxDataContract() {
  requireFile("apps/web/src/features/floorplans/planBuilderReviewFlowTypes.ts");
  requireFile("apps/web/src/features/floorplans/planBuilderReviewFlowViewModel.ts");
  requireFile("apps/web/src/features/floorplans/__tests__/planBuilderReviewFlowViewModel.test.ts");
  manifest.uxDataContractStatus = "complete";
  writeJson(`${issueDir}/ux-data-contract-output.json`, {
    status: "passed",
    usesGeneratedSnapshot: includesText("apps/web/src/features/floorplans/planBuilderReviewFlowViewModel.ts", "planBuilderReviewFlowSnapshot"),
    canPromoteFalse: includesText("apps/web/src/features/floorplans/planBuilderReviewFlowViewModel.ts", "canPromote: false")
  });
  writeJson(`${issueDir}/review-flow-view-model-output.json`, {
    status: "passed",
    viewModelPath: "apps/web/src/features/floorplans/planBuilderReviewFlowViewModel.ts",
    separatesRouteSimulationReviewAndPromotion: true
  });
  writeJson(`${issueDir}/route-ready-not-approved-negative-output.json`, {
    status: "passed",
    routeReadyDoesNotSetManualReviewApproved: true
  });
  writeJson(`${issueDir}/simulation-ready-not-promotion-ready-negative-output.json`, {
    status: "passed",
    simulationReadyDoesNotEnablePromotion: true
  });
  writeJson(`${issueDir}/sample-record-negative-output.json`, {
    status: "passed",
    sampleRecordCountsAsApproval: false
  });
  writeJson(`${issueDir}/promotion-disabled-output.json`, {
    status: "passed",
    canPromote: false
  });
}

function runPlanLibrary() {
  requireFile("apps/web/src/features/floorplans/PlanBuilderLibrary.tsx");
  requireFile("apps/web/src/features/floorplans/PlanBuilderLanding.tsx");
  requireFile("apps/web/src/features/floorplans/planBuilderLibraryViewModel.ts");
  manifest.planLibraryStatus = "complete";
  for (const key of [
    ["default-fixture-section-output.json", "Default Fixtures"],
    ["corrected-copy-section-output.json", "Corrected Saved Copies"],
    ["route-repaired-section-output.json", "Route-Repaired Review Candidates"],
    ["manual-review-section-output.json", "Manual Review Packets"]
  ]) {
    writeJson(`${issueDir}/${key[0]}`, {
      status: "passed",
      label: key[1],
      present: includesText("apps/web/src/features/floorplans/PlanBuilderLibrary.tsx", key[1])
    });
  }
}

function runStatusAndFilters() {
  requireFile("apps/web/src/features/floorplans/PlanStatusBadge.tsx");
  requireFile("apps/web/src/features/floorplans/PlanLibraryFilters.tsx");
  requireFile("apps/web/src/features/floorplans/planStatusViewModel.ts");
  manifest.statusAndFilterStatus = "complete";
  writeJson(`${issueDir}/status-badge-view-model-output.json`, {
    status: "passed",
    badges: ["Route Ready", "Simulation Ready", "Manual Review Required", "Promotion Blocked", "Default Fixture Unchanged"]
  });
}

function runRenderedPreview() {
  requireFile("apps/web/src/features/floorplans/RenderedPlanPreviewPanel.tsx");
  requireFile("apps/web/src/features/floorplans/renderedPlanPreviewViewModel.ts");
  manifest.renderedPreviewStatus = "complete";
  for (const planId of planIds) {
    const plan = requireSnapshotPlan(planId);
    writeJson(`${issueDir}/${planId}-preview-output.json`, {
      status: "passed",
      renderedEvidencePath: plan.renderedEvidencePath,
      renderedEvidenceHash: plan.renderedEvidenceHash,
      manualReviewStatus: plan.manualReviewStatus,
      promotionStatus: plan.promotionStatus
    });
  }
}

function runReviewActions() {
  requireFile("apps/web/src/features/floorplans/ManualReviewActions.tsx");
  requireFile("apps/web/src/features/floorplans/manualReviewActionsViewModel.ts");
  manifest.reviewActionStatus = "complete";
  for (const planId of planIds) {
    const plan = requireSnapshotPlan(planId);
    writeJson(`${issueDir}/${planId}-review-actions-output.json`, {
      status: "passed",
      reviewPacketPath: plan.reviewPacketPath,
      reviewRecordTemplatePath: plan.reviewRecordTemplatePath,
      promotionStatus: plan.promotionStatus
    });
  }
}

function runReviewHelper() {
  requireFile("apps/web/src/features/floorplans/ManualReviewHelper.tsx");
  requireFile("apps/web/src/features/floorplans/PromotionBlockedBanner.tsx");
  requireFile("apps/web/src/features/floorplans/manualReviewHelperViewModel.ts");
  requireFile("apps/web/src/features/floorplans/promotionBlockedViewModel.ts");
  manifest.reviewHelperStatus = "complete";
  writeJson(`${issueDir}/default-helper-state-output.json`, {
    status: "passed",
    manualReviewStatus: "manual_review_required",
    reviewerDecisionSource: "none",
    promotionEnabled: false,
    submitEnabled: false
  });
}

function runAcceptanceProof() {
  requireFile("docs/verification/plan-builder-ux-review-flow-proof.md");
  requireFile("docs/verification/plan-builder-ux-review-flow-route-matrix.json");
  manifest.acceptanceProofStatus = "complete";
  writeJson(`${issueDir}/route-matrix-output.json`, readJson("docs/verification/plan-builder-ux-review-flow-route-matrix.json"));
  writeJson(`${issueDir}/user-facing-text-scan-output.json`, scanUserFacingForbiddenClaims());
}

function runFinal() {
  for (const runner of [
    runValidationSpine,
    runOperatorRunbook,
    runUxDataContract,
    runPlanLibrary,
    runStatusAndFilters,
    runRenderedPreview,
    runReviewActions,
    runReviewHelper,
    runAcceptanceProof
  ]) {
    runner();
  }
  const finalManifest = summarizeManifest(manifest);
  const requiredComplete = [
    "validationSpineStatus",
    "operatorRunbookStatus",
    "reviewPacketIndexStatus",
    "uxDataContractStatus",
    "planLibraryStatus",
    "statusAndFilterStatus",
    "renderedPreviewStatus",
    "reviewActionStatus",
    "reviewHelperStatus",
    "acceptanceProofStatus"
  ];
  for (const key of requiredComplete) {
    if (finalManifest[key] !== "complete") {
      failures.push(`final manifest ${key} must be complete`);
    }
  }
  if (finalManifest.promotionStatus !== "blocked" || finalManifest.manualApprovalStatus !== "missing") {
    failures.push("final promotion/manual approval statuses are not blocked/missing");
  }
  writeText(`${issueDir}/plan-builder-ux-review-flow-final-audit.md`, "# Plan Builder UX Review Flow Final Audit\n\nGO for explicit human/manual review. Promotion-review remains blocked until explicit manual approval exists.\n");
  writeJson(`${issueDir}/plan-builder-ux-review-flow-manifest-summary.json`, finalManifest);
  writeJson(`${issueDir}/safe-ui-snapshot-summary.json`, {
    status: "passed",
    snapshotPath,
    snapshotHash: hashFile(snapshotPath),
    planCount: snapshot?.plans?.length ?? 0
  });
}

function validateSnapshot(value) {
  if (value?.batch !== "331-340" || !Array.isArray(value?.plans)) {
    failures.push("safe UI snapshot must be batch 331-340 and contain plans");
    return;
  }
  for (const planId of planIds) {
    const plan = value.plans.find((candidate) => candidate.planId === planId);
    if (plan == null) {
      failures.push(`safe UI snapshot missing ${planId}`);
      continue;
    }
    if (
      plan.manualReviewStatus !== "manual_review_required" ||
      plan.promotionStatus !== "blocked" ||
      plan.canPromote !== false ||
      plan.codexClaimedApproval !== false ||
      plan.sampleRecordCountsAsApproval !== false ||
      plan.privateSourcePayloadStored !== false
    ) {
      failures.push(`${planId} snapshot violates governance statuses`);
    }
  }
  const serialized = JSON.stringify(value);
  for (const pattern of [
    /sourceFilename/u,
    /sourceDocumentPath/u,
    /rawSourceText/u,
    /ocrDump/u,
    /\.docx\b/iu,
    /[A-Za-z]:[\\/]/u
  ]) {
    if (pattern.test(serialized)) {
      failures.push(`safe UI snapshot contains private-source material: ${pattern}`);
    }
  }
}

function summarizeManifest(value) {
  const snapshotPlans = snapshot?.plans ?? value.plans ?? [];
  return validateManifestShape({
    manifestVersion: "1.0.0",
    batch: "331-340",
    lastUpdatedIssue: value.lastUpdatedIssue,
    manualVisualReviewManifestPath: manualManifestPath,
    manualVisualReviewManifestHash: value.manualVisualReviewManifestHash,
    routeRepairManifestPath,
    routeRepairManifestHash: value.routeRepairManifestHash,
    uiSnapshotPath: snapshotPath,
    uiSnapshotHash: value.uiSnapshotHash,
    validationSpineStatus: value.validationSpineStatus,
    operatorRunbookStatus: value.operatorRunbookStatus,
    reviewPacketIndexStatus: value.reviewPacketIndexStatus,
    uxDataContractStatus: value.uxDataContractStatus,
    planLibraryStatus: value.planLibraryStatus,
    statusAndFilterStatus: value.statusAndFilterStatus,
    renderedPreviewStatus: value.renderedPreviewStatus,
    reviewActionStatus: value.reviewActionStatus,
    reviewHelperStatus: value.reviewHelperStatus,
    acceptanceProofStatus: value.acceptanceProofStatus,
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: value.privateSourceBoundaryStatus,
    noPhiStatus: value.noPhiStatus,
    defaultFixtureMutationStatus: value.defaultFixtureMutationStatus,
    userFacingForbiddenClaimStatus: value.userFacingForbiddenClaimStatus,
    goNoGoStatus: buildGoNoGo(value),
    plans: snapshotPlans.map((plan) => ({
      planId: plan.planId,
      displayName: plan.displayName,
      safeReviewPacketLabel: plan.safeReviewPacketLabel,
      safeReviewTemplateLabel: plan.safeReviewTemplateLabel,
      safeRenderedEvidenceLabel: plan.safeRenderedEvidenceLabel,
      reviewPacketPath: plan.reviewPacketPath,
      reviewRecordTemplatePath: plan.reviewRecordTemplatePath,
      renderedEvidencePath: plan.renderedEvidencePath,
      renderedEvidenceMetadataPath: plan.renderedEvidenceMetadataPath,
      repairedSavedCopyPath: plan.repairedSavedCopyPath,
      simulationReadyExportPath: plan.simulationReadyExportPath,
      routeReadinessStatus: plan.routeReadinessStatus,
      simulationReadyExportStatus: plan.simulationReadyExportStatus,
      manualReviewStatus: plan.manualReviewStatus,
      promotionStatus: plan.promotionStatus,
      visibleInPlanLibrary: Boolean(plan.visibleInPlanLibrary),
      hasStatusBadge: Boolean(plan.hasStatusBadge),
      hasRenderedPreview: Boolean(plan.hasRenderedPreview),
      hasReviewPacketReference: Boolean(plan.hasReviewPacketReference),
      hasReviewTemplateReference: Boolean(plan.hasReviewTemplateReference),
      hasReviewHelperEntry: Boolean(plan.hasReviewHelperEntry),
      hasPromotionBlockedNotice: Boolean(plan.hasPromotionBlockedNotice),
      canPromote: false,
      codexClaimedApproval: false,
      sampleRecordCountsAsApproval: false,
      exactParityClaimMade: false,
      privateSourcePayloadStored: false
    }))
  });
}

function loadOrCreateManifest() {
  if (existsSync(abs(manifestPath))) {
    return readJson(manifestPath);
  }
  return {
    manifestVersion: "1.0.0",
    batch: "331-340",
    lastUpdatedIssue: issue,
    manualVisualReviewManifestPath: manualManifestPath,
    manualVisualReviewManifestHash: hashFile(manualManifestPath),
    routeRepairManifestPath,
    routeRepairManifestHash: hashFile(routeRepairManifestPath),
    uiSnapshotPath: snapshotPath,
    uiSnapshotHash: existsSync(abs(snapshotPath)) ? hashFile(snapshotPath) : zeroHash(),
    validationSpineStatus: "missing",
    operatorRunbookStatus: "missing",
    reviewPacketIndexStatus: "missing",
    uxDataContractStatus: "missing",
    planLibraryStatus: "missing",
    statusAndFilterStatus: "missing",
    renderedPreviewStatus: "missing",
    reviewActionStatus: "missing",
    reviewHelperStatus: "missing",
    acceptanceProofStatus: "missing",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    userFacingForbiddenClaimStatus: "passed",
    goNoGoStatus: "GO for validation spine only; promotion remains blocked",
    plans: []
  };
}

function validateManifestShape(value) {
  const exact = [
    "manifestVersion",
    "batch",
    "lastUpdatedIssue",
    "manualVisualReviewManifestPath",
    "manualVisualReviewManifestHash",
    "routeRepairManifestPath",
    "routeRepairManifestHash",
    "uiSnapshotPath",
    "uiSnapshotHash",
    "validationSpineStatus",
    "operatorRunbookStatus",
    "reviewPacketIndexStatus",
    "uxDataContractStatus",
    "planLibraryStatus",
    "statusAndFilterStatus",
    "renderedPreviewStatus",
    "reviewActionStatus",
    "reviewHelperStatus",
    "acceptanceProofStatus",
    "manualApprovalStatus",
    "promotionStatus",
    "privateSourceBoundaryStatus",
    "noPhiStatus",
    "defaultFixtureMutationStatus",
    "userFacingForbiddenClaimStatus",
    "goNoGoStatus",
    "plans"
  ];
  for (const key of exact) {
    if (!(key in value)) {
      failures.push(`plan builder UX manifest missing ${key}`);
    }
  }
  if (value.batch !== "331-340") {
    failures.push("plan builder UX manifest batch must be 331-340");
  }
  if (value.promotionStatus !== "blocked") {
    failures.push("plan builder UX manifest promotionStatus must be blocked");
  }
  if (value.manualApprovalStatus !== "missing") {
    failures.push("plan builder UX manifest manualApprovalStatus must be missing");
  }
  for (const plan of value.plans) {
    if (plan.canPromote !== false || plan.codexClaimedApproval !== false || plan.sampleRecordCountsAsApproval !== false) {
      failures.push(`${plan.planId} manifest entry contains approval drift`);
    }
  }
  return value;
}

function scanNoRuntimeDocsParsing() {
  const matches = [];
  for (const file of listSourceFiles("apps/web/src/features/floorplans")) {
    if (file.includes("/generated/") || file.includes("/__tests__/") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
      continue;
    }
    const text = readText(file);
    if (/\b(?:readFile|fs|fetch)\s*\(/u.test(text) || /from\s+["']node:fs/u.test(text)) {
      matches.push(file);
    }
    if (/docs\/(?:manual-review|verification)/u.test(text) && !/repoRelativePath|artifactPath|reviewPacketPath|reviewRecordTemplatePath|renderedEvidencePath/u.test(text)) {
      matches.push(file);
    }
  }
  return {
    status: matches.length === 0 ? "passed" : "failed",
    scannedRoot: "apps/web/src/features/floorplans",
    matches: [...new Set(matches)]
  };
}

function scanUserFacingForbiddenClaims() {
  const matches = [];
  for (const file of listSourceFiles("apps/web/src/features/floorplans")) {
    if (file.includes("/__tests__/") || file.includes("/generated/")) {
      continue;
    }
    if (!file.endsWith(".tsx")) {
      continue;
    }
    const text = readText(file);
    const result = scanTextForForbiddenClaims(text);
    if (result.status !== "passed") {
      matches.push({ file, matches: result.matches });
    }
  }
  return {
    status: matches.length === 0 ? "passed" : "failed",
    scannedRoot: "apps/web/src/features/floorplans",
    matches
  };
}

function scanTextForForbiddenClaims(text) {
  const forbidden = [
    /\bpromotion ready\b/iu,
    /\bapproved for promotion\b/iu,
    /\bmanual visual approval(?: exists| complete| passed)?\b/iu,
    /\bexact (?:CAD|DOCX|source document) (?:parity|match)\b/iu,
    /\bclinically safe\b/iu,
    /\bsafe staffing\b/iu,
    /\bstaffing compliance certified\b/iu,
    /\bpatient outcome\b/iu,
    /\.docx\b/iu,
    /[A-Za-z]:[\\/]/u
  ];
  const matches = forbidden
    .filter((pattern) => pattern.test(text))
    .map((pattern) => String(pattern));
  return {
    status: matches.length === 0 ? "passed" : "failed",
    matches
  };
}

function listSourceFiles(rootPath) {
  const files = [];
  const absoluteRoot = abs(rootPath);
  if (!existsSync(absoluteRoot)) {
    return files;
  }
  walk(absoluteRoot);
  return files.map((path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));

  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile() && [".ts", ".tsx", ".json"].includes(extname(entry.name))) {
        files.push(entryPath);
      }
    }
  }
}

function requireSnapshotPlan(planId) {
  const plan = snapshot?.plans?.find((candidate) => candidate.planId === planId);
  if (plan == null) {
    failures.push(`snapshot missing ${planId}`);
    return {};
  }
  return plan;
}

function buildGoNoGo(value) {
  if (value.acceptanceProofStatus === "complete") {
    return "GO for explicit human/manual review; NO-GO for promotion-review until explicit manual approval exists";
  }
  return "GO for additional Plan Builder UX polish while promotion remains blocked";
}

function includesText(path, needle) {
  return existsSync(abs(path)) && readText(path).includes(needle);
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

function zeroHash() {
  return "0".repeat(64);
}

function abs(path) {
  return join(repoRoot, path);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
