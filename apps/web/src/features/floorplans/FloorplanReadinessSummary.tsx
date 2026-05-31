import type { FloorplanReadinessContract } from "@nerdeus/shared";

type FloorplanReadinessSummaryProps = {
  viewModel: FloorplanReadinessContract;
};

export function FloorplanReadinessSummary({ viewModel }: FloorplanReadinessSummaryProps) {
  return (
    <section
      className="floorplan-readiness-summary"
      aria-labelledby="floorplan-readiness-summary-title"
      data-compact-readiness-summary="visible"
    >
      <h3 id="floorplan-readiness-summary-title">Readiness summary</h3>
      <dl>
        <div>
          <dt>Floorplan</dt>
          <dd>{viewModel.assignmentStatus === "ready_for_assignment" ? "Ready" : "Needs work"}</dd>
        </div>
        <div>
          <dt>Assignment</dt>
          <dd>{assignmentSummary(viewModel)}</dd>
        </div>
        <div>
          <dt>Scenario</dt>
          <dd>Not ready</dd>
        </div>
        <div>
          <dt>Simulation</dt>
          <dd>Blocked</dd>
        </div>
      </dl>
    </section>
  );
}

function assignmentSummary(viewModel: FloorplanReadinessContract): string {
  const assignmentSetItem = viewModel.items.find((item) => item.itemId === "assignment_set_ready");
  return assignmentSetItem?.status === "passed" ? "Ready" : "Needs assignment set";
}
