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
      <ul>
        {viewModel.items.map((item) => (
          <li key={item.itemId} data-readiness-item={item.itemId} data-readiness-status={item.status}>
            <span>{item.status === "passed" ? "Ready" : "Needs work"}</span>
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
  if (status === "ready_for_simulation") return "Prepared for simulation setup";
  return "Needs work";
}
