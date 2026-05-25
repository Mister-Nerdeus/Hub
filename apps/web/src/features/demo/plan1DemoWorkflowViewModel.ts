import type { AppSectionId } from "../app-shell/appNavigation";

export type Plan1DemoStepId =
  | "open-repaired-plan-1"
  | "review-floorplan"
  | "review-assignments"
  | "review-scenario-assumptions"
  | "view-deterministic-dry-run"
  | "review-scenario-comparison"
  | "review-proof-report";

export type Plan1DemoStepStatus = "complete" | "current" | "upcoming";

export type Plan1DemoWorkflowStep = {
  stepId: Plan1DemoStepId;
  label: string;
  appSection: AppSectionId;
  anchorId?: string;
  status: Plan1DemoStepStatus;
  actionLabel: string;
};

export type Plan1DemoWorkflowViewModel = {
  planId: "default-er-layout-plan-1";
  readinessBadge: {
    label: string;
    status: "ready" | "needs-plan-1";
  };
  currentStep: Plan1DemoWorkflowStep;
  nextRecommendedStep: Plan1DemoWorkflowStep;
  steps: Plan1DemoWorkflowStep[];
  nonClaims: string[];
  limitations: string[];
  developerEvidenceSeparated: true;
};

const PLAN_1_ID = "default-er-layout-plan-1";

const BASE_STEPS: Omit<Plan1DemoWorkflowStep, "status">[] = [
  {
    stepId: "open-repaired-plan-1",
    label: "Open repaired Plan 1",
    appSection: "floorplans",
    actionLabel: "Open Plan 1"
  },
  {
    stepId: "review-floorplan",
    label: "Review floorplan",
    appSection: "editor",
    actionLabel: "Review editor"
  },
  {
    stepId: "review-assignments",
    label: "Review assignments",
    appSection: "assignments",
    actionLabel: "Review assignments"
  },
  {
    stepId: "review-scenario-assumptions",
    label: "Review scenario assumptions",
    appSection: "scenarios",
    anchorId: "plan-1-assumptions-title",
    actionLabel: "Review assumptions"
  },
  {
    stepId: "view-deterministic-dry-run",
    label: "Run/view deterministic dry-run",
    appSection: "scenarios",
    anchorId: "plan-1-operational-summary-title",
    actionLabel: "View dry-run"
  },
  {
    stepId: "review-scenario-comparison",
    label: "Review scenario comparison",
    appSection: "scenarios",
    anchorId: "plan-1-scenario-comparison-title",
    actionLabel: "Review comparison"
  },
  {
    stepId: "review-proof-report",
    label: "Review proof report",
    appSection: "scenarios",
    anchorId: "plan-1-proof-report-title",
    actionLabel: "Review proof"
  }
];

export function createPlan1DemoWorkflowViewModel({
  activeSection,
  activePlanId
}: {
  activeSection: AppSectionId;
  activePlanId?: string | null;
}): Plan1DemoWorkflowViewModel {
  const plan1Active = activePlanId === PLAN_1_ID;
  const currentIndex = currentStepIndex(activeSection, plan1Active);
  const steps: Plan1DemoWorkflowStep[] = BASE_STEPS.map((step, index) => {
    const status: Plan1DemoStepStatus =
      index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
    return {
      ...step,
      status
    };
  });
  const currentStep = steps[currentIndex] ?? steps[0]!;
  const nextRecommendedStep = steps[Math.min(currentIndex + 1, steps.length - 1)] ?? currentStep;

  return {
    planId: PLAN_1_ID,
    readinessBadge: {
      label: plan1Active ? "Plan 1 ready" : "Plan 1 required",
      status: plan1Active ? "ready" : "needs-plan-1"
    },
    currentStep,
    nextRecommendedStep,
    steps,
    nonClaims: [
      "Synthetic operational modeling only.",
      "Not a clinical safety score.",
      "Not a staffing compliance recommendation.",
      "Not a legal compliance assessment.",
      "Not a patient outcome prediction.",
      "Not based on real patient, staff, EHR, or hospital data."
    ],
    limitations: [
      "Plan 1 demo workflow only.",
      "Deterministic dry-run proof uses seeded synthetic fixtures.",
      "Developer evidence remains in the Developer/Evidence section."
    ],
    developerEvidenceSeparated: true
  };
}

function currentStepIndex(activeSection: AppSectionId, plan1Active: boolean): number {
  if (!plan1Active) {
    return 0;
  }
  if (activeSection === "editor") {
    return 1;
  }
  if (activeSection === "assignments") {
    return 2;
  }
  if (activeSection === "scenarios") {
    return 3;
  }
  return 0;
}
