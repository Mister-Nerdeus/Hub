import type { ManualScenarioContract } from "../scenarios/manualScenarioContract.js";
import type { ManualScenarioSnapshotContract } from "../scenarios/manualScenarioSnapshotContract.js";

export type ManualScenarioReferenceIssueType =
  | "missing_floorplan"
  | "missing_assignment_set"
  | "missing_staff_roster"
  | "floorplan_assignment_mismatch"
  | "missing_snapshot"
  | "stale_snapshot_reference";

export type ManualScenarioReferenceIssue = {
  type: ManualScenarioReferenceIssueType;
  message: string;
};

export function classifyManualScenarioReferenceIssues(input: {
  scenario: ManualScenarioContract | null;
  floorplanId?: string | null;
  assignmentSetId?: string | null;
  staffRosterId?: string | null;
  snapshots?: readonly ManualScenarioSnapshotContract[];
}): ManualScenarioReferenceIssue[] {
  const issues: ManualScenarioReferenceIssue[] = [];
  if (input.floorplanId == null) issues.push(issue("missing_floorplan", "Missing floorplan"));
  if (input.assignmentSetId == null) issues.push(issue("missing_assignment_set", "Missing assignment set"));
  if (input.staffRosterId == null) issues.push(issue("missing_staff_roster", "Missing staff roster"));
  if (input.scenario == null) return issues;
  if (input.floorplanId != null && input.assignmentSetId != null && input.scenario.floorplanId !== input.floorplanId) {
    issues.push(issue("floorplan_assignment_mismatch", "Floorplan and assignment references do not match"));
  }
  const snapshot = (input.snapshots ?? []).find((entry) => entry.scenarioId === input.scenario?.scenarioId);
  if (snapshot == null) {
    issues.push(issue("missing_snapshot", "Missing snapshot"));
    return issues;
  }
  if (
    snapshot.floorplanId !== input.scenario.floorplanId ||
    snapshot.assignmentSetId !== input.scenario.assignmentSetId ||
    snapshot.staffRosterId !== input.scenario.staffRosterId
  ) {
    issues.push(issue("stale_snapshot_reference", "Snapshot reference stale"));
  }
  return issues;
}

function issue(type: ManualScenarioReferenceIssueType, message: string): ManualScenarioReferenceIssue {
  return { type, message };
}
