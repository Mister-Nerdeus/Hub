import {
  createScenarioComparisonViewModel,
  type ScenarioComparisonViewModel
} from "./scenarioComparisonViewModel";
import { SCENARIO_RATIO_COMPARISON_COPY } from "./scenarioRatioComparisonCopy";

export function ScenarioRatioComparisonPanel({
  viewModel = createScenarioComparisonViewModel()
}: {
  viewModel?: ScenarioComparisonViewModel;
}) {
  return (
    <section
      className="scenario-ratio-comparison"
      aria-labelledby="scenario-ratio-comparison-title"
      data-scenario-ratio-stage="comparison-ui-shell"
    >
      <header className="scenario-ratio-comparison__header">
        <div>
          <p className="eyebrow">{SCENARIO_RATIO_COMPARISON_COPY.floorplanLabel}</p>
          <h3 id="scenario-ratio-comparison-title">{SCENARIO_RATIO_COMPARISON_COPY.title}</h3>
          <p>{viewModel.floorplanLabel}: {viewModel.canonicalFloorplanId}</p>
        </div>
        <div className="scenario-ratio-comparison__notices" aria-label="Scenario comparison boundaries">
          {viewModel.nonClaimCopy.map((copy) => (
            <span key={copy}>{copy}</span>
          ))}
        </div>
      </header>

      <div className="scenario-ratio-comparison__cards">
        {viewModel.cards.map((card) => (
          <article
            className="scenario-ratio-comparison__card"
            key={card.ratioId}
            data-ratio-card={card.ratioId}
          >
            <h4>{card.label} scenario</h4>
            <p>{card.scenarioName}</p>
            <dl>
              <div>
                <dt>Synthetic nurse groups</dt>
                <dd>{card.nurseGroupCount}</dd>
              </div>
              <div>
                <dt>Canonical rooms assigned</dt>
                <dd>{card.assignedRoomCount}</dd>
              </div>
              <div>
                <dt>Target rooms per group</dt>
                <dd>{card.targetOccupiedRoomsPerNurse}</dd>
              </div>
              <div>
                <dt>Max rooms per group</dt>
                <dd>{card.maxOccupiedRoomsPerNurse}</dd>
              </div>
            </dl>
            <strong>{card.assignmentSummary}</strong>
          </article>
        ))}
      </div>

      <div className="scenario-ratio-comparison__summary-grid">
        <section>
          <h4>Activity preset</h4>
          <p>{viewModel.activityPresetSummary}</p>
        </section>
        <section>
          <h4>Load and acuity</h4>
          <p>{viewModel.patientLoadSummary}</p>
          <p>{viewModel.acuityPatternSummary}</p>
        </section>
        <section>
          <h4>Nurse group difference</h4>
          <p>3:1 uses {viewModel.nurseCountDifference} additional synthetic nurse groups for the same canonical room set.</p>
        </section>
      </div>

      <div className="scenario-ratio-comparison__table-wrap">
        <table>
          <caption>Placeholder outcome rows</caption>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Category</th>
              <th>Status</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {viewModel.placeholderOutcomeRows.map((row) => (
              <tr key={row.metricId}>
                <td>{row.label}</td>
                <td>{row.category}</td>
                <td>{row.status}</td>
                <td>{row.computed ? "Computed" : row.displayValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
