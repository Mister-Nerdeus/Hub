import type { AppSectionId } from "./appNavigation";
import { PRODUCT_WORKFLOW_STEPS, workflowStepForSection } from "./productWorkflowSteps";

export type ProductWorkflowStepViewModel = {
  number: number;
  label: string;
  sectionId: AppSectionId;
  active: boolean;
  state: "current" | "available" | "gated" | "future";
  blockedReason: string | null;
};

export type ProductWorkflowStepperViewModel = {
  activeStepLabel: string;
  steps: ProductWorkflowStepViewModel[];
};

export function createProductWorkflowStepperViewModel(activeSection: AppSectionId): ProductWorkflowStepperViewModel {
  const activeStep = workflowStepForSection(activeSection);
  return {
    activeStepLabel: activeStep.label,
    steps: PRODUCT_WORKFLOW_STEPS.map((step) => {
      const active = step.stepId === activeStep.stepId;
      const state = active ? "current" : workflowStateForStep(step.stepId);
      return {
        number: step.number,
        label: step.label,
        sectionId: step.sectionId,
        active,
        state,
        blockedReason: blockedReasonForState(step.stepId, state)
      };
    })
  };
}

function workflowStateForStep(stepId: (typeof PRODUCT_WORKFLOW_STEPS)[number]["stepId"]): ProductWorkflowStepViewModel["state"] {
  if (stepId === "floorplan" || stepId === "assignments") return "available";
  if (stepId === "scenario" || stepId === "simulation" || stepId === "report") return "gated";
  return "future";
}

function blockedReasonForState(
  stepId: (typeof PRODUCT_WORKFLOW_STEPS)[number]["stepId"],
  state: ProductWorkflowStepViewModel["state"]
): string | null {
  if (state !== "gated") return null;
  if (stepId === "scenario") return "Scenario is gated until a durable assignment set exists.";
  if (stepId === "simulation") return "Simulation is gated until assignment and scenario contracts exist.";
  if (stepId === "report") return "Report is gated until simulation outputs exist.";
  return "This workflow step is not available yet.";
}
