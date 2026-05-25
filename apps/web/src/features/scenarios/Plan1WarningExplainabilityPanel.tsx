import type { Plan1WarningExplanation } from "@nerdeus/shared";

export function Plan1WarningExplainabilityPanel({ explanations }: { explanations: Plan1WarningExplanation[] }) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-warning-explanations-title" data-scenario-stage="warning-explainability">
      <h3 id="plan-1-warning-explanations-title">Warning Explanations</h3>
      <table>
        <thead>
          <tr><th>Warning</th><th>Severity</th><th>Source</th><th>Explanation</th><th>Interpretation</th></tr>
        </thead>
        <tbody>
          {explanations.map((entry) => (
            <tr key={entry.warningCode}>
              <td>{entry.label}</td>
              <td>{entry.severity}</td>
              <td>{entry.source}</td>
              <td>{entry.plainLanguageExplanation}</td>
              <td>{entry.operationalInterpretation}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{explanations.map((entry) => entry.nonClaim).join(" ")}</p>
    </section>
  );
}
