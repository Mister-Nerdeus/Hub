import { planBuilderReviewFlowSnapshot } from "./generated/planBuilderReviewFlowSnapshot";
import type { PlanReviewFlowPlanId } from "./planBuilderReviewFlowTypes";

export type ManualReviewHelperFieldId =
  | "manualReviewStatus"
  | "reviewerDecisionSource"
  | "roomPlacementPlausibility"
  | "doorPlacementPlausibility"
  | "hallwayPathConnectivityPlausibility"
  | "stationPlacementPlausibility"
  | "labelsReadability"
  | "knownLimitationsAccepted"
  | "reviewerNotes"
  | "blockingIssues";

export type ManualReviewHelperDefaultState = {
  manualReviewStatus: "manual_review_required";
  reviewerDecisionSource: "none";
  promotionAuthorization: "none";
  promotionEnabled: false;
  submitEnabled: false;
  canPersistDecision: false;
  canCreateReviewRecord: false;
};

export type ManualReviewHelperFieldViewModel = {
  id: ManualReviewHelperFieldId;
  label: string;
  value: string;
  guidance: string;
};

export type ManualReviewHelperPlanViewModel = {
  planId: PlanReviewFlowPlanId;
  displayName: string;
  defaultState: ManualReviewHelperDefaultState;
  fields: ManualReviewHelperFieldViewModel[];
};

export type ManualReviewHelperViewModel = {
  helperId: "plan-builder-manual-review-helper-v1";
  plans: ManualReviewHelperPlanViewModel[];
  draftOnlyNotice: string;
  noPersistenceNotice: string;
};

export type ManualReviewHelperDraftInput = {
  manualReviewStatus: "manual_review_required" | "human_review_recorded";
  reviewerDecisionSource: "none" | "explicit_structured_reviewer_record";
  sampleRecordCountsAsDecision: boolean;
};

export type ManualReviewHelperDraftEvaluation = {
  promotionEnabled: false;
  submitEnabled: false;
  canPersistDecision: false;
  canCreateReviewRecord: false;
  reasons: string[];
};

export function createManualReviewHelperViewModel(): ManualReviewHelperViewModel {
  return {
    helperId: "plan-builder-manual-review-helper-v1",
    plans: planBuilderReviewFlowSnapshot.plans.map((plan) => ({
      planId: plan.planId,
      displayName: plan.displayName,
      defaultState: createDefaultManualReviewHelperState(),
      fields: createManualReviewHelperFields()
    })),
    draftOnlyNotice: "Draft guidance only; no review decision is saved.",
    noPersistenceNotice: "This helper does not submit, store, or promote anything."
  };
}

export function createDefaultManualReviewHelperState(): ManualReviewHelperDefaultState {
  return {
    manualReviewStatus: "manual_review_required",
    reviewerDecisionSource: "none",
    promotionAuthorization: "none",
    promotionEnabled: false,
    submitEnabled: false,
    canPersistDecision: false,
    canCreateReviewRecord: false
  };
}

export function evaluateManualReviewHelperDraft(
  input: ManualReviewHelperDraftInput
): ManualReviewHelperDraftEvaluation {
  const reasons = [
    "Manual decisions are not persisted in this batch.",
    "Promotion remains blocked.",
    "A sample or template record does not count as a reviewer decision."
  ];
  if (input.reviewerDecisionSource === "none") {
    reasons.push("No explicit structured reviewer record is present.");
  }
  if (input.sampleRecordCountsAsDecision) {
    reasons.push("Sample data is rejected as a review source.");
  }

  return {
    promotionEnabled: false,
    submitEnabled: false,
    canPersistDecision: false,
    canCreateReviewRecord: false,
    reasons
  };
}

function createManualReviewHelperFields(): ManualReviewHelperFieldViewModel[] {
  return [
    {
      id: "manualReviewStatus",
      label: "Manual Review Status",
      value: "Manual review required",
      guidance: "Use the structured record process outside this draft helper."
    },
    {
      id: "reviewerDecisionSource",
      label: "Reviewer Decision Source",
      value: "None",
      guidance: "A real reviewer source must be recorded separately."
    },
    {
      id: "roomPlacementPlausibility",
      label: "Room Placement Plausibility",
      value: "Not recorded",
      guidance: "Draft checklist field only."
    },
    {
      id: "doorPlacementPlausibility",
      label: "Door Placement Plausibility",
      value: "Not recorded",
      guidance: "Draft checklist field only."
    },
    {
      id: "hallwayPathConnectivityPlausibility",
      label: "Hallway Path Connectivity Plausibility",
      value: "Not recorded",
      guidance: "Draft checklist field only."
    },
    {
      id: "stationPlacementPlausibility",
      label: "Station Placement Plausibility",
      value: "Not recorded",
      guidance: "Draft checklist field only."
    },
    {
      id: "labelsReadability",
      label: "Labels Readability",
      value: "Not recorded",
      guidance: "Draft checklist field only."
    },
    {
      id: "knownLimitationsAccepted",
      label: "Known Limitations Accepted",
      value: "Not recorded",
      guidance: "Draft checklist field only."
    },
    {
      id: "reviewerNotes",
      label: "Reviewer Notes",
      value: "Draft only",
      guidance: "Notes entered here are not saved."
    },
    {
      id: "blockingIssues",
      label: "Blocking Issues",
      value: "Draft only",
      guidance: "Blocking issues must be captured in a future structured record."
    }
  ];
}
