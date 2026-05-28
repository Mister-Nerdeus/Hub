import type { SimulationV0InternalDryRunViewModel } from "./simulationV0ViewModel";

type SimulationV0InternalDryRunPanelProps = {
  viewModel: SimulationV0InternalDryRunViewModel;
};

export function SimulationV0InternalDryRunPanel({ viewModel }: SimulationV0InternalDryRunPanelProps) {
  return (
    <section
      className="simulation-v0-panel"
      id="simulation-v0-internal-dry-run-panel"
      aria-labelledby="simulation-v0-title"
    >
      <div className="simulation-v0-panel__header">
        <div>
          <p className="eyebrow">Simulation v0</p>
          <h2 id="simulation-v0-title">Internal Dry-Run Readiness</h2>
        </div>
        <strong>{viewModel.status}</strong>
      </div>

      <dl className="simulation-v0-panel__facts">
        <div>
          <dt>Canonical seed</dt>
          <dd>{viewModel.canonicalSeed}</dd>
        </div>
        <div>
          <dt>Activity profile</dt>
          <dd>{viewModel.activityProfile}</dd>
        </div>
        <div>
          <dt>Ratio presets</dt>
          <dd>{viewModel.ratioPresets.join(" / ")}</dd>
        </div>
        <div>
          <dt>Task placeholders</dt>
          <dd>{viewModel.taskCount}</dd>
        </div>
      </dl>

      <div className="simulation-v0-panel__grid">
        <section aria-labelledby="simulation-v0-queue-title">
          <h3 id="simulation-v0-queue-title">Queue Placeholders</h3>
          <div className="simulation-v0-panel__table" role="table" aria-label="Simulation v0 queue placeholders">
            <div role="row">
              <span role="columnheader">Ratio</span>
              <span role="columnheader">Queued</span>
              <span role="columnheader">Delayed</span>
              <span role="columnheader">Unassigned</span>
              <span role="columnheader">Groups</span>
              <span role="columnheader">Pressure</span>
            </div>
            {viewModel.queueRows.map((row) => (
              <div role="row" key={row.ratioLabel}>
                <span role="cell">{row.ratioLabel}</span>
                <span role="cell">{row.queued}</span>
                <span role="cell">{row.delayed}</span>
                <span role="cell">{row.unassigned}</span>
                <span role="cell">{row.nurseGroups}</span>
                <span role="cell">{row.pressure}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="simulation-v0-artifact-title">
          <h3 id="simulation-v0-artifact-title">Artifact Summary</h3>
          <dl className="simulation-v0-panel__artifact">
            <div>
              <dt>Comparison</dt>
              <dd>{viewModel.comparisonArtifactStatus}</dd>
            </div>
            <div>
              <dt>Reproducibility</dt>
              <dd>{viewModel.reproducibilityStatus}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="simulation-v0-limitations-title">
          <h3 id="simulation-v0-limitations-title">Limitations</h3>
          <ul className="simulation-v0-panel__limitations">
            {viewModel.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
