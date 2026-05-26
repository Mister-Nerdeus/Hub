import { planBuilderReviewFlowSnapshot } from "./generated/planBuilderReviewFlowSnapshot";
import type {
  PlanBuilderReviewFlowPlanSnapshot,
  PlanBuilderReviewFlowPlanViewModel,
  PlanBuilderReviewFlowViewModel
} from "./planBuilderReviewFlowTypes";

export function createPlanBuilderReviewFlowViewModel(
  snapshot = planBuilderReviewFlowSnapshot
): PlanBuilderReviewFlowViewModel {
  const plans = snapshot.plans.map((plan) =>
    createPlanBuilderReviewFlowPlanViewModel(plan as PlanBuilderReviewFlowPlanSnapshot)
  );

  return {
    reviewFlowId: "plan-builder-review-flow-v1",
    manualReviewRequired: plans.some((plan) => plan.manualReviewRequired),
    promotionBlocked: plans.every((plan) => plan.promotionBlocked),
    routeExportReadinessIsApproval: false,
    simulationReadinessIsPromotionReadiness: false,
    plans
  };
}

export function createPlanBuilderReviewFlowPlanViewModel(
  plan: PlanBuilderReviewFlowPlanSnapshot
): PlanBuilderReviewFlowPlanViewModel {
  const routeReady = plan.routeReadinessStatus === "ready";
  const simulationReady = plan.simulationReadyExportStatus === "simulation_ready";
  const manualReviewApproved =
    (plan.manualReviewStatus === "approved_for_promotion_review" ||
      plan.manualReviewStatus === "approved_with_notes") &&
    plan.reviewerDecisionSource !== "none" &&
    plan.sampleRecordCountsAsApproval === false;
  const manualReviewRequired = !manualReviewApproved;

  return {
    planId: plan.planId,
    displayName: plan.displayName,
    routeReady,
    simulationReady,
    manualReviewRequired,
    manualReviewApproved,
    promotionBlocked: plan.promotionStatus === "blocked",
    canOpenReviewPacketReference: isSafeArtifactReference(plan.reviewPacketPath),
    canOpenReviewTemplateReference: isSafeArtifactReference(plan.reviewRecordTemplatePath),
    canStartHelperDraft: plan.manualReviewStatus === "manual_review_required",
    canPromote: false,
    sampleRecordCountsAsApproval: false,
    statusText: {
      route: routeReady ? "Route ready" : "Route blocked",
      simulation: simulationReady ? "Simulation ready" : "Simulation blocked",
      manualReview: manualReviewRequired ? "Manual review required" : "Human review recorded",
      promotion: "Promotion blocked"
    },
    artifactReferences: {
      reviewPacketPath: plan.reviewPacketPath,
      reviewRecordTemplatePath: plan.reviewRecordTemplatePath,
      renderedEvidencePath: plan.renderedEvidencePath
    }
  };
}

function isSafeArtifactReference(path: string): boolean {
  return (
    path.length > 0 &&
    !path.includes("..") &&
    !/^[a-zA-Z]:[\\/]/u.test(path) &&
    !path.toLowerCase().endsWith([".", "docx"].join(""))
  );
}
