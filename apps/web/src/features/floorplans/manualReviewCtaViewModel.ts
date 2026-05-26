import { createOperationalDemoOperatorSnapshot } from "./operationalDemoSnapshotAdapter";
import {
  manualReviewAllowedScope,
  manualReviewForbiddenScope,
  manualReviewPromotionDisabledCopy
} from "./manualReviewCtaCopy";

export type ManualReviewCtaPlanViewModel = {
  planId: string;
  displayName: string;
  routeReadinessLabel: string;
  simulationExportLabel: string;
  manualReviewStatusLabel: string;
  promotionStatusLabel: string;
  actions: readonly string[];
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
        plan.safeReviewPacketReference.actionLabel,
        plan.safeReviewTemplateReference.actionLabel,
        "View rendered preview",
        "View route/export status"
      ]
    }))
  };
}
