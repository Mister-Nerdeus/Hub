import {
  buildManualScenarioReviewSummary,
  type ManualScenarioContract,
  type ManualScenarioSnapshotContract
} from "@nerdeus/shared";
import type { ManualScenarioReviewNote } from "./manualScenarioReviewNotesContract";

export type ManualScenarioReviewItemViewModel = {
  scenarioId: string;
  label: string;
  statusCopy: "Ready for manual review" | "Reference issues found";
  floorplanCopy: string;
  assignmentSetCopy: string;
  staffRosterCopy: string;
  snapshotCopy: "Snapshot present" | "Missing snapshot" | "Snapshot reference stale";
  issueCopies: string[];
  notesCount: number;
};

export function createManualScenarioReviewViewModel(input: {
  scenarios: readonly ManualScenarioContract[];
  snapshots: readonly ManualScenarioSnapshotContract[];
  notes: readonly ManualScenarioReviewNote[];
}): ManualScenarioReviewItemViewModel[] {
  return input.scenarios.map((scenario) => {
    const summary = buildManualScenarioReviewSummary({ scenario, snapshots: input.snapshots });
    const issueCopies = summary.referenceIssues.map((issue) => issue.message);
    return {
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      statusCopy: issueCopies.length === 0 ? "Ready for manual review" : "Reference issues found",
      floorplanCopy: summary.floorplanId,
      assignmentSetCopy: summary.assignmentSetId,
      staffRosterCopy: summary.staffRosterId,
      snapshotCopy: summary.snapshotStatus === "present"
        ? "Snapshot present"
        : summary.snapshotStatus === "missing"
          ? "Missing snapshot"
          : "Snapshot reference stale",
      issueCopies,
      notesCount: input.notes.filter((note) => note.scenarioId === scenario.scenarioId).length
    };
  });
}
