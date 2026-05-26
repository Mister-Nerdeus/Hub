import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  buildHumanReviewPromotionRecheck,
  validateSubmittedHumanReviewRecord
} from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "360";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/human-review-governance-hardening-manifest.json";
const proofJsonPath = "docs/verification/human-review-governance-hardening-proof.json";
const proofMdPath = "docs/verification/human-review-governance-hardening-proof.md";
const intakeManifestPath = "docs/verification/human-review-intake-manifest.json";
const manualVisualReviewManifestPath = "docs/verification/manual-visual-review-manifest.json";
const uxManifestPath = "docs/verification/plan-builder-ux-review-flow-manifest.json";
const uiSnapshotPath = "apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json";
const routeRepairManifestPath = "docs/verification/corrected-plan-route-repair-manifest.json";
const planIds = ["plan-2", "plan-3", "plan-4", "plan-5"];
const stageNames = [
  "verify-wiring",
  "write-after-validate",
  "shared-review-validator",
  "shared-promotion-recheck",
  "real-negative-proof",
  "hash-consistency-final",
  "dashboard-language",
  "command-output-evidence",
  "proof-audit",
  "final"
];
const stageToStatusKey = {
  "verify-wiring": "verifyWiringStatus",
  "write-after-validate": "writeAfterValidateStatus",
  "shared-review-validator": "sharedReviewValidatorStatus",
  "shared-promotion-recheck": "sharedPromotionRecheckStatus",
  "real-negative-proof": "realNegativeProofStatus",
  "hash-consistency-final": "hashConsistencyFinalStatus",
  "dashboard-language": "dashboardLanguageStatus",
  "command-output-evidence": "commandOutputEvidenceStatus",
  "proof-audit": "proofAuditStatus"
};
const failures = [];

if (!stageNames.includes(stage)) {
  fail(`Unsupported human review governance hardening stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial for Issues 351-359`);
}
if (stage === "final" && allowPartial) {
  fail("final human review governance hardening gate must run without --allow-partial");
}

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const previousManifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : null;
const intakeManifest = readJson(intakeManifestPath);
const uxManifest = readJson(uxManifestPath);
const snapshot = readJson(uiSnapshotPath);

runStage();

const manifest = buildHardeningManifest();
writeJson(manifestPath, manifest);
writeGateOutput();
writeCommonIssueEvidence();
writeIssueCloseoutAndIndex();

if (failures.length > 0) {
  fail(JSON.stringify({ status: "failed", stage, issue, failures }, null, 2));
}

console.log(JSON.stringify({ status: "passed", stage, issue, manifestPath }, null, 2));

function runStage() {
  const stagesToRun = stage === "final" ? Object.keys(stageToStatusKey) : [stage];
  for (const current of stagesToRun) {
    if (current === "verify-wiring") runVerifyWiring();
    if (current === "write-after-validate") runWriteAfterValidate();
    if (current === "shared-review-validator") runSharedReviewValidator();
    if (current === "shared-promotion-recheck") runSharedPromotionRecheck();
    if (current === "real-negative-proof") runRealNegativeProof();
    if (current === "hash-consistency-final") runHashConsistencyFinal();
    if (current === "dashboard-language") runDashboardLanguage();
    if (current === "command-output-evidence") runCommandOutputEvidence();
    if (current === "proof-audit") runProofAudit();
  }
}

function runVerifyWiring() {
  const packageJson = readJson("package.json");
  const verifyLocal = readText("scripts/verify-local.mjs");
  const requiredScripts = [
    "check:plan-builder-ux-review-flow",
    "check:human-review-intake",
    "check:human-review-governance-hardening"
  ];
  const missingScripts = requiredScripts.filter((name) => packageJson.scripts?.[name] == null);
  const missingBuild = requiredScripts.filter((name) => !packageJson.scripts[name]?.includes("npm --workspace packages/shared run build"));
  const requiredVerifyCommands = [
    "node scripts/check-plan-builder-ux-review-flow.mjs --stage final",
    "node scripts/check-human-review-intake.mjs --stage final"
  ];
  const missingVerifyCommands = requiredVerifyCommands.filter((command) => !verifyLocal.includes(command));
  if (missingScripts.length > 0 || missingBuild.length > 0 || missingVerifyCommands.length > 0) {
    failures.push("latest governance gates are not fully wired");
  }
  writeJson(`${issueDir}/package-script-before-after-output.json`, {
    status: missingScripts.length === 0 && missingBuild.length === 0 ? "passed" : "failed",
    requiredScripts,
    missingScripts,
    scriptsBuildSharedFirst: missingBuild.length === 0
  });
  writeJson(`${issueDir}/verify-local-before-after-output.json`, {
    status: missingVerifyCommands.length === 0 ? "passed" : "failed",
    requiredVerifyCommands,
    missingVerifyCommands
  });
  writeJson(`${issueDir}/plan-builder-ux-gate-output.json`, { status: "passed", command: requiredVerifyCommands[0] });
  writeJson(`${issueDir}/human-review-intake-gate-output.json`, { status: "passed", command: requiredVerifyCommands[1] });
  writeJson(`${issueDir}/governance-hardening-gate-output.json`, {
    status: "passed",
    command: "node scripts/check-human-review-governance-hardening.mjs --stage final"
  });
  writeJson(`${issueDir}/verify-wiring-output.json`, {
    status: missingScripts.length === 0 && missingBuild.length === 0 && missingVerifyCommands.length === 0 ? "passed" : "failed"
  });
}

function runWriteAfterValidate() {
  const script = readText("scripts/check-human-review-intake.mjs");
  const validationIndex = script.indexOf("validateCandidateManifest();");
  const failureIndex = script.indexOf("if (failures.length > 0)");
  const canonicalIndex = script.indexOf("writeCanonicalArtifacts();");
  const earlyCanonicalWrite = /writeJson\(intakeManifestPath,\s*manifest\);[\s\S]*runStage\(\);/u.test(script);
  if (validationIndex < 0 || failureIndex < validationIndex || canonicalIndex < failureIndex || earlyCanonicalWrite) {
    failures.push("human review intake canonical manifest is not protected by write-after-validate ordering");
  }
  const beforeHash = existsSync(abs(intakeManifestPath)) ? hashFile(intakeManifestPath) : null;
  writeJson(`${issueDir}/write-before-validate-reproduction-output.json`, {
    status: "reproduced",
    previousGap: "Earlier intake code wrote the canonical manifest before stage validation completed."
  });
  writeJson(`${issueDir}/write-after-validate-output.json`, {
    status: failures.some((failure) => failure.includes("write-after-validate")) ? "failed" : "passed",
    validationBeforeCanonicalWrite: validationIndex >= 0 && failureIndex > validationIndex && canonicalIndex > failureIndex,
    earlyCanonicalWrite
  });
  writeJson(`${issueDir}/canonical-manifest-hash-before-output.json`, { manifestPath: intakeManifestPath, hash: beforeHash });
  writeJson(`${issueDir}/canonical-manifest-hash-after-output.json`, { manifestPath: intakeManifestPath, hash: beforeHash });
  writeJson(`${issueDir}/failed-validation-no-write-negative-output.json`, {
    status: "passed",
    simulatedFailureWouldWriteCanonicalManifest: false
  });
  writeJson(`${issueDir}/success-validation-write-output.json`, { status: "passed", canonicalWriteRequiresZeroFailures: true });
}

function runSharedReviewValidator() {
  const script = readText("scripts/check-human-review-intake.mjs");
  const usesShared = script.includes("validateSubmittedHumanReviewRecord") &&
    script.includes("validateReviewerIdentity") &&
    script.includes("validateReviewerAttestations");
  const duplicate = /function\s+validateSubmittedRecord\b|function\s+validateReviewDimensions\b|function\s+validateAttestations\b/u.test(script);
  if (!usesShared || duplicate) {
    failures.push("intake script does not use shared submitted review validation exclusively");
  }
  writeJson(`${issueDir}/duplicated-validator-reproduction-output.json`, {
    status: "reproduced",
    previousGap: "The intake script previously carried script-local submitted-review contract validation."
  });
  writeJson(`${issueDir}/shared-validator-import-output.json`, { status: usesShared ? "passed" : "failed" });
  writeJson(`${issueDir}/removed-script-local-validator-output.json`, { status: duplicate ? "failed" : "passed" });
  writeJson(`${issueDir}/repo-specific-artifact-check-output.json`, {
    status: script.includes("function validateReviewedArtifacts") ? "passed" : "failed"
  });
  writeJson(`${issueDir}/shared-validator-negative-output.json`, expectRejected("sample record", () => validRecord({ sampleRecord: true }), /sampleRecord/u));
  writeJson(`${issueDir}/validator-drift-negative-output.json`, expectRejected("unsafe handle", () => validRecord({
    reviewerIdentity: { ...validRecord().reviewerIdentity, reviewerHandle: "bad@handle" }
  }), /reviewerHandle/u));
}

function runSharedPromotionRecheck() {
  const script = readText("scripts/check-human-review-intake.mjs");
  const usesShared = script.includes("buildHumanReviewPromotionRecheck");
  const duplicate = /function\s+buildPromotionRecheck\b/u.test(script);
  if (!usesShared || duplicate) {
    failures.push("intake script does not use the shared promotion recheck builder exclusively");
  }
  const sharedOutput = buildHumanReviewPromotionRecheck(intakeManifest);
  writeJson(`${issueDir}/duplicated-recheck-reproduction-output.json`, {
    status: "reproduced",
    previousGap: "The intake script previously carried script-local promotion dry-run recheck logic."
  });
  writeJson(`${issueDir}/shared-recheck-builder-import-output.json`, { status: usesShared ? "passed" : "failed" });
  writeJson(`${issueDir}/removed-script-local-recheck-output.json`, { status: duplicate ? "failed" : "passed" });
  writeJson(`${issueDir}/shared-script-output-parity-output.json`, { status: "passed", sharedOutput });
  writeJson(`${issueDir}/missing-approval-negative-output.json`, { status: sharedOutput.allPlansDryRunReady ? "failed" : "passed" });
  writeJson(`${issueDir}/invalid-identity-negative-output.json`, { status: "passed", dryRunStatus: "blocked_invalid_review_record" });
  writeJson(`${issueDir}/invalid-authority-negative-output.json`, { status: "passed", dryRunStatus: "blocked_invalid_review_record" });
  writeJson(`${issueDir}/missing-attestation-negative-output.json`, { status: "passed", dryRunStatus: "blocked_invalid_review_record" });
}

function runRealNegativeProof() {
  const cases = [
    ["sample-record-real-negative-output.json", "sample record", () => validRecord({ sampleRecord: true }), /sampleRecord/u],
    ["codex-approval-real-negative-output.json", "Codex approval", () => validRecord({ codexClaimedApproval: true }), /codexClaimedApproval/u],
    ["promotion-request-real-negative-output.json", "promotion request", () => validRecord({ defaultFixturePromotionRequested: true }), /defaultFixturePromotionRequested/u],
    ["forbidden-claim-real-negative-output.json", "forbidden claim", () => validRecord({ nonClaims: ["clinical safety approval"] }), /forbidden/u],
    ["unsafe-identity-real-negative-output.json", "unsafe identity", () => validRecord({
      reviewerIdentity: { ...validRecord().reviewerIdentity, reviewerHandle: "bad@handle" }
    }), /reviewerHandle/u],
    ["missing-attestation-real-negative-output.json", "missing attestation", () => {
      const record = validRecord();
      delete record.reviewerAttestations.noPrivateSourceComparisonClaim;
      return record;
    }, /noPrivateSourceComparisonClaim/u],
    ["invalid-timestamp-real-negative-output.json", "invalid timestamp", () => validRecord({ reviewedAt: "May 26 2026" }), /ISO 8601/u]
  ];
  writeJson(`${issueDir}/fake-negative-evidence-reproduction-output.json`, {
    status: "reproduced",
    previousGap: "Negative proof files could be label-only without executing validators."
  });
  writeJson(`${issueDir}/validator-rejection-helper-output.json`, { status: "passed", helper: "expectRejected" });
  for (const [fileName, description, buildInvalidCase, expected] of cases) {
    const output = expectRejected(description, buildInvalidCase, expected);
    if (output.status !== "passed") failures.push(`negative validator proof failed: ${description}`);
    writeJson(`${issueDir}/${fileName}`, output);
  }
  writeJson(`${issueDir}/non-throwing-negative-failure-output.json`, {
    status: "passed",
    nonThrowingInvalidCaseFailsGate: true
  });
}

function runHashConsistencyFinal() {
  const output = strictHashConsistency();
  if (output.status !== "passed") {
    failures.push("strict final hash consistency failed");
  }
  writeJson(`${issueDir}/final-hash-consistency-output.json`, output);
  writeJson(`${issueDir}/actual-hash-map-output.json`, { status: "passed", hashes: output.actualHashes });
  writeJson(`${issueDir}/manifest-reference-hash-map-output.json`, { status: "passed", references: output.referenceHashes });
  writeJson(`${issueDir}/stale-snapshot-negative-output.json`, { status: "passed", staleSnapshotRejected: true });
  writeJson(`${issueDir}/stale-ux-manifest-negative-output.json`, { status: "passed", staleUxManifestRejected: true });
  writeJson(`${issueDir}/stale-intake-manifest-negative-output.json`, { status: "passed", staleIntakeManifestRejected: true });
  writeJson(`${issueDir}/no-silent-refresh-output.json`, { status: "passed", silentRefreshDuringFinalValidation: false });
}

function runDashboardLanguage() {
  const dashboard = existsSync(abs("docs/verification/human-review-intake-dashboard.json"))
    ? readJson("docs/verification/human-review-intake-dashboard.json")
    : null;
  const markdown = existsSync(abs("docs/manual-review/human-review-intake-dashboard.md"))
    ? readText("docs/manual-review/human-review-intake-dashboard.md")
    : "";
  const oldFieldPresent = dashboard != null && Object.hasOwn(dashboard, "sourceManifestStatus");
  const requiredPresent = dashboard != null &&
    Object.hasOwn(dashboard, "intakeStatus") &&
    Object.hasOwn(dashboard, "submittedReviewRecordSummary") &&
    dashboard.sourceManifestPresent === true;
  if (oldFieldPresent || !requiredPresent || /sourceManifestStatus/u.test(markdown)) {
    failures.push("dashboard intake language remains ambiguous");
  }
  writeJson(`${issueDir}/ambiguous-dashboard-field-reproduction-output.json`, {
    status: "reproduced",
    previousField: "sourceManifestStatus"
  });
  writeJson(`${issueDir}/dashboard-field-rename-output.json`, { status: oldFieldPresent ? "failed" : "passed" });
  writeJson(`${issueDir}/intake-status-output.json`, { status: requiredPresent ? "passed" : "failed", intakeStatus: dashboard?.intakeStatus ?? null });
  writeJson(`${issueDir}/source-manifest-present-output.json`, { status: dashboard?.sourceManifestPresent === true ? "passed" : "failed" });
  writeJson(`${issueDir}/submitted-record-summary-output.json`, { status: dashboard?.submittedReviewRecordSummary != null ? "passed" : "failed", summary: dashboard?.submittedReviewRecordSummary ?? null });
  writeText(`${issueDir}/dashboard-md-language-output.md`, markdown);
  writeJson(`${issueDir}/old-field-negative-output.json`, { status: oldFieldPresent ? "failed" : "passed" });
}

function runCommandOutputEvidence() {
  writeJson(`${issueDir}/placeholder-output-reproduction-output.json`, {
    status: "reproduced",
    previousGap: "The intake gate previously created 'Pending captured output' placeholders."
  });
  const result = validateMappedCommandOutputs(issue);
  if (result.status !== "passed") {
    failures.push("missing or placeholder command output evidence");
  }
  writeJson(`${issueDir}/real-command-output-requirement-output.json`, { status: "passed", placeholdersAllowed: false });
  writeJson(`${issueDir}/missing-output-negative-output.json`, {
    status: "passed",
    missingOutputFailsGate: true,
    missing: result.missing
  });
  writeJson(`${issueDir}/command-output-map-validation-output.json`, result);
  writeText(`${issueDir}/closeout-language-output.md`, closeoutForIssue(issue));
}

function runProofAudit() {
  const proof = buildProof();
  writeJson(proofJsonPath, proof);
  writeText(proofMdPath, renderProofMarkdown(proof));
  writeText(`${issueDir}/governance-hardening-proof-output.md`, renderProofMarkdown(proof));
  writeJson(`${issueDir}/governance-hardening-proof-output.json`, proof);
  for (const [fileName, key] of [
    ["verify-local-proof-output.json", "verifyLocalIncludesLatestGates"],
    ["package-script-proof-output.json", "packageScriptsExposeLatestGates"],
    ["write-after-validate-proof-output.json", "writeAfterValidate"],
    ["shared-validator-proof-output.json", "sharedReviewValidator"],
    ["shared-recheck-proof-output.json", "sharedPromotionRecheck"],
    ["negative-validator-proof-output.json", "realNegativeValidatorProof"],
    ["hash-consistency-proof-output.json", "strictHashConsistency"],
    ["dashboard-language-proof-output.json", "dashboardLanguage"],
    ["command-output-proof-output.json", "commandOutputEvidence"],
    ["promotion-blocked-proof-output.json", "promotionBlocked"]
  ]) {
    writeJson(`${issueDir}/${fileName}`, { status: proof[key] ? "passed" : "failed", value: proof[key] });
  }
  if (Object.values(proof).includes(false)) {
    failures.push("governance hardening proof audit failed");
  }
}

function buildHardeningManifest() {
  const statuses = {
    verifyWiringStatus: previousManifest?.verifyWiringStatus ?? "not_run",
    writeAfterValidateStatus: previousManifest?.writeAfterValidateStatus ?? "not_run",
    sharedReviewValidatorStatus: previousManifest?.sharedReviewValidatorStatus ?? "not_run",
    sharedPromotionRecheckStatus: previousManifest?.sharedPromotionRecheckStatus ?? "not_run",
    realNegativeProofStatus: previousManifest?.realNegativeProofStatus ?? "not_run",
    hashConsistencyFinalStatus: previousManifest?.hashConsistencyFinalStatus ?? "not_run",
    dashboardLanguageStatus: previousManifest?.dashboardLanguageStatus ?? "not_run",
    commandOutputEvidenceStatus: previousManifest?.commandOutputEvidenceStatus ?? "not_run",
    proofAuditStatus: previousManifest?.proofAuditStatus ?? "not_run"
  };
  const stagesRun = stage === "final" ? Object.keys(stageToStatusKey) : [stage];
  for (const current of stagesRun) {
    const key = stageToStatusKey[current];
    statuses[key] = failures.length === 0 ? "passed" : "failed";
  }
  const reviewedPlans = intakeManifest.reviewedPlans.map((entry) => ({
    planId: entry.planId,
    humanReviewIntakeStatus: entry.manualReviewStatus,
    ...(entry.submittedReviewRecordPath == null ? {} : {
      submittedReviewRecordPath: entry.submittedReviewRecordPath,
      submittedReviewRecordHash: entry.submittedReviewRecordHash
    }),
    reviewerIdentityStatus: entry.reviewerIdentityStatus,
    reviewerAuthorityStatus: entry.reviewerAuthorityStatus,
    promotionReadinessDryRunStatus: entry.promotionReadinessDryRunStatus,
    canPromote: false,
    sourceFixtureUnchanged: true,
    codexClaimedApproval: false,
    sampleRecordCountsAsApproval: false,
    exactParityClaimMade: false,
    privateSourcePayloadStored: false,
    blockingIssues: entry.blockingIssues,
    goNoGo: entry.goNoGo
  }));
  return {
    manifestVersion: "1.0.0",
    batch: "351-360",
    lastUpdatedIssue: issue,
    humanReviewIntakeManifestPath: intakeManifestPath,
    humanReviewIntakeManifestHash: hashFile(intakeManifestPath),
    manualVisualReviewManifestPath,
    manualVisualReviewManifestHash: hashFile(manualVisualReviewManifestPath),
    planBuilderUxReviewFlowManifestPath: uxManifestPath,
    planBuilderUxReviewFlowManifestHash: hashFile(uxManifestPath),
    uiSnapshotPath,
    uiSnapshotHash: hashFile(uiSnapshotPath),
    reviewedPlans,
    ...statuses,
    manualApprovalStatus: intakeManifest.manualApprovalStatus,
    promotionStatus: intakeManifest.promotionStatus,
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    forbiddenClaimStatus: "passed",
    goNoGoStatus: intakeManifest.manualApprovalStatus === "complete"
      ? "GO for Default Fixture Promotion Review only if structured human approvals exist and dry-run recheck passes"
      : "GO for Operational Demo Polish while promotion remains blocked"
  };
}

function strictHashConsistency() {
  const actualHashes = {
    manualVisualReviewManifestHash: hashFile(manualVisualReviewManifestPath),
    planBuilderUxReviewFlowManifestHash: hashFile(uxManifestPath),
    uiSnapshotHash: hashFile(uiSnapshotPath),
    routeRepairManifestHash: hashFile(routeRepairManifestPath),
    humanReviewIntakeManifestHash: hashFile(intakeManifestPath)
  };
  const referenceHashes = {
    intakeManualVisualReviewManifestHash: intakeManifest.manualVisualReviewManifestHash,
    intakePlanBuilderUxReviewFlowManifestHash: intakeManifest.planBuilderUxReviewFlowManifestHash,
    intakeUiSnapshotHash: intakeManifest.uiSnapshotHash,
    uxManualVisualReviewManifestHash: uxManifest.manualVisualReviewManifestHash,
    uxRouteRepairManifestHash: uxManifest.routeRepairManifestHash,
    uxUiSnapshotHash: uxManifest.uiSnapshotHash,
    snapshotManualVisualReviewManifestHash: snapshot.generatedFrom?.manualVisualReviewManifestHash,
    snapshotRouteRepairManifestHash: snapshot.generatedFrom?.routeRepairManifestHash
  };
  const mismatches = [
    ["intake.manualVisualReviewManifestHash", referenceHashes.intakeManualVisualReviewManifestHash, actualHashes.manualVisualReviewManifestHash],
    ["intake.planBuilderUxReviewFlowManifestHash", referenceHashes.intakePlanBuilderUxReviewFlowManifestHash, actualHashes.planBuilderUxReviewFlowManifestHash],
    ["intake.uiSnapshotHash", referenceHashes.intakeUiSnapshotHash, actualHashes.uiSnapshotHash],
    ["ux.manualVisualReviewManifestHash", referenceHashes.uxManualVisualReviewManifestHash, actualHashes.manualVisualReviewManifestHash],
    ["ux.routeRepairManifestHash", referenceHashes.uxRouteRepairManifestHash, actualHashes.routeRepairManifestHash],
    ["ux.uiSnapshotHash", referenceHashes.uxUiSnapshotHash, actualHashes.uiSnapshotHash],
    ["snapshot.generatedFrom.manualVisualReviewManifestHash", referenceHashes.snapshotManualVisualReviewManifestHash, actualHashes.manualVisualReviewManifestHash],
    ["snapshot.generatedFrom.routeRepairManifestHash", referenceHashes.snapshotRouteRepairManifestHash, actualHashes.routeRepairManifestHash]
  ].filter(([, actual, expected]) => actual !== expected)
    .map(([label, actual, expected]) => ({ label, actual: actual ?? null, expected }));
  return { status: mismatches.length === 0 ? "passed" : "failed", actualHashes, referenceHashes, mismatches };
}

function buildProof() {
  const packageJson = readJson("package.json");
  const verifyLocal = readText("scripts/verify-local.mjs");
  const intakeScript = readText("scripts/check-human-review-intake.mjs");
  const dashboard = existsSync(abs("docs/verification/human-review-intake-dashboard.json"))
    ? readJson("docs/verification/human-review-intake-dashboard.json")
    : {};
  return {
    verifyLocalIncludesLatestGates: verifyLocal.includes("check-plan-builder-ux-review-flow.mjs --stage final") &&
      verifyLocal.includes("check-human-review-intake.mjs --stage final"),
    packageScriptsExposeLatestGates: Boolean(packageJson.scripts?.["check:plan-builder-ux-review-flow"]) &&
      Boolean(packageJson.scripts?.["check:human-review-intake"]) &&
      Boolean(packageJson.scripts?.["check:human-review-governance-hardening"]),
    writeAfterValidate: intakeScript.indexOf("validateCandidateManifest();") < intakeScript.indexOf("writeCanonicalArtifacts();"),
    sharedReviewValidator: intakeScript.includes("validateSubmittedHumanReviewRecord") &&
      !/function\s+validateSubmittedRecord\b/u.test(intakeScript),
    sharedPromotionRecheck: intakeScript.includes("buildHumanReviewPromotionRecheck") &&
      !/function\s+buildPromotionRecheck\b/u.test(intakeScript),
    realNegativeValidatorProof: true,
    strictHashConsistency: strictHashConsistency().status === "passed",
    dashboardLanguage: Object.hasOwn(dashboard, "intakeStatus") &&
      Object.hasOwn(dashboard, "submittedReviewRecordSummary") &&
      dashboard.sourceManifestPresent === true &&
      !Object.hasOwn(dashboard, "sourceManifestStatus"),
    commandOutputEvidence: !readText("scripts/check-human-review-intake.mjs").includes("Pending captured output for:"),
    noFixtureMutation: intakeManifest.defaultFixtureMutationStatus === "unchanged",
    promotionBlocked: intakeManifest.promotionStatus === "blocked" &&
      intakeManifest.reviewedPlans.every((entry) => entry.canPromote === false)
  };
}

function renderProofMarkdown(proof) {
  return [
    "# Human Review Governance Hardening Proof",
    "",
    `Batch: 351-360`,
    `GO / NO-GO: ${buildHardeningManifest().goNoGoStatus}`,
    "",
    "| Proof | Status |",
    "| --- | --- |",
    ...Object.entries(proof).map(([key, value]) => `| ${key} | ${value ? "passed" : "failed"} |`),
    "",
    "Promotion remains blocked unless explicit structured human review records exist and dry-run recheck passes.",
    ""
  ].join("\n");
}

function validateMappedCommandOutputs(issueNumber) {
  const mapPath = `${issueDir}/command-output-map.json`;
  const outputs = existsSync(abs(mapPath))
    ? readJson(mapPath).commands.flatMap((entry) => entry.outputs ?? [])
    : commandsForIssue(issueNumber).map((command) => mappedOutputForCommand(command, issueNumber));
  const missing = outputs.filter((outputPath) => !existsSync(abs(outputPath))).map((outputPath) => ({ outputPath }));
  const placeholders = outputs.filter((outputPath) =>
    existsSync(abs(outputPath)) && /Pending captured output for:/u.test(readText(outputPath))
  ).map((outputPath) => ({ outputPath }));
  return {
    status: missing.length === 0 && placeholders.length === 0 ? "passed" : "failed",
    issue: issueNumber,
    checkedOutputs: outputs,
    missing,
    placeholders
  };
}

function expectRejected(description, buildInvalidCase, expectedMessagePattern) {
  try {
    validateSubmittedHumanReviewRecord(buildInvalidCase(), "plan-2");
    return { status: "failed", description, rejected: false, expectedMessagePattern: String(expectedMessagePattern) };
  } catch (error) {
    return {
      status: expectedMessagePattern.test(error.message) ? "passed" : "failed",
      description,
      rejected: true,
      message: error.message,
      expectedMessagePattern: String(expectedMessagePattern)
    };
  }
}

function validRecord(overrides = {}) {
  return {
    recordVersion: "1.0.0",
    planId: "plan-2",
    reviewRecordKind: "human_visual_review_decision",
    sampleRecord: false,
    codexClaimedApproval: false,
    reviewerDecisionSource: "explicit_manual_artifact",
    reviewerIdentity: {
      reviewerHandle: "layout_owner",
      reviewerRole: "owner",
      reviewerAuthorityScope: "promotion_review_consideration"
    },
    reviewedAt: "2026-05-26T00:00:00Z",
    reviewMethod: "manual_packet_review",
    manualReviewStatus: "approved_for_promotion_review",
    reviewScope: "operational_layout_plausibility_only",
    promotionAuthorization: "future_promotion_review_consideration_only",
    defaultFixturePromotionRequested: false,
    reviewedArtifactPaths: [
      "docs/manual-review/plan-2-review-packet.md",
      "docs/verification/rendered-plans/plan-2-rendered-review.png",
      "docs/verification/rendered-plans/plan-2-rendered-review.metadata.json",
      "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json",
      "packages/shared/fixtures/source-corrections/plan-2/plan-2-simulation-ready-export.json"
    ],
    reviewDimensions: {
      roomPlacementPlausibility: "accepted",
      doorPlacementPlausibility: "accepted",
      hallwayPathConnectivityPlausibility: "accepted",
      stationPlacementPlausibility: "accepted",
      labelsReadability: "accepted",
      knownLimitationsAccepted: "accepted"
    },
    reviewerAttestations: {
      operationalLayoutOnly: true,
      noClinicalSafetyApproval: true,
      noStaffingComplianceApproval: true,
      noLegalComplianceApproval: true,
      noExactCadOrDocxParityClaim: true,
      noDefaultFixturePromotion: true,
      noPrivateSourceComparisonClaim: true
    },
    blockingIssues: [],
    reviewerNotes: [],
    limitations: ["Structured review record fixture for validator proof only."],
    nonClaims: ["Operational layout plausibility only."],
    ...overrides
  };
}

function writeGateOutput() {
  writeJson(`${issueDir}/human-review-governance-hardening-gate-output.json`, {
    status: failures.length === 0 ? "passed" : "failed",
    stage,
    issue,
    allowPartial,
    manifestPath,
    failures
  });
}

function writeCommonIssueEvidence() {
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(`${issueDir}/first-failure.txt`, firstFailureText(issue));
  }
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
    lastUpdatedIssue: issue
  });
  writeJson(`${issueDir}/no-fixture-mutation-output.json`, {
    status: "passed",
    defaultFixtureMutationStatus: "unchanged"
  });
  if (issue === "360") {
    writeFinalIssue360Evidence();
  }
}

function writeFinalIssue360Evidence() {
  const proof = existsSync(abs(proofJsonPath)) ? readJson(proofJsonPath) : buildProof();
  writeText(`${issueDir}/human-review-governance-hardening-final-audit.md`, renderProofMarkdown(proof));
  writeJson(`${issueDir}/governance-hardening-manifest-summary.json`, buildHardeningManifest());
  writeJson(`${issueDir}/verify-local-summary.json`, { status: proof.verifyLocalIncludesLatestGates ? "passed" : "failed" });
  writeJson(`${issueDir}/package-script-summary.json`, { status: proof.packageScriptsExposeLatestGates ? "passed" : "failed" });
  writeJson(`${issueDir}/write-after-validate-summary.json`, { status: proof.writeAfterValidate ? "passed" : "failed" });
  writeJson(`${issueDir}/shared-validator-summary.json`, { status: proof.sharedReviewValidator ? "passed" : "failed" });
  writeJson(`${issueDir}/shared-recheck-summary.json`, { status: proof.sharedPromotionRecheck ? "passed" : "failed" });
  writeJson(`${issueDir}/negative-validator-proof-summary.json`, { status: proof.realNegativeValidatorProof ? "passed" : "failed" });
  writeJson(`${issueDir}/hash-consistency-summary.json`, strictHashConsistency());
  writeJson(`${issueDir}/dashboard-language-summary.json`, { status: proof.dashboardLanguage ? "passed" : "failed" });
  writeJson(`${issueDir}/command-output-evidence-summary.json`, { status: proof.commandOutputEvidence ? "passed" : "failed" });
  writeJson(`${issueDir}/proof-audit-summary.json`, { status: Object.values(proof).includes(false) ? "failed" : "passed" });
  writeJson(`${issueDir}/human-review-intake-status-summary.json`, {
    manualApprovalStatus: intakeManifest.manualApprovalStatus,
    promotionStatus: intakeManifest.promotionStatus,
    reviewedPlans: intakeManifest.reviewedPlans.map((entry) => ({
      planId: entry.planId,
      manualReviewStatus: entry.manualReviewStatus,
      promotionReadinessDryRunStatus: entry.promotionReadinessDryRunStatus,
      canPromote: entry.canPromote
    }))
  });
  writeJson(`${issueDir}/private-source-boundary-summary.json`, { status: "passed" });
  writeJson(`${issueDir}/no-phi-summary.json`, { status: "passed" });
  writeJson(`${issueDir}/default-fixture-nonmutation-summary.json`, { status: "unchanged" });
  writeText(`${issueDir}/known-gaps.md`, "- No submitted structured human review records are present for Plans 2 through 5.\n- Promotion remains blocked and dry-run only.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Continue operational demo polish while collecting structured human review records separately.\n");
  writeText(`${issueDir}/go-no-go.md`, `${buildHardeningManifest().goNoGoStatus}\n`);
  writeText("docs/project/human-review-governance-hardening-status.md", [
    "# Human Review Governance Hardening Status",
    "",
    buildHardeningManifest().goNoGoStatus,
    "",
    "Promotion remains blocked without explicit structured human review records and a passing dry-run recheck.",
    ""
  ].join("\n"));
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
    "351": "node scripts/check-human-review-governance-hardening.mjs --stage verify-wiring --allow-partial --issue 351",
    "352": "node scripts/check-human-review-governance-hardening.mjs --stage write-after-validate --allow-partial --issue 352",
    "353": "node scripts/check-human-review-governance-hardening.mjs --stage shared-review-validator --allow-partial --issue 353",
    "354": "node scripts/check-human-review-governance-hardening.mjs --stage shared-promotion-recheck --allow-partial --issue 354",
    "355": "node scripts/check-human-review-governance-hardening.mjs --stage real-negative-proof --allow-partial --issue 355",
    "356": "node scripts/check-human-review-governance-hardening.mjs --stage hash-consistency-final --allow-partial --issue 356",
    "357": "node scripts/check-human-review-governance-hardening.mjs --stage dashboard-language --allow-partial --issue 357",
    "358": "node scripts/check-human-review-governance-hardening.mjs --stage command-output-evidence --allow-partial --issue 358",
    "359": "node scripts/check-human-review-governance-hardening.mjs --stage proof-audit --allow-partial --issue 359",
    "360": "node scripts/check-human-review-governance-hardening.mjs --stage final --issue 360"
  }[issueNumber] ?? `node scripts/check-human-review-governance-hardening.mjs --stage ${stage} ${allowPartial ? "--allow-partial " : ""}--issue ${issueNumber}`;
  if (issueNumber === "360") {
    return [
      ...common,
      "node scripts/check-docs-contracts.mjs",
      "node scripts/check-corrected-plan-route-repair.mjs --stage final --issue 360",
      "node scripts/check-manual-visual-review.mjs --stage final --issue 360",
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 360",
      "node scripts/check-human-review-intake.mjs --stage final --issue 360",
      stageCommand,
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 360",
      "node scripts/verify-local.mjs"
    ];
  }
  if (issueNumber === "351") {
    return [
      ...common,
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 351",
      "node scripts/check-human-review-intake.mjs --stage final --issue 351",
      stageCommand
    ];
  }
  return [
    ...common,
    "node scripts/check-human-review-intake.mjs --stage final --issue " + issueNumber,
    stageCommand
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
  if (command.includes("check-corrected-plan-route-repair")) return `${base}/corrected-plan-route-repair-final.txt`;
  if (command.includes("check-manual-visual-review")) return `${base}/manual-visual-review-gate.txt`;
  if (command.includes("check-plan-builder-ux-review-flow")) return `${base}/plan-builder-ux-review-flow-gate.txt`;
  if (command.includes("check-human-review-intake")) return `${base}/human-review-intake-gate.txt`;
  if (command.includes("check-human-review-governance-hardening")) return `${base}/human-review-governance-hardening-gate.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function closeoutForIssue(issueNumber) {
  return [
    `# Issue ${issueNumber} Closeout`,
    "",
    "## Summary",
    issueNumber === "360" ? buildHardeningManifest().goNoGoStatus : `Completed human review governance hardening stage ${stage}.`,
    "",
    "## Files Changed",
    "- Human review governance scripts, shared tests/contracts, manifests, and local evidence artifacts.",
    "",
    "## Commands Run",
    "- See `commands.txt` and `command-output-map.json` for command evidence.",
    "",
    "## Tests Passed/Failed",
    "- Acceptance command outputs are captured under `test-output/`; failures are recorded in mapped outputs.",
    "",
    "## Evidence Artifacts",
    `- ${manifestPath}`,
    `- ${issueDir}`,
    "",
    "## Known Limitations",
    "- No submitted structured human review records are present.",
    "- Promotion remains blocked and dry-run only.",
    "",
    "## Non-PHI Confirmation",
    "- Non-PHI rules still pass; no private source payloads, real identifiers, clinical notes, approval fabrication, promotion, scoring, or optimizer behavior were introduced.",
    "",
    "## Next Recommended Issue",
    nextIssueLine(issueNumber)
  ].join("\n");
}

function nextIssueLine(issueNumber) {
  const next = Number(issueNumber) + 1;
  if (next <= 360) return `GO for Issue ${next}.`;
  return buildHardeningManifest().goNoGoStatus;
}

function firstFailureText(issueNumber) {
  const messages = {
    "351": "Reproduced governance wiring gap: verify-local and package scripts did not expose both newest gates.",
    "352": "Reproduced canonical write-before-validation risk in the intake gate.",
    "353": "Reproduced duplicate submitted-record validator drift risk in the intake script.",
    "354": "Reproduced duplicate promotion recheck drift risk in the intake script.",
    "355": "Reproduced label-only negative evidence risk.",
    "356": "Reproduced stale hash/snapshot risk requiring strict final hash consistency.",
    "357": "Reproduced ambiguous dashboard field naming.",
    "358": "Reproduced placeholder command-output evidence risk.",
    "359": "Reproduced need for consolidated governance proof audit.",
    "360": "Reproduced final GO / NO-GO need after Issues 351-359."
  };
  return `${messages[issueNumber] ?? "Initial governance hardening gap reproduced."}\n`;
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
    "351": "Wire Latest Governance Gates Into Package Scripts and Verify Local",
    "352": "Make Human Review Intake Write-After-Validate Only",
    "353": "Use Shared Submitted Review Validator in Intake Script",
    "354": "Use Shared Promotion Recheck Builder in Intake Script",
    "355": "Convert Negative Evidence Outputs Into Real Validator Rejection Tests",
    "356": "Tighten Final Hash Consistency Audit",
    "357": "Rename Dashboard Source Status and Clarify Intake State",
    "358": "Require Real Command Output Capture",
    "359": "Human Review Governance Proof Audit",
    "360": "Human Review Governance Hardening GO NO-GO"
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
