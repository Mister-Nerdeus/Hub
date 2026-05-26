import { PlanBuilderLibrary } from "./PlanBuilderLibrary";
import { createPlanBuilderLibraryViewModel } from "./planBuilderLibraryViewModel";
import { RenderedPlanPreviewPanel } from "./RenderedPlanPreviewPanel";
import { createRenderedPlanPreviewViewModel } from "./renderedPlanPreviewViewModel";

export function PlanBuilderLanding() {
  return (
    <>
      <PlanBuilderLibrary viewModel={createPlanBuilderLibraryViewModel()} />
      <RenderedPlanPreviewPanel viewModel={createRenderedPlanPreviewViewModel()} />
    </>
  );
}
