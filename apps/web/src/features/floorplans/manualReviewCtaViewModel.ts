import { createOperationalDemoOperatorSnapshot } from "./operationalDemoSnapshotAdapter";
import {
  manualReviewAllowedScope,
  manualReviewForbiddenScope,
  manualReviewPromotionDisabledCopy
} from "./manualReviewCtaCopy";
import { buildReviewArtifactAction, type ReviewArtifactAction } from "./reviewArtifactLinks";

export type ManualReviewCtaPlanViewModel = {
  planId: string;
  displayName: string;
  routeReadinessLabel: string;
  simulationExportLabel: string;
  manualReviewStatusLabel: string;
  promotionStatusLabel: string;
  actions: readonly ReviewArtifactAction[];
};

export type ManualReviewCtaViewModel = {
  ctaId: "manual-review-cta-v1";
  heading: "Manual Review Call To Action";
  allowedScope: readonly string[];
  forbiddenScope: readonly string[];
  promotionDisabledCopy: string;
  plans: ManualReviewCtaPlanViewModel[];
};

export function createManualReviewCtaViewModel(): ManualReviewCtaViewModel {
  const snapshot = createOperationalDemoOperatorSnapshot();
  return {
    ctaId: "manual-review-cta-v1",
    heading: "Manual Review Call To Action",
    allowedScope: manualReviewAllowedScope,
    forbiddenScope: manualReviewForbiddenScope,
    promotionDisabledCopy: manualReviewPromotionDisabledCopy,
    plans: snapshot.operatorPlans.map((plan) => ({
      planId: plan.planId,
      displayName: plan.displayName,
      routeReadinessLabel: plan.routeReadinessLabel,
      simulationExportLabel: plan.simulationExportLabel,
      manualReviewStatusLabel: plan.manualReviewStatusLabel,
      promotionStatusLabel: plan.promotionStatusLabel,
      actions: [
        buildReviewArtifactAction(plan.planId, "review-packet", plan.safeReviewPacketReference.actionLabel),
        buildReviewArtifactAction(plan.planId, "review-template", plan.safeReviewTemplateReference.actionLabel),
        buildReviewArtifactAction(plan.planId, "rendered-preview", "View rendered preview"),
        buildReviewArtifactAction(plan.planId, "developer-evidence", "View route/export status")
      ]
    }))
  };
}
