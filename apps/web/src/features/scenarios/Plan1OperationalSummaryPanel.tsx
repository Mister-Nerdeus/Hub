import type { Plan1OperationalSummary } from "@nerdeus/shared";

export function Plan1OperationalSummaryPanel({ summary }: { summary: Plan1OperationalSummary }) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-operational-summary-title" data-scenario-stage="operational-summary">
      <h3 id="plan-1-operational-summary-title">Operational Summary</h3>
      <dl className="scenario-metric-grid">
        <div><dt>Tasks</dt><dd>{summary.taskCount}</dd></div>
        <div><dt>Completed</dt><dd>{summary.completedTaskCount}</dd></div>
        <div><dt>Deferred</dt><dd>{summary.deferredTaskCount}</dd></div>
        <div><dt>Walking ft</dt><dd>{summary.totalApproxWalkingFeet}</dd></div>
        <div><dt>Avg busy min</dt><dd>{summary.averageApproxBusyMinutes}</dd></div>
        <div><dt>Max queue</dt><dd>{summary.maxQueueDepth}</dd></div>
      </dl>
      <p>Highest burden: {summary.highestBurdenNurseId}</p>
      <p>Warnings: {summary.warningCodes.length === 0 ? "none" : summary.warningCodes.join(", ")}</p>
      <p>{summary.limitations.join(" ")}</p>
      <p>{summary.nonClaims.join(" ")}</p>
    </section>
  );
}
