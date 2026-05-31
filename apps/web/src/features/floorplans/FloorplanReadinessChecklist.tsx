import type { FloorplanReadinessContract } from "@nerdeus/shared";

type FloorplanReadinessChecklistProps = {
  viewModel: FloorplanReadinessContract;
};

export function FloorplanReadinessChecklist({ viewModel }: FloorplanReadinessChecklistProps) {
  return (
    <section
      className="floorplan-readiness-checklist"
      aria-labelledby="floorplan-readiness-title"
      data-assignment-readiness={viewModel.assignmentStatus}
      data-simulation-readiness={viewModel.simulationStatus}
    >
      <div>
        <p className="eyebrow">Readiness</p>
        <h3 id="floorplan-readiness-title">Floorplan readiness</h3>
        <p>{readinessLabel(viewModel.assignmentStatus)}</p>
        <p>{readinessLabel(viewModel.simulationStatus)}</p>
      </div>
      <ul data-readiness-details-layout="dense-list">
        {[...viewModel.items].sort(sortReadinessItems).map((item) => (
          <li key={item.itemId} data-readiness-item={item.itemId} data-readiness-status={item.status}>
            <span>{item.status === "passed" ? "Done" : "Needs work"}</span>
            <strong>{item.label}</strong>
            <small>{item.reason}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function readinessLabel(status: FloorplanReadinessContract["assignmentStatus"] | FloorplanReadinessContract["simulationStatus"]): string {
  if (status === "ready_for_assignment") return "Ready for assignment";
  if (status === "blocked_until_assignment_contract") {
    return "Scenario and simulation readiness blocked until later contracts exist.";
  }
  return "Needs work";
}

function sortReadinessItems(
  left: FloorplanReadinessContract["items"][number],
  right: FloorplanReadinessContract["items"][number]
): number {
  if (left.status === right.status) return 0;
  return left.status === "needs_work" ? -1 : 1;
}
