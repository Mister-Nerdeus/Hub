import { assertSafeArtifactHref } from "../reviewArtifactLinks";
import { createRenderedPlanPreviewPlanViewModel } from "../renderedPlanPreviewViewModel";
import { planBuilderReviewFlowSnapshot } from "../generated/planBuilderReviewFlowSnapshot";

try {
  assertSafeArtifactHref("/private/source.png");
  throw new Error("private source image path was accepted");
} catch (error) {
  if (!(error instanceof Error) || !/unsafe review artifact/u.test(error.message)) throw error;
}

try {
  createRenderedPlanPreviewPlanViewModel({
    ...planBuilderReviewFlowSnapshot.plans[0],
    renderedEvidencePath: "private/source/plan-2-rendered-review.png"
  });
  throw new Error("unsafe rendered path was accepted");
} catch (error) {
  if (!(error instanceof Error) || !/unsafe rendered evidence/u.test(error.message)) throw error;
}
