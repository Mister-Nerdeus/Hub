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
      <details data-readiness-details-collapsed-by-default="true">
        <summary>
          <span>
            <span className="eyebrow">Readiness</span>
            <strong id="floorplan-readiness-title">Floorplan readiness details</strong>
          </span>
          <span>{readinessLabel(viewModel.assignmentStatus)} / {readinessLabel(viewModel.simulationStatus)}</span>
        </summary>
        <ul>
          {viewModel.items.map((item) => (
            <li key={item.itemId} data-readiness-item={item.itemId} data-readiness-status={item.status}>
              <span>{item.status === "passed" ? "Ready" : "Needs work"}</span>
              <strong>{item.label}</strong>
              <small>{item.reason}</small>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function readinessLabel(status: FloorplanReadinessContract["assignmentStatus"] | FloorplanReadinessContract["simulationStatus"]): string {
  if (status === "ready_for_assignment") return "Ready for assignment";
  if (status === "ready_for_simulation") return "Prepared for simulation setup";
  return "Needs work";
}
