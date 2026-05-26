import type { PlanBuilderReviewFlowSnapshotPlan } from "./generated/planBuilderReviewFlowSnapshot";

export type PlanReviewFlowPlanId = "plan-2" | "plan-3" | "plan-4" | "plan-5";

export type PlanManualReviewStatus =
  | "manual_review_required"
  | "approved_for_promotion_review"
  | "approved_with_notes"
  | "rejected_needs_correction";

export type PlanPromotionStatus = "blocked";

export type PlanBuilderReviewFlowPlanSnapshot = Omit<
  PlanBuilderReviewFlowSnapshotPlan,
  "planId" | "manualReviewStatus" | "promotionStatus" | "reviewerDecisionSource" | "sampleRecordCountsAsApproval"
> & {
  planId: PlanReviewFlowPlanId;
  manualReviewStatus: PlanManualReviewStatus;
  promotionStatus: PlanPromotionStatus;
  reviewerDecisionSource: "none" | "explicit_manual_artifact" | "operator_entered_structured_decision";
  sampleRecordCountsAsApproval: boolean;
};

export type PlanBuilderReviewFlowPlanViewModel = {
  planId: PlanReviewFlowPlanId;
  displayName: string;
  routeReady: boolean;
  simulationReady: boolean;
  manualReviewRequired: boolean;
  manualReviewApproved: boolean;
  promotionBlocked: boolean;
  canOpenReviewPacketReference: boolean;
  canOpenReviewTemplateReference: boolean;
  canStartHelperDraft: boolean;
  canPromote: false;
  sampleRecordCountsAsApproval: false;
  statusText: {
    route: "Route ready" | "Route blocked";
    simulation: "Simulation ready" | "Simulation blocked";
    manualReview: "Manual review required" | "Human review recorded";
    promotion: "Promotion blocked";
  };
  artifactReferences: {
    reviewPacketPath: string;
    reviewRecordTemplatePath: string;
    renderedEvidencePath: string;
  };
};

export type PlanBuilderReviewFlowViewModel = {
  reviewFlowId: "plan-builder-review-flow-v1";
  manualReviewRequired: boolean;
  promotionBlocked: boolean;
  routeExportReadinessIsApproval: false;
  simulationReadinessIsPromotionReadiness: false;
  plans: PlanBuilderReviewFlowPlanViewModel[];
};
