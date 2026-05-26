import { ManualReviewActions } from "./ManualReviewActions";
import { ManualReviewHelper } from "./ManualReviewHelper";
import { createManualReviewActionsViewModel } from "./manualReviewActionsViewModel";
import { createManualReviewHelperViewModel } from "./manualReviewHelperViewModel";
import { PlanBuilderLibrary } from "./PlanBuilderLibrary";
import { createPlanBuilderLibraryViewModel } from "./planBuilderLibraryViewModel";
import { PromotionBlockedBanner } from "./PromotionBlockedBanner";
import { createPromotionBlockedViewModel } from "./promotionBlockedViewModel";
import { RenderedPlanPreviewPanel } from "./RenderedPlanPreviewPanel";
import { createRenderedPlanPreviewViewModel } from "./renderedPlanPreviewViewModel";

export function PlanBuilderLanding() {
  return (
    <>
      <PlanBuilderLibrary viewModel={createPlanBuilderLibraryViewModel()} />
      <RenderedPlanPreviewPanel viewModel={createRenderedPlanPreviewViewModel()} />
      <ManualReviewActions viewModel={createManualReviewActionsViewModel()} />
      <ManualReviewHelper viewModel={createManualReviewHelperViewModel()} />
      <PromotionBlockedBanner viewModel={createPromotionBlockedViewModel()} />
    </>
  );
}
