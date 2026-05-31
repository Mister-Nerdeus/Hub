export type NextWorkflowStepViewModel = {
  title: string;
  body: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  primaryDisabled: boolean;
  secondaryDisabled: boolean;
};

export function createNextWorkflowStepViewModel(input: {
  canUseForAssignment: boolean;
  canPrepareForScenarioSetup: boolean;
}): NextWorkflowStepViewModel {
  if (!input.canUseForAssignment) {
    return {
      title: "Select floorplan",
      body: "Choose or save one active floorplan before assignment setup.",
      primaryActionLabel: "Start Assignments",
      secondaryActionLabel: "Prepare for Scenario Setup",
      primaryDisabled: true,
      secondaryDisabled: true
    };
  }

  if (input.canPrepareForScenarioSetup) {
    return {
      title: "Continue to scenario setup",
      body: "Use the selected assignment context for scenario setup. Simulation and reports remain gated.",
      primaryActionLabel: "Start Assignments",
      secondaryActionLabel: "Prepare for Scenario Setup",
      primaryDisabled: false,
      secondaryDisabled: false
    };
  }

  return {
    title: "Create/select assignment set",
    body: "Build and save a durable assignment set linked to this floorplan version.",
    primaryActionLabel: "Start Assignments",
    secondaryActionLabel: "Prepare for Scenario Setup",
    primaryDisabled: false,
    secondaryDisabled: true
  };
}
