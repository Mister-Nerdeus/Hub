import { PlanBuilderLibrary } from "./PlanBuilderLibrary";
import { createPlanBuilderLibraryViewModel } from "./planBuilderLibraryViewModel";

export function PlanBuilderLanding() {
  return <PlanBuilderLibrary viewModel={createPlanBuilderLibraryViewModel()} />;
}
