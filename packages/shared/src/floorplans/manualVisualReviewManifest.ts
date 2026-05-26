import { assertNoForbiddenSourcePayload } from "./authoringDraftContract.js";
import {
  assertNoForbiddenDecisionClaims,
  MANUAL_REVIEW_DECISION_STATUSES,
  MANUAL_REVIEWER_DECISION_SOURCES,
  type ManualReviewDecisionStatus,
  type ManualReviewerDecisionSource
} from "./manualReviewDecisionContract.js";

export const MANUAL_VISUAL_REVIEW_BATCH = "321-330" as const;
export const MANUAL_VISUAL_REVIEW_PLAN_IDS = ["plan-2", "plan-3", "plan-4", "plan-5"] as const;

export type ManualVisualReviewPlanId = (typeof MANUAL_VISUAL_REVIEW_PLAN_IDS)[number];
export type ManualVisualReviewEntry = {
  planId: ManualVisualReviewPlanId;
  sourceDefaultPlanId: string;
  repairedSavedCopyPath: string;
  repairedSavedCopyHash: string;
  simulationReadyExportPath: string;
  simulationReadyExportHash: string;
  renderedEvidencePath: string;
  renderedEvidenceHash: string;
  renderedEvidenceMetadataPath: string;
  reviewPacketPath: string;
  reviewPacketHash: string;
  reviewRecordTemplatePath: string;
  reviewRecordTemplateHash: string;
  manualReviewRecordPath?: string;
  manualReviewRecordHash?: string;
  manualReviewStatus:
    | "not_reviewed"
    | "manual_review_required"
    | "approved_for_promotion_review"
    | "approved_with_notes"
    | "rejected_needs_correction"
    | "blocked_missing_reviewer_decision";
  reviewerDecisionSource: ManualReviewerDecisionSource;
  codexClaimedApproval: false;
  sampleRecord: false;
  routeReadinessStatus: "ready" | "blocked";
  simulationReadyExportStatus: "simulation_ready" | "blocked";
  privateSourcePayloadStored: false;
  exactParityClaimMade: false;
  sourceFixtureUnchanged: true;
  promotionReadinessDryRunStatus:
    | "not_run"
    | "blocked_missing_manual_review"
    | "dry_run_ready"
    | "blocked_by_route_export"
    | "blocked_by_boundary";
  rollbackPlanPath?: string;
  rollbackPlanHash?: string;
  blockingIssues: string[];
  warningIssues: string[];
  reviewerNotes: string[];
  limitations: string[];
  goNoGo: string;
};

export type ManualVisualReviewManifest = {
  manifestVersion: string;
  batch: typeof MANUAL_VISUAL_REVIEW_BATCH;
  lastUpdatedIssue: string;
  routeRepairManifestPath: string;
  routeRepairManifestHash: string;
  reviewedPlans: ManualVisualReviewEntry[];
  routeFinalImmutableStatus: "not_run" | "passed" | "failed";
  reviewProtocolStatus: "not_run" | "passed" | "failed";
  reviewPackageStatus: "missing" | "partial" | "complete";
  reviewTemplateStatus: "missing" | "partial" | "complete";
  manualDecisionStatus: "missing" | "partial" | "complete";
  decisionContractStatus: "not_run" | "passed" | "failed";
  promotionReadinessDryRunStatus: "not_run" | "passed" | "blocked";
  rollbackPackageStatus: "missing" | "partial" | "complete";
  privateSourceBoundaryStatus: "passed" | "failed";
  noPhiStatus: "passed" | "failed";
  defaultFixtureMutationStatus: "unchanged" | "changed" | "unknown";
  promotionStatus: "not_requested" | "blocked" | "dry_run_only";
  goNoGoStatus: string;
};

export function validateManualVisualReviewManifest(value: unknown): ManualVisualReviewManifest {
  assertNoForbiddenSourcePayload(value, "manualVisualReviewManifest");
  assertNoForbiddenDecisionClaims(value, "manualVisualReviewManifest");
  const manifest = requireRecord(value, "manualVisualReviewManifest");
  requireExactKeys(manifest, "manualVisualReviewManifest", [
    "manifestVersion",
    "batch",
    "lastUpdatedIssue",
    "routeRepairManifestPath",
    "routeRepairManifestHash",
    "reviewedPlans",
    "routeFinalImmutableStatus",
    "reviewProtocolStatus",
    "reviewPackageStatus",
    "reviewTemplateStatus",
    "manualDecisionStatus",
    "decisionContractStatus",
    "promotionReadinessDryRunStatus",
    "rollbackPackageStatus",
    "privateSourceBoundaryStatus",
    "noPhiStatus",
    "defaultFixtureMutationStatus",
    "promotionStatus",
    "goNoGoStatus"
  ]);
  const reviewedPlans = requireArray(manifest.reviewedPlans, "reviewedPlans").map(validateEntry);
  const planIds = reviewedPlans.map((entry) => entry.planId);
  if (new Set(planIds).size !== planIds.length) {
    throw new Error("reviewedPlans planId values must be unique");
  }
  if (reviewedPlans.some((entry) => entry.codexClaimedApproval !== false)) {
    throw new Error("manual visual review manifest must not claim Codex approval");
  }
  if (reviewedPlans.some((entry) => entry.sampleRecord !== false)) {
    throw new Error("manual visual review manifest entries must not be sample records");
  }
  if (reviewedPlans.some((entry) => entry.privateSourcePayloadStored !== false)) {
    throw new Error("manual visual review manifest must not store private source payloads");
  }
  if (reviewedPlans.some((entry) => entry.exactParityClaimMade !== false)) {
    throw new Error("manual visual review manifest must not claim exact source-document parity");
  }
  for (const entry of reviewedPlans) {
    const approved = entry.manualReviewStatus === "approved_for_promotion_review" ||
      entry.manualReviewStatus === "approved_with_notes";
    if (approved && entry.reviewerDecisionSource === "none") {
      throw new Error(`${entry.planId} approval requires explicit reviewer decision source`);
    }
    if (entry.reviewerDecisionSource === "none" && entry.manualReviewStatus !== "manual_review_required") {
      throw new Error(`${entry.planId} without reviewer artifact must remain manual_review_required`);
    }
    if (entry.manualReviewRecordPath == null && entry.manualReviewStatus !== "manual_review_required") {
      throw new Error(`${entry.planId} missing manual review record must remain manual_review_required`);
    }
  }

  return {
    manifestVersion: requireString(manifest.manifestVersion, "manifestVersion"),
    batch: requireLiteral(manifest.batch, MANUAL_VISUAL_REVIEW_BATCH, "batch"),
    lastUpdatedIssue: requireString(manifest.lastUpdatedIssue, "lastUpdatedIssue"),
    routeRepairManifestPath: requireRelativePath(manifest.routeRepairManifestPath, "routeRepairManifestPath"),
    routeRepairManifestHash: requireSha256(manifest.routeRepairManifestHash, "routeRepairManifestHash"),
    reviewedPlans,
    routeFinalImmutableStatus: requireEnum(manifest.routeFinalImmutableStatus, ["not_run", "passed", "failed"] as const, "routeFinalImmutableStatus"),
    reviewProtocolStatus: requireEnum(manifest.reviewProtocolStatus, ["not_run", "passed", "failed"] as const, "reviewProtocolStatus"),
    reviewPackageStatus: requireEnum(manifest.reviewPackageStatus, ["missing", "partial", "complete"] as const, "reviewPackageStatus"),
    reviewTemplateStatus: requireEnum(manifest.reviewTemplateStatus, ["missing", "partial", "complete"] as const, "reviewTemplateStatus"),
    manualDecisionStatus: requireEnum(manifest.manualDecisionStatus, ["missing", "partial", "complete"] as const, "manualDecisionStatus"),
    decisionContractStatus: requireEnum(manifest.decisionContractStatus, ["not_run", "passed", "failed"] as const, "decisionContractStatus"),
    promotionReadinessDryRunStatus: requireEnum(manifest.promotionReadinessDryRunStatus, ["not_run", "passed", "blocked"] as const, "promotionReadinessDryRunStatus"),
    rollbackPackageStatus: requireEnum(manifest.rollbackPackageStatus, ["missing", "partial", "complete"] as const, "rollbackPackageStatus"),
    privateSourceBoundaryStatus: requireEnum(manifest.privateSourceBoundaryStatus, ["passed", "failed"] as const, "privateSourceBoundaryStatus"),
    noPhiStatus: requireEnum(manifest.noPhiStatus, ["passed", "failed"] as const, "noPhiStatus"),
    defaultFixtureMutationStatus: requireEnum(manifest.defaultFixtureMutationStatus, ["unchanged", "changed", "unknown"] as const, "defaultFixtureMutationStatus"),
    promotionStatus: requireEnum(manifest.promotionStatus, ["not_requested", "blocked", "dry_run_only"] as const, "promotionStatus"),
    goNoGoStatus: requireString(manifest.goNoGoStatus, "goNoGoStatus")
  };
}

function validateEntry(value: unknown, index: number): ManualVisualReviewEntry {
  const label = `reviewedPlans[${index}]`;
  const entry = requireRecord(value, label);
  const requiredKeys = [
    "planId",
    "sourceDefaultPlanId",
    "repairedSavedCopyPath",
    "repairedSavedCopyHash",
    "simulationReadyExportPath",
    "simulationReadyExportHash",
    "renderedEvidencePath",
    "renderedEvidenceHash",
    "renderedEvidenceMetadataPath",
    "reviewPacketPath",
    "reviewPacketHash",
    "reviewRecordTemplatePath",
    "reviewRecordTemplateHash",
    "manualReviewStatus",
    "reviewerDecisionSource",
    "codexClaimedApproval",
    "sampleRecord",
    "routeReadinessStatus",
    "simulationReadyExportStatus",
    "privateSourcePayloadStored",
    "exactParityClaimMade",
    "sourceFixtureUnchanged",
    "promotionReadinessDryRunStatus",
    "blockingIssues",
    "warningIssues",
    "reviewerNotes",
    "limitations",
    "goNoGo"
  ];
  requireOnlyKeys(entry, label, [
    ...requiredKeys,
    "manualReviewRecordPath",
    "manualReviewRecordHash",
    "rollbackPlanPath",
    "rollbackPlanHash"
  ]);
  const manualReviewRecordPath = entry.manualReviewRecordPath == null
    ? undefined
    : requireRelativePath(entry.manualReviewRecordPath, `${label}.manualReviewRecordPath`);
  const manualReviewRecordHash = entry.manualReviewRecordHash == null
    ? undefined
    : requireSha256(entry.manualReviewRecordHash, `${label}.manualReviewRecordHash`);
  if ((manualReviewRecordPath == null) !== (manualReviewRecordHash == null)) {
    throw new Error(`${label}.manualReviewRecordPath and manualReviewRecordHash must be provided together`);
  }
  const rollbackPlanPath = entry.rollbackPlanPath == null
    ? undefined
    : requireRelativePath(entry.rollbackPlanPath, `${label}.rollbackPlanPath`);
  const rollbackPlanHash = entry.rollbackPlanHash == null
    ? undefined
    : requireSha256(entry.rollbackPlanHash, `${label}.rollbackPlanHash`);
  if ((rollbackPlanPath == null) !== (rollbackPlanHash == null)) {
    throw new Error(`${label}.rollbackPlanPath and rollbackPlanHash must be provided together`);
  }

  return {
    planId: requireEnum(entry.planId, MANUAL_VISUAL_REVIEW_PLAN_IDS, `${label}.planId`),
    sourceDefaultPlanId: requireString(entry.sourceDefaultPlanId, `${label}.sourceDefaultPlanId`),
    repairedSavedCopyPath: requireRelativePath(entry.repairedSavedCopyPath, `${label}.repairedSavedCopyPath`),
    repairedSavedCopyHash: requireSha256(entry.repairedSavedCopyHash, `${label}.repairedSavedCopyHash`),
    simulationReadyExportPath: requireRelativePath(entry.simulationReadyExportPath, `${label}.simulationReadyExportPath`),
    simulationReadyExportHash: requireSha256(entry.simulationReadyExportHash, `${label}.simulationReadyExportHash`),
    renderedEvidencePath: requireRelativePath(entry.renderedEvidencePath, `${label}.renderedEvidencePath`),
    renderedEvidenceHash: requireSha256(entry.renderedEvidenceHash, `${label}.renderedEvidenceHash`),
    renderedEvidenceMetadataPath: requireRelativePath(entry.renderedEvidenceMetadataPath, `${label}.renderedEvidenceMetadataPath`),
    reviewPacketPath: requireRelativePath(entry.reviewPacketPath, `${label}.reviewPacketPath`),
    reviewPacketHash: requireSha256(entry.reviewPacketHash, `${label}.reviewPacketHash`),
    reviewRecordTemplatePath: requireRelativePath(entry.reviewRecordTemplatePath, `${label}.reviewRecordTemplatePath`),
    reviewRecordTemplateHash: requireSha256(entry.reviewRecordTemplateHash, `${label}.reviewRecordTemplateHash`),
    manualReviewRecordPath,
    manualReviewRecordHash,
    manualReviewStatus: requireEnum(
      entry.manualReviewStatus,
      [...MANUAL_REVIEW_DECISION_STATUSES, "not_reviewed", "blocked_missing_reviewer_decision"] as const,
      `${label}.manualReviewStatus`
    ) as ManualVisualReviewEntry["manualReviewStatus"],
    reviewerDecisionSource: requireEnum(entry.reviewerDecisionSource, MANUAL_REVIEWER_DECISION_SOURCES, `${label}.reviewerDecisionSource`),
    codexClaimedApproval: requireLiteral(entry.codexClaimedApproval, false, `${label}.codexClaimedApproval`),
    sampleRecord: requireLiteral(entry.sampleRecord, false, `${label}.sampleRecord`),
    routeReadinessStatus: requireEnum(entry.routeReadinessStatus, ["ready", "blocked"] as const, `${label}.routeReadinessStatus`),
    simulationReadyExportStatus: requireEnum(entry.simulationReadyExportStatus, ["simulation_ready", "blocked"] as const, `${label}.simulationReadyExportStatus`),
    privateSourcePayloadStored: requireLiteral(entry.privateSourcePayloadStored, false, `${label}.privateSourcePayloadStored`),
    exactParityClaimMade: requireLiteral(entry.exactParityClaimMade, false, `${label}.exactParityClaimMade`),
    sourceFixtureUnchanged: requireLiteral(entry.sourceFixtureUnchanged, true, `${label}.sourceFixtureUnchanged`),
    promotionReadinessDryRunStatus: requireEnum(
      entry.promotionReadinessDryRunStatus,
      ["not_run", "blocked_missing_manual_review", "dry_run_ready", "blocked_by_route_export", "blocked_by_boundary"] as const,
      `${label}.promotionReadinessDryRunStatus`
    ),
    rollbackPlanPath,
    rollbackPlanHash,
    blockingIssues: requireStringArray(entry.blockingIssues, `${label}.blockingIssues`),
    warningIssues: requireStringArray(entry.warningIssues, `${label}.warningIssues`),
    reviewerNotes: requireStringArray(entry.reviewerNotes, `${label}.reviewerNotes`),
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
