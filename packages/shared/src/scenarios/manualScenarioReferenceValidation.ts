import type { ManualAssignmentSetContract } from "../assignments/manualAssignmentSetContract.js";
import type { ManualScenarioContract } from "./manualScenarioContract.js";
import { validateManualScenarioContract } from "./manualScenarioValidation.js";

export type ManualScenarioReferenceValidationSeverity = "error" | "warning";

export type ManualScenarioReferenceValidationIssue = {
  severity: ManualScenarioReferenceValidationSeverity;
  code:
    | "missing_floorplan"
    | "missing_assignment_set"
    | "assignment_set_floorplan_mismatch"
    | "missing_staff_roster";
  message: string;
};

export type ManualScenarioReferenceValidationResult = {
  status: "passed" | "failed";
  issues: ManualScenarioReferenceValidationIssue[];
};

export type ManualScenarioReferenceReadinessInput = {
  floorplanId?: string | null;
  assignmentSetId?: string | null;
  staffRosterId?: string | null;
};

export function validateManualScenarioReferenceReadiness(
  input: ManualScenarioReferenceReadinessInput
): ManualScenarioReferenceValidationResult {
  const issues: ManualScenarioReferenceValidationIssue[] = [];
  if (input.floorplanId == null || input.floorplanId.trim().length === 0) {
    issues.push(issue("error", "missing_floorplan", "Missing floorplan"));
  }
  if (input.assignmentSetId == null || input.assignmentSetId.trim().length === 0) {
    issues.push(issue("error", "missing_assignment_set", "Missing assignment set"));
  }
  if (input.staffRosterId == null || input.staffRosterId.trim().length === 0) {
    issues.push(issue("error", "missing_staff_roster", "Missing staff roster"));
  }
  return {
    status: issues.some((candidate) => candidate.severity === "error") ? "failed" : "passed",
    issues
  };
}

export function validateManualScenarioReferences(input: {
  scenario: ManualScenarioContract;
  floorplanIds: readonly string[];
  assignmentSets: readonly ManualAssignmentSetContract[];
  staffRosterIds: readonly string[];
}): ManualScenarioReferenceValidationResult {
  const scenario = validateManualScenarioContract(input.scenario);
  const floorplanIds = new Set(input.floorplanIds);
  const assignmentSetById = new Map(input.assignmentSets.map((assignmentSet) => [
    assignmentSet.assignmentSetId,
    assignmentSet
  ]));
  const staffRosterIds = new Set(input.staffRosterIds);
  const issues: ManualScenarioReferenceValidationIssue[] = [];

  if (!floorplanIds.has(scenario.floorplanId)) {
    issues.push(issue("error", "missing_floorplan", "Missing floorplan"));
  }

  const assignmentSet = assignmentSetById.get(scenario.assignmentSetId) ?? null;
  if (assignmentSet == null) {
    issues.push(issue("error", "missing_assignment_set", "Missing assignment set"));
  } else if (assignmentSet.floorplanId !== scenario.floorplanId) {
    issues.push(issue("error", "assignment_set_floorplan_mismatch", "Assignment set does not match floorplan"));
  }

  if (!staffRosterIds.has(scenario.staffRosterId)) {
    issues.push(issue("error", "missing_staff_roster", "Missing staff roster"));
  }

  return {
    status: issues.some((candidate) => candidate.severity === "error") ? "failed" : "passed",
    issues
  };
}

function issue(
  severity: ManualScenarioReferenceValidationSeverity,
  code: ManualScenarioReferenceValidationIssue["code"],
  message: string
): ManualScenarioReferenceValidationIssue {
  return { severity, code, message };
}
