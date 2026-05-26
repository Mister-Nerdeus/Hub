import { assertNoForbiddenSourcePayload } from "./authoringDraftContract.js";
import { assertNoForbiddenDecisionClaims } from "./manualReviewDecisionContract.js";

export const HUMAN_REVIEW_PLAN_IDS = ["plan-2", "plan-3", "plan-4", "plan-5"] as const;
export const HUMAN_REVIEW_ROLES = ["owner", "operator", "layout_reviewer", "project_reviewer"] as const;
export const HUMAN_REVIEW_AUTHORITY_SCOPES = [
  "operational_layout_review_only",
  "promotion_review_consideration"
] as const;
export const HUMAN_REVIEW_METHODS = [
  "manual_packet_review",
  "rendered_preview_review",
  "operator_entered_structured_decision"
] as const;
export const SUBMITTED_HUMAN_REVIEW_STATUSES = [
  "approved_for_promotion_review",
  "approved_with_notes",
  "rejected_needs_correction"
] as const;
export const HUMAN_REVIEW_DIMENSION_RESULTS = [
  "accepted",
  "accepted_with_notes",
  "needs_correction"
] as const;
export const HUMAN_REVIEW_DIMENSIONS = [
  "roomPlacementPlausibility",
  "doorPlacementPlausibility",
  "hallwayPathConnectivityPlausibility",
  "stationPlacementPlausibility",
  "labelsReadability",
  "knownLimitationsAccepted"
] as const;

export type HumanReviewPlanId = (typeof HUMAN_REVIEW_PLAN_IDS)[number];
export type HumanReviewRole = (typeof HUMAN_REVIEW_ROLES)[number];
export type HumanReviewAuthorityScope = (typeof HUMAN_REVIEW_AUTHORITY_SCOPES)[number];
export type HumanReviewMethod = (typeof HUMAN_REVIEW_METHODS)[number];
export type SubmittedHumanReviewStatus = (typeof SUBMITTED_HUMAN_REVIEW_STATUSES)[number];
export type HumanReviewDimension = (typeof HUMAN_REVIEW_DIMENSIONS)[number];
export type HumanReviewDimensionResult = (typeof HUMAN_REVIEW_DIMENSION_RESULTS)[number];

export type HumanReviewIdentity = {
  reviewerHandle: string;
  reviewerRole: HumanReviewRole;
  reviewerAuthorityScope: HumanReviewAuthorityScope;
};

export type HumanReviewAttestations = {
  operationalLayoutOnly: true;
  noClinicalSafetyApproval: true;
  noStaffingComplianceApproval: true;
  noLegalComplianceApproval: true;
  noExactCadOrDocxParityClaim: true;
  noDefaultFixturePromotion: true;
  noPrivateSourceComparisonClaim: true;
};

export type SubmittedHumanReviewRecord = {
  recordVersion: "1.0.0";
  planId: HumanReviewPlanId;
  reviewRecordKind: "human_visual_review_decision";
  sampleRecord: false;
  codexClaimedApproval: false;
  reviewerDecisionSource: "explicit_manual_artifact" | "operator_entered_structured_decision";
  reviewerIdentity: HumanReviewIdentity;
  reviewedAt: string;
  reviewMethod: HumanReviewMethod;
  manualReviewStatus: SubmittedHumanReviewStatus;
  reviewScope: "operational_layout_plausibility_only";
  promotionAuthorization: "none" | "future_promotion_review_consideration_only";
  defaultFixturePromotionRequested: false;
  reviewedArtifactPaths: string[];
  reviewDimensions: Record<HumanReviewDimension, HumanReviewDimensionResult>;
  reviewerAttestations: HumanReviewAttestations;
  blockingIssues: string[];
  reviewerNotes: string[];
  limitations: string[];
  nonClaims: string[];
};

export function validateSubmittedHumanReviewRecord(
  value: unknown,
  expectedPlanId?: HumanReviewPlanId
): SubmittedHumanReviewRecord {
  assertNoForbiddenSourcePayload(value, "submittedHumanReviewRecord");
  assertNoForbiddenDecisionClaims(value, "submittedHumanReviewRecord");
  const record = requireRecord(value, "submittedHumanReviewRecord");
  requireExactKeys(record, "submittedHumanReviewRecord", [
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

  const planId = requireEnum(record.planId, HUMAN_REVIEW_PLAN_IDS, "planId");
  if (expectedPlanId != null && planId !== expectedPlanId) {
    throw new Error(`submitted review record planId must match ${expectedPlanId}`);
  }
  const reviewerIdentity = validateReviewerIdentity(record.reviewerIdentity);
  const manualReviewStatus = requireEnum(
    record.manualReviewStatus,
    SUBMITTED_HUMAN_REVIEW_STATUSES,
    "manualReviewStatus"
  );
  const reviewerDecisionSource = requireEnum(
    record.reviewerDecisionSource,
    ["explicit_manual_artifact", "operator_entered_structured_decision"] as const,
    "reviewerDecisionSource"
  );
  const promotionAuthorization = requireEnum(
    record.promotionAuthorization,
    ["none", "future_promotion_review_consideration_only"] as const,
    "promotionAuthorization"
  );

  requireIsoTimestamp(record.reviewedAt, "reviewedAt");
  enforceAuthority(manualReviewStatus, reviewerIdentity.reviewerAuthorityScope, promotionAuthorization);

  return {
    recordVersion: requireLiteral(record.recordVersion, "1.0.0", "recordVersion"),
    planId,
    reviewRecordKind: requireLiteral(record.reviewRecordKind, "human_visual_review_decision", "reviewRecordKind"),
    sampleRecord: requireLiteral(record.sampleRecord, false, "sampleRecord"),
    codexClaimedApproval: requireLiteral(record.codexClaimedApproval, false, "codexClaimedApproval"),
    reviewerDecisionSource,
    reviewerIdentity,
    reviewedAt: record.reviewedAt as string,
    reviewMethod: requireEnum(record.reviewMethod, HUMAN_REVIEW_METHODS, "reviewMethod"),
    manualReviewStatus,
    reviewScope: requireLiteral(record.reviewScope, "operational_layout_plausibility_only", "reviewScope"),
    promotionAuthorization,
    defaultFixturePromotionRequested: requireLiteral(
      record.defaultFixturePromotionRequested,
      false,
      "defaultFixturePromotionRequested"
    ),
    reviewedArtifactPaths: requireRelativePathArray(record.reviewedArtifactPaths, "reviewedArtifactPaths"),
    reviewDimensions: validateReviewDimensions(record.reviewDimensions),
    reviewerAttestations: validateReviewerAttestations(record.reviewerAttestations),
    blockingIssues: requireStringArray(record.blockingIssues, "blockingIssues"),
    reviewerNotes: requireStringArray(record.reviewerNotes, "reviewerNotes"),
    limitations: requireStringArray(record.limitations, "limitations"),
    nonClaims: requireStringArray(record.nonClaims, "nonClaims")
  };
}

export function validateReviewerIdentity(value: unknown): HumanReviewIdentity {
  const identity = requireRecord(value, "reviewerIdentity");
  requireExactKeys(identity, "reviewerIdentity", [
    "reviewerHandle",
    "reviewerRole",
    "reviewerAuthorityScope"
  ]);
  const reviewerHandle = requireSafeReviewerHandle(identity.reviewerHandle, "reviewerHandle");
  return {
    reviewerHandle,
    reviewerRole: requireEnum(identity.reviewerRole, HUMAN_REVIEW_ROLES, "reviewerRole"),
    reviewerAuthorityScope: requireEnum(
      identity.reviewerAuthorityScope,
      HUMAN_REVIEW_AUTHORITY_SCOPES,
      "reviewerAuthorityScope"
    )
  };
}

export function validateReviewerAttestations(value: unknown): HumanReviewAttestations {
  const attestations = requireRecord(value, "reviewerAttestations");
  requireExactKeys(attestations, "reviewerAttestations", [
    "operationalLayoutOnly",
    "noClinicalSafetyApproval",
    "noStaffingComplianceApproval",
    "noLegalComplianceApproval",
    "noExactCadOrDocxParityClaim",
    "noDefaultFixturePromotion",
    "noPrivateSourceComparisonClaim"
  ]);
  return {
    operationalLayoutOnly: requireLiteral(attestations.operationalLayoutOnly, true, "operationalLayoutOnly"),
    noClinicalSafetyApproval: requireLiteral(attestations.noClinicalSafetyApproval, true, "noClinicalSafetyApproval"),
    noStaffingComplianceApproval: requireLiteral(
      attestations.noStaffingComplianceApproval,
      true,
      "noStaffingComplianceApproval"
    ),
    noLegalComplianceApproval: requireLiteral(attestations.noLegalComplianceApproval, true, "noLegalComplianceApproval"),
    noExactCadOrDocxParityClaim: requireLiteral(
      attestations.noExactCadOrDocxParityClaim,
      true,
      "noExactCadOrDocxParityClaim"
    ),
    noDefaultFixturePromotion: requireLiteral(attestations.noDefaultFixturePromotion, true, "noDefaultFixturePromotion"),
    noPrivateSourceComparisonClaim: requireLiteral(
      attestations.noPrivateSourceComparisonClaim,
      true,
      "noPrivateSourceComparisonClaim"
    )
  };
}

function enforceAuthority(
  status: SubmittedHumanReviewStatus,
  authorityScope: HumanReviewAuthorityScope,
  promotionAuthorization: SubmittedHumanReviewRecord["promotionAuthorization"]
): void {
  if (status === "approved_for_promotion_review" && authorityScope !== "promotion_review_consideration") {
    throw new Error("approved_for_promotion_review requires promotion_review_consideration authority");
  }
  if (status === "rejected_needs_correction" && promotionAuthorization !== "none") {
    throw new Error("rejected_needs_correction records must not authorize promotion review consideration");
  }
  if (status === "approved_for_promotion_review" && promotionAuthorization !== "future_promotion_review_consideration_only") {
    throw new Error("approved_for_promotion_review may only authorize future promotion-review consideration");
  }
}

function validateReviewDimensions(value: unknown): Record<HumanReviewDimension, HumanReviewDimensionResult> {
  const dimensions = requireRecord(value, "reviewDimensions");
  requireExactKeys(dimensions, "reviewDimensions", [...HUMAN_REVIEW_DIMENSIONS]);
  return Object.fromEntries(
    HUMAN_REVIEW_DIMENSIONS.map((dimension) => [
      dimension,
      requireEnum(dimensions[dimension], HUMAN_REVIEW_DIMENSION_RESULTS, `reviewDimensions.${dimension}`)
    ])
  ) as Record<HumanReviewDimension, HumanReviewDimensionResult>;
}

function requireSafeReviewerHandle(value: unknown, label: string): string {
  const handle = requireString(value, label);
  if (!/^[a-z][a-z0-9_-]{2,31}$/u.test(handle)) {
    throw new Error(`${label} must be a safe pseudonymous handle`);
  }
  if (/@/u.test(handle) || /^[a-z]{2,}[-_]?\d{3,}$/iu.test(handle) || /\b(?:employee|staff|badge|id)[-_]?\d+\b/iu.test(handle)) {
    throw new Error(`${label} must not look like an email or employee identifier`);
  }
  if (["anonymous", "anon", "unknown", "reviewer", "human"].includes(handle.toLowerCase())) {
    throw new Error(`${label} must not be anonymous or ambiguous`);
  }
  return handle;
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const text = requireString(value, label);
  const parsed = Date.parse(text);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(text) || Number.isNaN(parsed)) {
    throw new Error(`${label} must be an ISO 8601 UTC timestamp`);
  }
  return text;
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
  for (const key of allowedKeys) {
    if (!(key in value)) {
      throw new Error(`${label}.${key} is required`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireRelativePathArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((entry, index) => requireRelativePath(entry, `${label}[${index}]`));
}

function requireRelativePath(value: unknown, label: string): string {
  const text = requireString(value, label).replaceAll("\\", "/");
  if (/^[a-zA-Z]:[\\/]/u.test(text) || text.startsWith("/") || text.includes("..")) {
    throw new Error(`${label} must be a repo-relative path`);
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
