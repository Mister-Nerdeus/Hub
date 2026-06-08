export type ManualScenarioReviewStatus =
  | "draft"
  | "ready_for_manual_review"
  | "reference_issues";

export type ManualScenarioReviewContract = {
  reviewId: string;
  scenarioId: string;
  floorplanId: string;
  assignmentSetId: string;
  staffRosterId: string;
  createdAtIso: string;
  updatedAtIso: string;
  status: ManualScenarioReviewStatus;
  mode: "manual_review";
};

export function manualScenarioReviewIdFor(input: { scenarioId: string }): string {
  return ["manual-scenario-review", stableIdPart(input.scenarioId)].join(":");
}

export function validateManualScenarioReviewContract(value: unknown): ManualScenarioReviewContract {
  const review = requireRecord(value, "manualScenarioReview");
  requireAllowedKeys(review, "manualScenarioReview", [
    "reviewId",
    "scenarioId",
    "floorplanId",
    "assignmentSetId",
    "staffRosterId",
    "createdAtIso",
    "updatedAtIso",
    "status",
    "mode"
  ]);
  if (review.mode !== "manual_review") {
    throw new Error("manualScenarioReview.mode must be manual_review");
  }
  const scenarioId = requireString(review.scenarioId, "manualScenarioReview.scenarioId");
  const reviewId = requireString(review.reviewId, "manualScenarioReview.reviewId");
  if (reviewId !== manualScenarioReviewIdFor({ scenarioId })) {
    throw new Error("manualScenarioReview.reviewId must reference scenarioId");
  }
  return {
    reviewId,
    scenarioId,
    floorplanId: requireString(review.floorplanId, "manualScenarioReview.floorplanId"),
    assignmentSetId: requireString(review.assignmentSetId, "manualScenarioReview.assignmentSetId"),
    staffRosterId: requireString(review.staffRosterId, "manualScenarioReview.staffRosterId"),
    createdAtIso: requireIso(review.createdAtIso, "manualScenarioReview.createdAtIso"),
    updatedAtIso: requireIso(review.updatedAtIso, "manualScenarioReview.updatedAtIso"),
    status: requireStatus(review.status),
    mode: "manual_review"
  };
}

function requireStatus(value: unknown): ManualScenarioReviewStatus {
  if (value === "draft" || value === "ready_for_manual_review" || value === "reference_issues") {
    return value;
  }
  throw new Error("manualScenarioReview.status must be a manual review status");
}

function stableIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return normalized.length === 0 ? "unnamed" : normalized;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireAllowedKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireIso(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO date string`);
  }
  return text;
}
