import { assertNoForbiddenSourcePayload } from "./authoringDraftContract.js";
import { SIMULATION_READY_EXPORT_STATUSES, type SimulationReadyExportStatus } from "./simulationReadyExportContract.js";

export const CORRECTED_PLAN_REVIEW_BATCH = "301-310" as const;

export const CORRECTED_PLAN_REVIEW_STATUSES = [
  "not_run",
  "passed",
  "warning",
  "blocked"
] as const;

export const MANUAL_VISUAL_REVIEW_STATUSES = [
  "not_reviewed",
  "manual_review_required",
  "manual_review_completed"
] as const;

export const REVIEW_PROMOTION_CANDIDATE_STATUSES = [
  "not_candidate",
  "manual_review_candidate",
  "future_promotion_review_candidate",
  "blocked_by_missing_prior_artifact",
  "blocked_by_visual_sanity",
  "blocked_by_route_audit",
  "blocked_by_export_status",
  "blocked_by_private_source_boundary"
] as const;

export type CorrectedPlanReviewStatus = (typeof CORRECTED_PLAN_REVIEW_STATUSES)[number];
export type ManualVisualReviewStatus = (typeof MANUAL_VISUAL_REVIEW_STATUSES)[number];
export type ReviewPromotionCandidateStatus = (typeof REVIEW_PROMOTION_CANDIDATE_STATUSES)[number];

export type CorrectedPlanReviewEntry = {
  planId: string;
  sourceDefaultPlanId: string;
  correctedSavedCopyPath: string;
  correctedSavedCopyHash: string;
  correctionAuditPath: string;
  correctionAuditHash: string;
  renderedEvidencePath: string;
  renderedEvidenceHash: string;
  renderedEvidenceMetadataPath: string;
  machineVisualSanityStatus: CorrectedPlanReviewStatus;
  manualVisualReviewStatus: ManualVisualReviewStatus;
  routeAuditStatus: CorrectedPlanReviewStatus;
  simulationReadyExportStatus: SimulationReadyExportStatus;
  privateSourcePayloadStored: boolean;
  exactParityClaimMade: boolean;
  sourceFixtureUnchanged: boolean;
  promotionCandidateStatus: ReviewPromotionCandidateStatus;
  blockingIssues: string[];
  warningIssues: string[];
  limitations: string[];
  goNoGo: string;
};

export type CorrectedPlanReviewManifest = {
  manifestVersion: string;
  batch: typeof CORRECTED_PLAN_REVIEW_BATCH;
  lastUpdatedIssue: string;
  sourceCorrectionManifestPath: string;
  sourceCorrectionManifestHash: string;
  reviewedPlans: CorrectedPlanReviewEntry[];
  preflightStatus:
    | "not_run"
    | "passed"
    | "blocked_missing_source_correction_artifacts"
    | "blocked_invalid_source_correction_manifest";
  renderedEvidenceStatus: "missing" | "partial" | "complete";
  machineVisualSanityStatus: "missing" | "partial" | "complete";
  routeAuditStatus: "missing" | "partial" | "complete";
  simulationReadyExportStatus: "missing" | "partial" | "complete";
  privateSourceBoundaryStatus: "passed" | "failed";
  defaultFixtureMutationStatus: "unchanged" | "changed" | "unknown";
  promotionStatus: "not_requested" | "blocked" | "ready_for_future_review";
  goNoGoStatus: string;
};

export function validateCorrectedPlanReviewManifest(value: unknown): CorrectedPlanReviewManifest {
  assertNoForbiddenSourcePayload(value, "correctedPlanReviewManifest");
  const manifest = requireRecord(value, "correctedPlanReviewManifest");
  requireExactKeys(manifest, "correctedPlanReviewManifest", [
    "manifestVersion",
    "batch",
    "lastUpdatedIssue",
    "sourceCorrectionManifestPath",
    "sourceCorrectionManifestHash",
    "reviewedPlans",
    "preflightStatus",
    "renderedEvidenceStatus",
    "machineVisualSanityStatus",
    "routeAuditStatus",
    "simulationReadyExportStatus",
    "privateSourceBoundaryStatus",
    "defaultFixtureMutationStatus",
    "promotionStatus",
    "goNoGoStatus"
  ]);
  const reviewedPlans = requireArray(manifest.reviewedPlans, "reviewedPlans").map(validateReviewEntry);
  const planIds = reviewedPlans.map((entry) => entry.planId);
  if (new Set(planIds).size !== planIds.length) {
    throw new Error("reviewedPlans planId values must be unique");
  }
  if (reviewedPlans.some((entry) => entry.manualVisualReviewStatus === "manual_review_completed")) {
    throw new Error("Codex review manifest must not claim completed manual visual review");
  }
  if (reviewedPlans.some((entry) => entry.exactParityClaimMade !== false)) {
    throw new Error("corrected review entries must not claim exact CAD or exact DOCX parity");
  }
  if (reviewedPlans.some((entry) => entry.privateSourcePayloadStored !== false)) {
    throw new Error("corrected review entries must not store private source payload");
  }

  return {
    manifestVersion: requireString(manifest.manifestVersion, "manifestVersion"),
    batch: requireLiteral(manifest.batch, CORRECTED_PLAN_REVIEW_BATCH, "batch"),
    lastUpdatedIssue: requireString(manifest.lastUpdatedIssue, "lastUpdatedIssue"),
    sourceCorrectionManifestPath: requireRelativePath(manifest.sourceCorrectionManifestPath, "sourceCorrectionManifestPath"),
    sourceCorrectionManifestHash: requireSha256(manifest.sourceCorrectionManifestHash, "sourceCorrectionManifestHash"),
    reviewedPlans,
    preflightStatus: requireEnum(
      manifest.preflightStatus,
      ["not_run", "passed", "blocked_missing_source_correction_artifacts", "blocked_invalid_source_correction_manifest"] as const,
      "preflightStatus"
    ),
    renderedEvidenceStatus: requireEnum(manifest.renderedEvidenceStatus, ["missing", "partial", "complete"] as const, "renderedEvidenceStatus"),
    machineVisualSanityStatus: requireEnum(manifest.machineVisualSanityStatus, ["missing", "partial", "complete"] as const, "machineVisualSanityStatus"),
    routeAuditStatus: requireEnum(manifest.routeAuditStatus, ["missing", "partial", "complete"] as const, "routeAuditStatus"),
    simulationReadyExportStatus: requireEnum(manifest.simulationReadyExportStatus, ["missing", "partial", "complete"] as const, "simulationReadyExportStatus"),
    privateSourceBoundaryStatus: requireEnum(manifest.privateSourceBoundaryStatus, ["passed", "failed"] as const, "privateSourceBoundaryStatus"),
    defaultFixtureMutationStatus: requireEnum(manifest.defaultFixtureMutationStatus, ["unchanged", "changed", "unknown"] as const, "defaultFixtureMutationStatus"),
    promotionStatus: requireEnum(manifest.promotionStatus, ["not_requested", "blocked", "ready_for_future_review"] as const, "promotionStatus"),
    goNoGoStatus: requireString(manifest.goNoGoStatus, "goNoGoStatus")
  };
}

function validateReviewEntry(value: unknown, index: number): CorrectedPlanReviewEntry {
  const label = `reviewedPlans[${index}]`;
  const entry = requireRecord(value, label);
  requireExactKeys(entry, label, [
    "planId",
    "sourceDefaultPlanId",
    "correctedSavedCopyPath",
    "correctedSavedCopyHash",
    "correctionAuditPath",
    "correctionAuditHash",
    "renderedEvidencePath",
    "renderedEvidenceHash",
    "renderedEvidenceMetadataPath",
    "machineVisualSanityStatus",
    "manualVisualReviewStatus",
    "routeAuditStatus",
    "simulationReadyExportStatus",
    "privateSourcePayloadStored",
    "exactParityClaimMade",
    "sourceFixtureUnchanged",
    "promotionCandidateStatus",
    "blockingIssues",
    "warningIssues",
    "limitations",
    "goNoGo"
  ]);
  return {
    planId: requireString(entry.planId, `${label}.planId`),
    sourceDefaultPlanId: requireString(entry.sourceDefaultPlanId, `${label}.sourceDefaultPlanId`),
    correctedSavedCopyPath: requireRelativePath(entry.correctedSavedCopyPath, `${label}.correctedSavedCopyPath`),
    correctedSavedCopyHash: requireSha256(entry.correctedSavedCopyHash, `${label}.correctedSavedCopyHash`),
    correctionAuditPath: requireRelativePath(entry.correctionAuditPath, `${label}.correctionAuditPath`),
    correctionAuditHash: requireSha256(entry.correctionAuditHash, `${label}.correctionAuditHash`),
    renderedEvidencePath: requireRelativePath(entry.renderedEvidencePath, `${label}.renderedEvidencePath`),
    renderedEvidenceHash: requireSha256(entry.renderedEvidenceHash, `${label}.renderedEvidenceHash`),
    renderedEvidenceMetadataPath: requireRelativePath(entry.renderedEvidenceMetadataPath, `${label}.renderedEvidenceMetadataPath`),
    machineVisualSanityStatus: requireEnum(entry.machineVisualSanityStatus, CORRECTED_PLAN_REVIEW_STATUSES, `${label}.machineVisualSanityStatus`),
    manualVisualReviewStatus: requireEnum(entry.manualVisualReviewStatus, MANUAL_VISUAL_REVIEW_STATUSES, `${label}.manualVisualReviewStatus`),
    routeAuditStatus: requireEnum(entry.routeAuditStatus, CORRECTED_PLAN_REVIEW_STATUSES, `${label}.routeAuditStatus`),
    simulationReadyExportStatus: requireEnum(entry.simulationReadyExportStatus, SIMULATION_READY_EXPORT_STATUSES, `${label}.simulationReadyExportStatus`),
    privateSourcePayloadStored: requireLiteral(entry.privateSourcePayloadStored, false, `${label}.privateSourcePayloadStored`),
    exactParityClaimMade: requireLiteral(entry.exactParityClaimMade, false, `${label}.exactParityClaimMade`),
    sourceFixtureUnchanged: requireBoolean(entry.sourceFixtureUnchanged, `${label}.sourceFixtureUnchanged`),
    promotionCandidateStatus: requireEnum(entry.promotionCandidateStatus, REVIEW_PROMOTION_CANDIDATE_STATUSES, `${label}.promotionCandidateStatus`),
    blockingIssues: requireStringArray(entry.blockingIssues, `${label}.blockingIssues`),
    warningIssues: requireStringArray(entry.warningIssues, `${label}.warningIssues`),
    limitations: requireStringArray(entry.limitations, `${label}.limitations`),
    goNoGo: requireString(entry.goNoGo, `${label}.goNoGo`)
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
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

function requireRelativePath(value: unknown, label: string): string {
  const text = requireString(value, label).replaceAll("\\", "/");
  if (/^[a-zA-Z]:[\\/]/.test(text) || text.startsWith("/") || text.includes("..")) {
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

function requireStringArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
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
