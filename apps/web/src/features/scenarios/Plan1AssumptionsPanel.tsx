import { buildPlan1AssumptionDisplayGroups, type Plan1AssumptionViewModel } from "@nerdeus/shared";

export function Plan1AssumptionsPanel({ viewModel }: { viewModel: Plan1AssumptionViewModel }) {
  const displayGroups = buildPlan1AssumptionDisplayGroups(viewModel);
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-assumptions-title" data-scenario-stage="assumptions-ui">
      <h3 id="plan-1-assumptions-title">Assumptions</h3>
      <div className="assumptions-reader-summary" data-assumption-mode={viewModel.mode}>
        <strong>Read-only proof mode</strong>
        <span>Assumptions are synthetic operational inputs for deterministic Plan 1 demo review.</span>
      </div>
      {displayGroups.map((group) => (
        <article className="assumption-display-group" key={group.groupId} data-assumption-display-group={group.groupId}>
          <h4>{group.label}</h4>
          <p>{group.readerSummary}</p>
          <dl className="scenario-metric-grid">
            {group.entries.map((entry) => (
              <div key={`${group.groupId}-${entry.label}`}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
      <div className="assumptions-non-claims-callout" data-assumption-non-claims="visible">
        <h4>What this simulation does NOT claim</h4>
        <ul>
          {viewModel.nonClaims.map((nonClaim) => (
            <li key={nonClaim}>{nonClaim}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
