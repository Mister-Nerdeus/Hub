import { assertNoForbiddenSourcePayload } from "./authoringDraftContract.js";
import { assertNoForbiddenDecisionClaims } from "./manualReviewDecisionContract.js";
import { HUMAN_REVIEW_PLAN_IDS, type HumanReviewPlanId } from "./humanReviewIdentityAuthorityContract.js";

export const HUMAN_REVIEW_INTAKE_BATCH = "341-350" as const;

export type HumanReviewIntakeEntry = {
  planId: HumanReviewPlanId;
  sourceDefaultPlanId: string;
  reviewPacketPath: string;
  reviewRecordTemplatePath: string;
  renderedEvidencePath: string;
  renderedEvidenceMetadataPath: string;
  repairedSavedCopyPath: string;
  simulationReadyExportPath: string;
  submittedReviewRecordPath?: string;
  submittedReviewRecordHash?: string;
  manualReviewStatus:
    | "manual_review_required"
    | "approved_for_promotion_review"
    | "approved_with_notes"
    | "rejected_needs_correction"
    | "blocked_invalid_review_record"
    | "blocked_missing_reviewer_decision";
  reviewerDecisionSource: "none" | "explicit_manual_artifact" | "operator_entered_structured_decision";
  reviewerIdentityStatus: "not_present" | "present" | "invalid" | "not_required_until_record_exists";
  reviewerAuthorityStatus: "not_present" | "authorized" | "unauthorized" | "not_required_until_record_exists";
  routeReadinessStatus: "ready" | "blocked";
  simulationReadyExportStatus: "simulation_ready" | "blocked";
  promotionReadinessDryRunStatus:
    | "blocked_missing_manual_review"
    | "dry_run_ready"
    | "blocked_by_route_export"
    | "blocked_by_boundary"
    | "blocked_invalid_review_record";
  codexClaimedApproval: false;
  sampleRecordCountsAsApproval: false;
  exactParityClaimMade: false;
  privateSourcePayloadStored: false;
  sourceFixtureUnchanged: true;
  canPromote: false;
  blockingIssues: string[];
  warningIssues: string[];
  reviewerNotes: string[];
  limitations: string[];
  goNoGo: string;
};

export type HumanReviewIntakeManifest = {
  manifestVersion: string;
  batch: typeof HUMAN_REVIEW_INTAKE_BATCH;
  lastUpdatedIssue: string;
  manualVisualReviewManifestPath: string;
  manualVisualReviewManifestHash: string;
  planBuilderUxReviewFlowManifestPath: string;
  planBuilderUxReviewFlowManifestHash: string;
  uiSnapshotPath: string;
  uiSnapshotHash: string;
  reviewedPlans: HumanReviewIntakeEntry[];
  hashConsistencyStatus: "not_run" | "passed" | "failed";
  protocolStatus: "not_run" | "passed" | "failed";
  identityAuthorityContractStatus: "not_run" | "passed" | "failed";
  intakeStatus: "missing" | "partial" | "complete";
  dashboardStatus: "missing" | "partial" | "complete";
  promotionDryRunRecheckStatus: "not_run" | "passed" | "blocked";
  manualApprovalStatus: "missing" | "partial" | "complete";
  promotionStatus: "blocked" | "dry_run_only";
  privateSourceBoundaryStatus: "passed" | "failed";
  noPhiStatus: "passed" | "failed";
  defaultFixtureMutationStatus: "unchanged" | "changed" | "unknown";
  forbiddenClaimStatus: "passed" | "failed";
  goNoGoStatus: string;
};

export function validateHumanReviewIntakeManifest(value: unknown): HumanReviewIntakeManifest {
  assertNoForbiddenSourcePayload(value, "humanReviewIntakeManifest");
  assertNoForbiddenDecisionClaims(value, "humanReviewIntakeManifest");
  const manifest = requireRecord(value, "humanReviewIntakeManifest");
  requireExactKeys(manifest, "humanReviewIntakeManifest", [
    "manifestVersion",
    "batch",
    "lastUpdatedIssue",
    "manualVisualReviewManifestPath",
    "manualVisualReviewManifestHash",
    "planBuilderUxReviewFlowManifestPath",
    "planBuilderUxReviewFlowManifestHash",
    "uiSnapshotPath",
    "uiSnapshotHash",
    "reviewedPlans",
    "hashConsistencyStatus",
    "protocolStatus",
    "identityAuthorityContractStatus",
    "intakeStatus",
    "dashboardStatus",
    "promotionDryRunRecheckStatus",
    "manualApprovalStatus",
    "promotionStatus",
    "privateSourceBoundaryStatus",
    "noPhiStatus",
    "defaultFixtureMutationStatus",
    "forbiddenClaimStatus",
    "goNoGoStatus"
  ]);
  const reviewedPlans = requireArray(manifest.reviewedPlans, "reviewedPlans").map(validateEntry);
  const planIds = reviewedPlans.map((entry) => entry.planId);
  if (new Set(planIds).size !== planIds.length) {
    throw new Error("reviewedPlans planId values must be unique");
  }
  for (const requiredPlanId of HUMAN_REVIEW_PLAN_IDS) {
    if (!planIds.includes(requiredPlanId)) {
      throw new Error(`reviewedPlans missing ${requiredPlanId}`);
    }
  }
  for (const entry of reviewedPlans) {
    if (entry.canPromote !== false || entry.codexClaimedApproval !== false || entry.sampleRecordCountsAsApproval !== false) {
      throw new Error(`${entry.planId} intake entry must not enable promotion or Codex/sample approval`);
    }
    if (entry.submittedReviewRecordPath == null) {
      if (
        entry.manualReviewStatus !== "manual_review_required" ||
        entry.reviewerDecisionSource !== "none" ||
        entry.reviewerIdentityStatus !== "not_required_until_record_exists" ||
        entry.reviewerAuthorityStatus !== "not_required_until_record_exists" ||
        entry.promotionReadinessDryRunStatus !== "blocked_missing_manual_review"
      ) {
        throw new Error(`${entry.planId} missing submitted record must remain manual_review_required`);
      }
    } else {
      const approved =
        entry.manualReviewStatus === "approved_for_promotion_review" ||
        entry.manualReviewStatus === "approved_with_notes";
      const rejected = entry.manualReviewStatus === "rejected_needs_correction";
      if (entry.manualReviewStatus === "manual_review_required") {
        throw new Error(`${entry.planId} submitted record must include a submitted decision status`);
      }
      if (approved || rejected) {
        if (entry.reviewerDecisionSource === "none") {
          throw new Error(`${entry.planId} submitted decision requires explicit reviewerDecisionSource`);
        }
        if (entry.reviewerIdentityStatus !== "present") {
          throw new Error(`${entry.planId} submitted decision requires present reviewer identity`);
        }
        if (entry.reviewerAuthorityStatus !== "authorized") {
          throw new Error(`${entry.planId} submitted decision requires authorized reviewer authority`);
        }
      }
      if (entry.manualReviewStatus === "blocked_invalid_review_record") {
        if (
          entry.reviewerDecisionSource !== "none" ||
          entry.reviewerIdentityStatus !== "invalid" ||
          entry.reviewerAuthorityStatus !== "unauthorized" ||
          entry.promotionReadinessDryRunStatus !== "blocked_invalid_review_record"
        ) {
          throw new Error(`${entry.planId} invalid submitted record must remain blocked_invalid_review_record`);
        }
      }
      if (entry.promotionReadinessDryRunStatus === "dry_run_ready") {
        if (!approved) {
          throw new Error(`${entry.planId} dry_run_ready requires an approved submitted decision`);
        }
        if (entry.routeReadinessStatus !== "ready" || entry.simulationReadyExportStatus !== "simulation_ready") {
          throw new Error(`${entry.planId} dry_run_ready requires route/export readiness`);
        }
      }
    }
  }

  return {
    manifestVersion: requireString(manifest.manifestVersion, "manifestVersion"),
    batch: requireLiteral(manifest.batch, HUMAN_REVIEW_INTAKE_BATCH, "batch"),
    lastUpdatedIssue: requireString(manifest.lastUpdatedIssue, "lastUpdatedIssue"),
    manualVisualReviewManifestPath: requireRelativePath(manifest.manualVisualReviewManifestPath, "manualVisualReviewManifestPath"),
    manualVisualReviewManifestHash: requireSha256(manifest.manualVisualReviewManifestHash, "manualVisualReviewManifestHash"),
    planBuilderUxReviewFlowManifestPath: requireRelativePath(
      manifest.planBuilderUxReviewFlowManifestPath,
      "planBuilderUxReviewFlowManifestPath"
    ),
    planBuilderUxReviewFlowManifestHash: requireSha256(
      manifest.planBuilderUxReviewFlowManifestHash,
      "planBuilderUxReviewFlowManifestHash"
    ),
    uiSnapshotPath: requireRelativePath(manifest.uiSnapshotPath, "uiSnapshotPath"),
    uiSnapshotHash: requireSha256(manifest.uiSnapshotHash, "uiSnapshotHash"),
    reviewedPlans,
    hashConsistencyStatus: requireEnum(manifest.hashConsistencyStatus, ["not_run", "passed", "failed"] as const, "hashConsistencyStatus"),
    protocolStatus: requireEnum(manifest.protocolStatus, ["not_run", "passed", "failed"] as const, "protocolStatus"),
    identityAuthorityContractStatus: requireEnum(
      manifest.identityAuthorityContractStatus,
      ["not_run", "passed", "failed"] as const,
      "identityAuthorityContractStatus"
    ),
    intakeStatus: requireEnum(manifest.intakeStatus, ["missing", "partial", "complete"] as const, "intakeStatus"),
    dashboardStatus: requireEnum(manifest.dashboardStatus, ["missing", "partial", "complete"] as const, "dashboardStatus"),
    promotionDryRunRecheckStatus: requireEnum(
      manifest.promotionDryRunRecheckStatus,
      ["not_run", "passed", "blocked"] as const,
      "promotionDryRunRecheckStatus"
    ),
    manualApprovalStatus: requireEnum(manifest.manualApprovalStatus, ["missing", "partial", "complete"] as const, "manualApprovalStatus"),
    promotionStatus: requireEnum(manifest.promotionStatus, ["blocked", "dry_run_only"] as const, "promotionStatus"),
    privateSourceBoundaryStatus: requireEnum(manifest.privateSourceBoundaryStatus, ["passed", "failed"] as const, "privateSourceBoundaryStatus"),
    noPhiStatus: requireEnum(manifest.noPhiStatus, ["passed", "failed"] as const, "noPhiStatus"),
    defaultFixtureMutationStatus: requireEnum(
      manifest.defaultFixtureMutationStatus,
      ["unchanged", "changed", "unknown"] as const,
      "defaultFixtureMutationStatus"
    ),
    forbiddenClaimStatus: requireEnum(manifest.forbiddenClaimStatus, ["passed", "failed"] as const, "forbiddenClaimStatus"),
    goNoGoStatus: requireString(manifest.goNoGoStatus, "goNoGoStatus")
  };
}

function validateEntry(value: unknown, index: number): HumanReviewIntakeEntry {
  const label = `reviewedPlans[${index}]`;
  const entry = requireRecord(value, label);
  const requiredKeys = [
    "planId",
    "sourceDefaultPlanId",
    "reviewPacketPath",
    "reviewRecordTemplatePath",
    "renderedEvidencePath",
    "renderedEvidenceMetadataPath",
    "repairedSavedCopyPath",
    "simulationReadyExportPath",
    "manualReviewStatus",
    "reviewerDecisionSource",
    "reviewerIdentityStatus",
    "reviewerAuthorityStatus",
    "routeReadinessStatus",
    "simulationReadyExportStatus",
    "promotionReadinessDryRunStatus",
    "codexClaimedApproval",
    "sampleRecordCountsAsApproval",
    "exactParityClaimMade",
    "privateSourcePayloadStored",
    "sourceFixtureUnchanged",
    "canPromote",
    "blockingIssues",
    "warningIssues",
    "reviewerNotes",
    "limitations",
    "goNoGo"
  ];
  requireOnlyKeys(entry, label, [...requiredKeys, "submittedReviewRecordPath", "submittedReviewRecordHash"]);
  const submittedReviewRecordPath = entry.submittedReviewRecordPath == null
    ? undefined
    : requireSubmittedReviewRecordPath(entry.submittedReviewRecordPath, `${label}.submittedReviewRecordPath`);
  const submittedReviewRecordHash = entry.submittedReviewRecordHash == null
    ? undefined
    : requireSha256(entry.submittedReviewRecordHash, `${label}.submittedReviewRecordHash`);
  if ((submittedReviewRecordPath == null) !== (submittedReviewRecordHash == null)) {
    throw new Error(`${label}.submittedReviewRecordPath and submittedReviewRecordHash must be provided together`);
  }
  return {
    planId: requireEnum(entry.planId, HUMAN_REVIEW_PLAN_IDS, `${label}.planId`),
    sourceDefaultPlanId: requireString(entry.sourceDefaultPlanId, `${label}.sourceDefaultPlanId`),
    reviewPacketPath: requireRelativePath(entry.reviewPacketPath, `${label}.reviewPacketPath`),
    reviewRecordTemplatePath: requireRelativePath(entry.reviewRecordTemplatePath, `${label}.reviewRecordTemplatePath`),
    renderedEvidencePath: requireRelativePath(entry.renderedEvidencePath, `${label}.renderedEvidencePath`),
    renderedEvidenceMetadataPath: requireRelativePath(entry.renderedEvidenceMetadataPath, `${label}.renderedEvidenceMetadataPath`),
    repairedSavedCopyPath: requireRelativePath(entry.repairedSavedCopyPath, `${label}.repairedSavedCopyPath`),
    simulationReadyExportPath: requireRelativePath(entry.simulationReadyExportPath, `${label}.simulationReadyExportPath`),
    submittedReviewRecordPath,
    submittedReviewRecordHash,
    manualReviewStatus: requireEnum(
      entry.manualReviewStatus,
      [
        "manual_review_required",
        "approved_for_promotion_review",
        "approved_with_notes",
        "rejected_needs_correction",
        "blocked_invalid_review_record",
        "blocked_missing_reviewer_decision"
      ] as const,
      `${label}.manualReviewStatus`
    ),
    reviewerDecisionSource: requireEnum(
      entry.reviewerDecisionSource,
      ["none", "explicit_manual_artifact", "operator_entered_structured_decision"] as const,
      `${label}.reviewerDecisionSource`
    ),
    reviewerIdentityStatus: requireEnum(
      entry.reviewerIdentityStatus,
      ["not_present", "present", "invalid", "not_required_until_record_exists"] as const,
      `${label}.reviewerIdentityStatus`
    ),
    reviewerAuthorityStatus: requireEnum(
      entry.reviewerAuthorityStatus,
      ["not_present", "authorized", "unauthorized", "not_required_until_record_exists"] as const,
      `${label}.reviewerAuthorityStatus`
    ),
    routeReadinessStatus: requireEnum(entry.routeReadinessStatus, ["ready", "blocked"] as const, `${label}.routeReadinessStatus`),
    simulationReadyExportStatus: requireEnum(
      entry.simulationReadyExportStatus,
      ["simulation_ready", "blocked"] as const,
      `${label}.simulationReadyExportStatus`
    ),
    promotionReadinessDryRunStatus: requireEnum(
      entry.promotionReadinessDryRunStatus,
      [
        "blocked_missing_manual_review",
        "dry_run_ready",
        "blocked_by_route_export",
        "blocked_by_boundary",
        "blocked_invalid_review_record"
      ] as const,
      `${label}.promotionReadinessDryRunStatus`
    ),
    codexClaimedApproval: requireLiteral(entry.codexClaimedApproval, false, `${label}.codexClaimedApproval`),
    sampleRecordCountsAsApproval: requireLiteral(
      entry.sampleRecordCountsAsApproval,
      false,
      `${label}.sampleRecordCountsAsApproval`
    ),
    exactParityClaimMade: requireLiteral(entry.exactParityClaimMade, false, `${label}.exactParityClaimMade`),
    privateSourcePayloadStored: requireLiteral(entry.privateSourcePayloadStored, false, `${label}.privateSourcePayloadStored`),
    sourceFixtureUnchanged: requireLiteral(entry.sourceFixtureUnchanged, true, `${label}.sourceFixtureUnchanged`),
    canPromote: requireLiteral(entry.canPromote, false, `${label}.canPromote`),
    blockingIssues: requireStringArray(entry.blockingIssues, `${label}.blockingIssues`),
    warningIssues: requireStringArray(entry.warningIssues, `${label}.warningIssues`),
    reviewerNotes: requireStringArray(entry.reviewerNotes, `${label}.reviewerNotes`),
    limitations: requireStringArray(entry.limitations, `${label}.limitations`),
    goNoGo: requireString(entry.goNoGo, `${label}.goNoGo`)
  };
}

function requireSubmittedReviewRecordPath(value: unknown, label: string): string {
  const path = requireRelativePath(value, label);
  const allowed = HUMAN_REVIEW_PLAN_IDS.map((planId) => `docs/manual-review/submitted/${planId}-review-record.json`);
  if (!allowed.includes(path)) {
    throw new Error(`${label} must be an allowed submitted review record path`);
  }
  return path;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  requireOnlyKeys(value, label, allowedKeys);
  for (const key of allowedKeys) {
    if (!(key in value)) {
      throw new Error(`${label}.${key} is required`);
    }
  }
}

function requireOnlyKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireRelativePath(value: unknown, label: string): string {
  const text = requireString(value, label).replaceAll("\\", "/");
  if (/^[a-zA-Z]:[\\/]/u.test(text) || text.startsWith("/") || text.includes("..")) {
    throw new Error(`${label} must be a repo-relative path`);
  }
  return text;
}

function requireSha256(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (!/^[a-f0-9]{64}$/u.test(text)) {
    throw new Error(`${label} must be a SHA-256 hex digest`);
  }
  return text;
}

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
