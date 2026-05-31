import type { ActiveFloorplanContract } from "@nerdeus/shared";

export type NextWorkflowTargetSection = "floorplans" | "assignments" | "scenarios";
export type AssignmentSetPlaceholderState = "not_started" | "placeholder_ready";
export type ScenarioAssumptionsState = "not_started" | "missing" | "ready";

export type NextWorkflowStepViewModel = {
  stateId:
    | "select_floorplan"
    | "create_or_select_assignment_set"
    | "continue_to_scenario_setup"
    | "complete_assumptions";
  title: string;
  actionLabel: string;
  description: string;
  targetSection: NextWorkflowTargetSection;
  assignmentTruthImplemented: false;
};

export function createNextWorkflowStepViewModel(input: {
  activeFloorplan: ActiveFloorplanContract | null;
  assignmentSetState: AssignmentSetPlaceholderState;
  scenarioAssumptionsState: ScenarioAssumptionsState;
}): NextWorkflowStepViewModel {
  if (input.activeFloorplan == null || input.activeFloorplan.workflowStatus === "no_floorplan_selected") {
    return {
      stateId: "select_floorplan",
      title: "Select floorplan",
      actionLabel: "Select floorplan",
      description: "Choose the active operational layout before assignment setup.",
      targetSection: "floorplans",
      assignmentTruthImplemented: false
    };
  }

  if (input.assignmentSetState !== "placeholder_ready") {
    return {
      stateId: "create_or_select_assignment_set",
      title: "Create/select assignment set",
      actionLabel: "Open Assignments",
      description: "Milestone A only prepares this handoff; no durable assignment set is stored yet.",
      targetSection: "assignments",
      assignmentTruthImplemented: false
    };
  }

  if (input.scenarioAssumptionsState === "missing") {
    return {
      stateId: "complete_assumptions",
      title: "Complete assumptions",
      actionLabel: "Open Scenario",
      description: "Scenario setup needs assumptions before later simulation review can be considered.",
      targetSection: "scenarios",
      assignmentTruthImplemented: false
    };
  }

  return {
    stateId: "continue_to_scenario_setup",
    title: "Prepare for Scenario Setup",
    actionLabel: "Open Scenario",
    description: "Assignment readiness is represented only by a placeholder state in Milestone A.",
    targetSection: "scenarios",
    assignmentTruthImplemented: false
  };
}
