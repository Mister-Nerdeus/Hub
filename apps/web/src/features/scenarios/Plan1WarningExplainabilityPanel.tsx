import type { Plan1TimelineNarratives } from "@nerdeus/shared";

export function Plan1WarningExplainabilityPanel({ narratives }: { narratives: Plan1TimelineNarratives }) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-warning-explanations-title" data-scenario-stage="warning-explainability">
      <h3 id="plan-1-warning-explanations-title">Warning Explanations</h3>
      <p className="operational-only-label">{narratives.operationalOnlyLabel}</p>
      <div className="warning-card-grid" data-warning-cards="plan-1">
        {narratives.warningCards.map((entry) => (
          <article className="warning-explanation-card" key={entry.warningCode} data-warning-card={entry.warningCode}>
            <div>
              <span>{entry.severity}</span>
              <strong>{entry.label}</strong>
            </div>
            <dl>
              <div><dt>Source</dt><dd>{entry.source}</dd></div>
              <div><dt>Code</dt><dd>{entry.warningCode}</dd></div>
            </dl>
            <p>{entry.explanation}</p>
            <p>{entry.operationalMeaning}</p>
            <p>{entry.nonClaim}</p>
          </article>
        ))}
      </div>
      <div className="timeline-non-claims" data-warning-non-claims="visible">
        <h4>What these warnings do NOT claim</h4>
        <p>{narratives.nonClaims.join(" ")}</p>
      </div>
    </section>
  );
}
