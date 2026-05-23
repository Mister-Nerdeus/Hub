import "./OperationalOutcomeDashboardProof.css";

import type { OperationalOutcomeDashboardViewModel } from "./operationalOutcomeDashboardViewModel";

type OperationalOutcomeDashboardProofProps = {
  viewModel: OperationalOutcomeDashboardViewModel;
};

export function OperationalOutcomeDashboardProof({ viewModel }: OperationalOutcomeDashboardProofProps) {
  return (
    <section
      className="outcome-dashboard-proof"
      id="operational-outcome-dashboard-proof"
      aria-labelledby="outcome-dashboard-proof-title"
    >
      <div className="outcome-dashboard-proof__header">
        <div>
          <p className="eyebrow">Operational outcome proof surface</p>
          <h2 id="outcome-dashboard-proof-title">{viewModel.proofTitle}</h2>
        </div>
        <span className="outcome-dashboard-proof__badge">{viewModel.proofBadge}</span>
      </div>

      <section className="outcome-dashboard-proof__panel" aria-labelledby="outcome-metrics-title">
        <h3 id="outcome-metrics-title">Operational outcome cards</h3>
        <div className="outcome-dashboard-proof__cards">
          {viewModel.metricCards.map((metric) => (
            <article className="outcome-dashboard-proof__card" key={metric.metricId}>
              <h4>{metric.label}</h4>
              <p className="outcome-dashboard-proof__unit">{metric.unit}</p>
              <dl className="outcome-dashboard-proof__metric-grid">
                <div>
                  <dt>3:1 light</dt>
                  <dd>{metric.threeToOneLight}</dd>
                </div>
                <div>
                  <dt>4:1 light</dt>
                  <dd>{metric.fourToOneLight}</dd>
                </div>
                <div>
                  <dt>3:1 slammed</dt>
                  <dd>{metric.threeToOneSlammed}</dd>
                </div>
                <div>
                  <dt>4:1 slammed</dt>
                  <dd>{metric.fourToOneSlammed}</dd>
                </div>
                <div>
                  <dt>Light ratio Δ%</dt>
                  <dd className={metric.ratioDeltaDirection === "improved" ? "outcome-dashboard-proof__delta--good" : "outcome-dashboard-proof__delta--bad"}>
                    {metric.ratioDeltaPercent}%
                  </dd>
                </div>
                <div>
                  <dt>Δ absolute</dt>
                  <dd>{metric.ratioDeltaAbsoluteChange}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="outcome-dashboard-proof__grid" aria-labelledby="outcome-contrast-title">
        <section className="outcome-dashboard-proof__panel">
          <h3 id="outcome-contrast-title">3:1 vs 4:1 operational contrast</h3>
          <p className="outcome-dashboard-proof__subtitle">{viewModel.ratioComparisonBaselineLabel} baseline to {viewModel.ratioComparisonModifiedLabel} modified</p>
          <ul className="outcome-dashboard-proof__contrast-list">
            {viewModel.ratioDelta.deltas.map((delta) => (
              <li key={delta.metricId}>
                <span>{delta.metricId}</span>
                <strong>{delta.direction}</strong>
                <code>{delta.percentChange}%</code>
              </li>
            ))}
          </ul>
        </section>

        <section className="outcome-dashboard-proof__panel">
          <h3 id="outcome-band-title">Operational pressure bands</h3>
          <p className="outcome-dashboard-proof__subtitle">Visual bands show {viewModel.intensityContrastLabel} plus ratio contrast</p>
          <div className="outcome-dashboard-proof__band-grid">
            {viewModel.pressureBands.map((entry) => (
              <article className={`outcome-dashboard-proof__band-card outcome-dashboard-proof__band-card--${entry.band}`} key={entry.scenario}>
                <h4>{entry.scenario}</h4>
                <p>{entry.band}</p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="outcome-dashboard-proof__panel" aria-labelledby="outcome-delta-title">
        <h3 id="outcome-delta-title">Operational delta comparison details</h3>
        <dl className="outcome-dashboard-proof__deltas">
          <div>
            <dt>Comparison id</dt>
            <dd>{viewModel.ratioDelta.comparisonId}</dd>
          </div>
          <div>
            <dt>Baseline</dt>
            <dd>{viewModel.ratioComparisonBaselineLabel}</dd>
          </div>
          <div>
            <dt>Modified</dt>
            <dd>{viewModel.ratioComparisonModifiedLabel}</dd>
          </div>
        </dl>
        <pre className="outcome-dashboard-proof__json">{viewModel.jsonPreview}</pre>
      </section>

      <section className="outcome-dashboard-proof__panel" aria-labelledby="outcome-limitations-title">
        <h3 id="outcome-limitations-title">Limitations</h3>
        <ul className="outcome-dashboard-proof__limitations">
          {viewModel.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}

