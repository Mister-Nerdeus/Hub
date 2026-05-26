import { assertNoForbiddenSourcePayload } from "./authoringDraftContract.js";

export const MANUAL_REVIEW_DECISION_STATUSES = [
  "approved_for_promotion_review",
  "approved_with_notes",
  "rejected_needs_correction",
  "manual_review_required"
] as const;

export const MANUAL_REVIEWER_DECISION_SOURCES = [
  "none",
  "explicit_manual_artifact",
  "operator_entered_structured_decision"
] as const;

export const MANUAL_REVIEW_DIMENSIONS = [
  "roomPlacementPlausibility",
  "doorPlacementPlausibility",
  "hallwayPathConnectivityPlausibility",
  "stationPlacementPlausibility",
  "labelsReadability",
  "knownLimitationsAccepted"
] as const;

export const MANUAL_REVIEW_DIMENSION_RESULTS = [
  "not_reviewed",
  "accepted",
  "accepted_with_notes",
  "needs_correction"
] as const;

export type ManualReviewDecisionStatus = (typeof MANUAL_REVIEW_DECISION_STATUSES)[number];
export type ManualReviewerDecisionSource = (typeof MANUAL_REVIEWER_DECISION_SOURCES)[number];
export type ManualReviewDimension = (typeof MANUAL_REVIEW_DIMENSIONS)[number];
export type ManualReviewDimensionResult = (typeof MANUAL_REVIEW_DIMENSION_RESULTS)[number];

export type ManualReviewDecisionRecord = {
  recordVersion: string;
  planId: "plan-2" | "plan-3" | "plan-4" | "plan-5";
  sourceDefaultPlanId: string;
  reviewRecordKind: "manual_visual_review_decision";
  sampleRecord: boolean;
  codexClaimedApproval: false;
  reviewerDecisionSource: ManualReviewerDecisionSource;
  manualReviewStatus: ManualReviewDecisionStatus;
  reviewScope: "operational_layout_plausibility_only";
  promotionAuthorization: "none" | "future_promotion_review_consideration_only";
  defaultFixturePromotionRequested: false;
  reviewedArtifactPaths: string[];
  reviewDimensions: Record<ManualReviewDimension, ManualReviewDimensionResult>;
  blockingIssues: string[];
  reviewerNotes: string[];
  limitations: string[];
  nonClaims: string[];
};

export function validateManualReviewDecisionRecord(value: unknown): ManualReviewDecisionRecord {
  assertNoForbiddenSourcePayload(value, "manualReviewDecisionRecord");
  assertNoForbiddenDecisionClaims(value, "manualReviewDecisionRecord");
  const record = requireRecord(value, "manualReviewDecisionRecord");
  requireExactKeys(record, "manualReviewDecisionRecord", [
    "recordVersion",
    "planId",
    "sourceDefaultPlanId",
    "reviewRecordKind",
    "sampleRecord",
    "codexClaimedApproval",
    "reviewerDecisionSource",
    "manualReviewStatus",
    "reviewScope",
    "promotionAuthorization",
    "defaultFixturePromotionRequested",
    "reviewedArtifactPaths",
    "reviewDimensions",
    "blockingIssues",
    "reviewerNotes",
    "limitations",
    "nonClaims"
  ]);

  const sampleRecord = requireBoolean(record.sampleRecord, "sampleRecord");
  const reviewerDecisionSource = requireEnum(
    record.reviewerDecisionSource,
    MANUAL_REVIEWER_DECISION_SOURCES,
    "reviewerDecisionSource"
  );
  const manualReviewStatus = requireEnum(
    record.manualReviewStatus,
    MANUAL_REVIEW_DECISION_STATUSES,
    "manualReviewStatus"
  );
  const promotionAuthorization = requireEnum(
    record.promotionAuthorization,
    ["none", "future_promotion_review_consideration_only"] as const,
    "promotionAuthorization"
  );

  const approved = manualReviewStatus === "approved_for_promotion_review" ||
    manualReviewStatus === "approved_with_notes";
  if (sampleRecord && approved) {
    throw new Error("sample manual review records cannot approve a plan");
  }
  if (approved && reviewerDecisionSource === "none") {
    throw new Error("manual review approval requires an explicit reviewer decision source");
  }
  if (!approved && promotionAuthorization !== "none") {
    throw new Error("promotion authorization is allowed only for an approved manual review decision");
  }
  if (manualReviewStatus === "manual_review_required" && reviewerDecisionSource !== "none") {
    throw new Error("manual_review_required records must not include a reviewer decision source");
  }

  return {
    recordVersion: requireString(record.recordVersion, "recordVersion"),
    planId: requireEnum(record.planId, ["plan-2", "plan-3", "plan-4", "plan-5"] as const, "planId"),
    sourceDefaultPlanId: requireString(record.sourceDefaultPlanId, "sourceDefaultPlanId"),
    reviewRecordKind: requireLiteral(
      record.reviewRecordKind,
      "manual_visual_review_decision",
      "reviewRecordKind"
    ),
    sampleRecord,
    codexClaimedApproval: requireLiteral(record.codexClaimedApproval, false, "codexClaimedApproval"),
    reviewerDecisionSource,
    manualReviewStatus,
    reviewScope: requireLiteral(
      record.reviewScope,
      "operational_layout_plausibility_only",
      "reviewScope"
    ),
    promotionAuthorization,
    defaultFixturePromotionRequested: requireLiteral(
      record.defaultFixturePromotionRequested,
      false,
      "defaultFixturePromotionRequested"
    ),
    reviewedArtifactPaths: requireRelativePathArray(record.reviewedArtifactPaths, "reviewedArtifactPaths"),
    reviewDimensions: validateReviewDimensions(record.reviewDimensions),
    blockingIssues: requireStringArray(record.blockingIssues, "blockingIssues"),
    reviewerNotes: requireStringArray(record.reviewerNotes, "reviewerNotes"),
    limitations: requireStringArray(record.limitations, "limitations"),
    nonClaims: requireStringArray(record.nonClaims, "nonClaims")
  };
}

export function assertNoForbiddenDecisionClaims(value: unknown, label = "manualReviewDecision"): void {
  const text = JSON.stringify(value);
  const forbidden: Array<[string, RegExp]> = [
    ["exact source document match", /\bexact\s+(?:docx|cad|source(?:\s|-)?document)\s+(?:match|parity)\b/i],
    ["clinical safety approval", /\bclinical\s+safety\s+(?:approval|approved|certification|certified)\b/i],
    ["legal staffing compliance", /\blegal\s+staffing\s+compliance\b/i],
    ["promotion completed", /\bpromotion\s+(?:completed|complete|done|performed|applied)\b/i],
    ["sample approval", /\bsample\s+(?:approval|approved)\b/i],
    ["Codex approval", /\bcodex\s+(?:approval|approved|claimed approval)\b/i],
    ["private source path", /[A-Za-z]:[\\/][^\s"]+/u],
    ["private source file", /\.[dD][oO][cC][xX]\b/u]
  ];
  const match = forbidden.find(([, pattern]) => pattern.test(text));
  if (match != null) {
    throw new Error(`${label} contains forbidden claim: ${match[0]}`);
  }
}

function validateReviewDimensions(value: unknown): Record<ManualReviewDimension, ManualReviewDimensionResult> {
  const dimensions = requireRecord(value, "reviewDimensions");
  requireExactKeys(dimensions, "reviewDimensions", [...MANUAL_REVIEW_DIMENSIONS]);
  return Object.fromEntries(
    MANUAL_REVIEW_DIMENSIONS.map((dimension) => [
      dimension,
      requireEnum(dimensions[dimension], MANUAL_REVIEW_DIMENSION_RESULTS, `reviewDimensions.${dimension}`)
    ])
  ) as Record<ManualReviewDimension, ManualReviewDimensionResult>;
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

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
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
  if (/^[a-zA-Z]:[\\/]/.test(text) || text.startsWith("/") || text.includes("..")) {
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
