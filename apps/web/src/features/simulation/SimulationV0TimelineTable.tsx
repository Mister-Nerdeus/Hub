import type { SimulationV0TimelineViewModel } from "./simulationV0TimelineViewModel";

type Props = {
  viewModel: SimulationV0TimelineViewModel;
};

export function SimulationV0TimelineTable({ viewModel }: Props) {
  return (
    <section className="simulation-v0-section" aria-labelledby="simulation-v0-timeline-title">
      <div className="simulation-v0-section__header">
        <div>
          <h3 id="simulation-v0-timeline-title">Dry-run timeline</h3>
          <p>{viewModel.profileId} / {viewModel.ratioView}</p>
        </div>
        <strong>{viewModel.visibleRows.length} of {viewModel.totalRowCount}</strong>
      </div>
      <div className="simulation-v0-panel__table simulation-v0-panel__table--timeline" role="table">
        <div role="row">
          <span role="columnheader">Minute</span>
          <span role="columnheader">Event</span>
          <span role="columnheader">Task</span>
          <span role="columnheader">Bed position</span>
          <span role="columnheader">Synthetic nurse</span>
        </div>
        {viewModel.visibleRows.map((row) => (
          <div role="row" key={`${row.minute}-${row.eventLabel}-${row.taskInstanceId}-${row.syntheticNurseId ?? "none"}`}>
            <span role="cell">{row.minute}</span>
            <span role="cell">{row.eventLabel}</span>
            <span role="cell">{row.taskInstanceId}</span>
            <span role="cell">{row.bedPositionId}</span>
            <span role="cell">{row.syntheticNurseId ?? "unassigned"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
