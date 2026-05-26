import { buildOperationalDemoSnapshot } from "@nerdeus/shared";

import { planBuilderReviewFlowSnapshot } from "./generated/planBuilderReviewFlowSnapshot";

export function createOperationalDemoOperatorSnapshot() {
  return buildOperationalDemoSnapshot({
    plans: planBuilderReviewFlowSnapshot.plans
  });
}

export function createOperationalDemoDeveloperSnapshot() {
  return buildOperationalDemoSnapshot({
    plans: planBuilderReviewFlowSnapshot.plans,
    includeDeveloperEvidence: true
  });
}
