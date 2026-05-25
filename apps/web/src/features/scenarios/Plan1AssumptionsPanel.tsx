import type { Plan1AssumptionViewModel } from "@nerdeus/shared";

export function Plan1AssumptionsPanel({ viewModel }: { viewModel: Plan1AssumptionViewModel }) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-assumptions-title" data-scenario-stage="assumptions-ui">
      <h3 id="plan-1-assumptions-title">Assumptions</h3>
      <p>Mode: {viewModel.mode}</p>
      {viewModel.sections.map((section) => (
        <div key={section.sectionId} data-assumption-section={section.sectionId}>
          <h4>{section.label}</h4>
          <dl className="scenario-metric-grid">
            {section.entries.map((entry) => (
              <div key={`${section.sectionId}-${entry.label}`}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <p>{viewModel.nonClaims.join(" ")}</p>
    </section>
  );
}
