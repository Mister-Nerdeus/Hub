import type { Plan1SimulationProofReport } from "@nerdeus/shared";

export function Plan1SimulationProofReportPanel({ report }: { report: Plan1SimulationProofReport }) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-proof-report-title" data-scenario-stage="proof-report">
      <h3 id="plan-1-proof-report-title">Simulation Proof Report</h3>
      <dl className="scenario-metric-grid">
        <div><dt>Scenario</dt><dd>{report.sections.scenarioIdentity.scenarioId}</dd></div>
        <div><dt>Seed</dt><dd>{report.sections.scenarioIdentity.seed}</dd></div>
        <div><dt>Tasks</dt><dd>{report.sections.generatedTaskSummary.taskCount}</dd></div>
        <div><dt>Dry-run</dt><dd>{report.sections.dryRunSummary.dryRunId}</dd></div>
        <div><dt>Comparison rows</dt><dd>{report.sections.scenarioComparisonSummary.rowCount}</dd></div>
        <div><dt>Deterministic</dt><dd>{report.sections.determinismProof.sameInputProducesSameReport ? "yes" : "no"}</dd></div>
      </dl>
      <h4>Report sections</h4>
      <p>Scenario identity, assumptions summary, assignment summary, generated task summary, dry-run summary, timeline summary, warning explanations, scenario comparison summary, determinism proof, limitations, and non-claims.</p>
      <p>{report.sections.limitations.join(" ")}</p>
      <p>{report.sections.nonClaims.join(" ")}</p>
    </section>
  );
}
