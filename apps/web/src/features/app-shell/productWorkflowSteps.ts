import type { AppSectionId } from "./appNavigation";

export type ProductWorkflowStepId = "floorplan" | "assignments" | "scenario" | "simulation" | "report";

export type ProductWorkflowStep = {
  stepId: ProductWorkflowStepId;
  number: number;
  label: string;
  sectionId: AppSectionId;
  mappedSectionIds: readonly AppSectionId[];
};

export const PRODUCT_WORKFLOW_STEPS: readonly ProductWorkflowStep[] = [
  {
    stepId: "floorplan",
    number: 1,
    label: "Floorplan",
    sectionId: "floorplans",
    mappedSectionIds: ["floorplans", "editor"]
  },
  {
    stepId: "assignments",
    number: 2,
    label: "Assignments",
    sectionId: "assignments",
    mappedSectionIds: ["assignments", "manual-assignment"]
  },
  {
    stepId: "scenario",
    number: 3,
    label: "Scenario",
    sectionId: "scenarios",
    mappedSectionIds: ["scenarios"]
  },
  {
    stepId: "simulation",
    number: 4,
    label: "Simulation",
    sectionId: "simulation",
    mappedSectionIds: ["simulation"]
  },
  {
    stepId: "report",
    number: 5,
    label: "Report",
    sectionId: "reports",
    mappedSectionIds: ["reports"]
  }
];

export function workflowStepForSection(sectionId: AppSectionId): ProductWorkflowStep {
  return PRODUCT_WORKFLOW_STEPS.find((step) => step.mappedSectionIds.includes(sectionId))
    ?? PRODUCT_WORKFLOW_STEPS[0]!;
}
