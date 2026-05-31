import { AssignmentWarningsPanel } from "./AssignmentWarningsPanel";
import type { ManualWarningRow } from "./manualBurdenViewModel";

type AssignmentIssuesPanelProps = {
  warnings: ManualWarningRow[];
};

export function AssignmentIssuesPanel({ warnings }: AssignmentIssuesPanelProps) {
  return (
    <section
      className="manual-assignment-workspace__panel assignment-issues-panel"
      aria-labelledby="assignment-issues-title"
      data-assignment-issues-panel="visible"
      data-assignment-warning-count={warnings.length}
    >
      <div className="manual-assignment-workspace__panel-header">
        <div>
          <p className="eyebrow">Assignment issues</p>
          <h3 id="assignment-issues-title">Warnings</h3>
        </div>
        <span>{warnings.length} active</span>
      </div>
      <AssignmentWarningsPanel warnings={warnings} />
    </section>
  );
}
