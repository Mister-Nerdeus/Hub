import type { AppSectionId } from "./appNavigation";
import { PRODUCT_WORKFLOW_STEPS, workflowStepForSection } from "./productWorkflowSteps";

export type ProductWorkflowStepViewModel = {
  number: number;
  label: string;
  sectionId: AppSectionId;
  active: boolean;
};

export type ProductWorkflowStepperViewModel = {
  activeStepLabel: string;
  steps: ProductWorkflowStepViewModel[];
};

export function createProductWorkflowStepperViewModel(activeSection: AppSectionId): ProductWorkflowStepperViewModel {
  const activeStep = workflowStepForSection(activeSection);
  return {
    activeStepLabel: activeStep.label,
    steps: PRODUCT_WORKFLOW_STEPS.map((step) => ({
      number: step.number,
      label: step.label,
      sectionId: step.sectionId,
      active: step.stepId === activeStep.stepId
    }))
  };
}
