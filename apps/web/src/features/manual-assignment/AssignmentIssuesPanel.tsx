import { AssignmentWarningsPanel } from "./AssignmentWarningsPanel";
import type { ManualWarningRow } from "./manualBurdenViewModel";
import { createAssignmentIssuesViewModel } from "./assignmentIssuesViewModel";

type AssignmentIssuesPanelProps = {
  warnings: ManualWarningRow[];
};

export function AssignmentIssuesPanel({ warnings }: AssignmentIssuesPanelProps) {
  const viewModel = createAssignmentIssuesViewModel(warnings);
  return (
    <section
      className="manual-assignment-workspace__panel assignment-issues-panel"
      aria-labelledby="assignment-issues-title"
      data-assignment-issues-panel="visible"
      data-assignment-warning-count={viewModel.warningCount}
      data-unassigned-occupied-rooms={viewModel.hasUnassignedOccupiedRooms ? "true" : "false"}
      data-high-burden-nurses={viewModel.hasHighBurdenNurses ? "true" : "false"}
      data-wide-spread={viewModel.hasWideSpread ? "true" : "false"}
      data-trauma-mismatch={viewModel.hasTraumaMismatch ? "true" : "false"}
      data-split-room-issue={viewModel.hasSplitRoomIssue ? "true" : "false"}
    >
      <div className="manual-assignment-workspace__panel-header">
        <div>
          <p className="eyebrow">Assignment issues</p>
          <h3 id="assignment-issues-title">Warnings</h3>
        </div>
        <span>{viewModel.warningCount} active</span>
      </div>
      <AssignmentWarningsPanel warnings={viewModel.warnings} />
    </section>
  );
}
