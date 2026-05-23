import type { SimulationTimelineViewModel } from "./simulationTimelineViewModel";

type SimulationTimelineProofProps = {
  viewModel: SimulationTimelineViewModel;
};

export function SimulationTimelineProof({ viewModel }: SimulationTimelineProofProps) {
  return (
    <section className="simulation-proof" id="simulation-timeline-proof" aria-labelledby="simulation-proof-title">
      <div className="simulation-proof__header">
        <div>
          <p className="eyebrow">Simulation proof</p>
          <h2 id="simulation-proof-title">Simulation Timeline</h2>
        </div>
        <div className="simulation-proof__sources">
          {viewModel.sourceIds.map((source) => (
            <span key={source.label}>
              {source.label}: <strong>{source.value}</strong>
            </span>
          ))}
        </div>
      </div>

      <dl className="simulation-proof__metrics">
        {viewModel.summaryMetrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className="simulation-proof__grid">
        <section className="simulation-proof__panel" aria-labelledby="timeline-title">
          <h3 id="timeline-title">Timeline</h3>
          <ol className="simulation-proof__timeline">
            {viewModel.timelineEvents.map((event) => (
              <li key={event.eventId}>
                <time>{event.minute}</time>
                <span>{event.label}</span>
                <strong>{event.detail}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="simulation-proof__panel" aria-labelledby="nurse-burden-title">
          <h3 id="nurse-burden-title">Nurse Burden</h3>
          <div className="simulation-proof__rows">
            {viewModel.nurseBurdenRows.map((row) => (
              <div key={row.nurseId}>
                <span>{row.nurseId}</span>
                <strong>{row.busyMinutes} min</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="simulation-proof__panel" aria-labelledby="simulation-limitations-title">
          <h3 id="simulation-limitations-title">Limitations</h3>
          <ul className="simulation-proof__limitations">
            {viewModel.limitationRows.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
