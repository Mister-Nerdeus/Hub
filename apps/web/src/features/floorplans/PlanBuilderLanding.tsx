import { DemoWalkthroughPanel } from "./DemoWalkthroughPanel";
import { createDemoWalkthroughViewModel } from "./demoWalkthroughViewModel";
import { DeveloperEvidencePanel } from "./DeveloperEvidencePanel";
import { createDeveloperEvidenceViewModel } from "./developerEvidenceViewModel";
import { ManualReviewCtaPanel } from "./ManualReviewCtaPanel";
import { ManualReviewActions } from "./ManualReviewActions";
import { ManualReviewHelper } from "./ManualReviewHelper";
import { createManualReviewCtaViewModel } from "./manualReviewCtaViewModel";
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
      <DemoWalkthroughPanel viewModel={createDemoWalkthroughViewModel()} />
      <PlanBuilderLibrary viewModel={createPlanBuilderLibraryViewModel()} />
      <RenderedPlanPreviewPanel viewModel={createRenderedPlanPreviewViewModel()} />
      <ManualReviewCtaPanel viewModel={createManualReviewCtaViewModel()} />
      <ManualReviewActions viewModel={createManualReviewActionsViewModel()} />
      <ManualReviewHelper viewModel={createManualReviewHelperViewModel()} />
      <DeveloperEvidencePanel viewModel={createDeveloperEvidenceViewModel("reviewer")} />
      <PromotionBlockedBanner viewModel={createPromotionBlockedViewModel()} />
    </>
  );
}
