import type { Plan1ScenarioComparisonFixture, Plan1ScenarioComparisonViewModel } from "@nerdeus/shared";

export function Plan1ScenarioComparisonPanel({
  comparison,
  viewModel
}: {
  comparison: Plan1ScenarioComparisonFixture;
  viewModel?: Plan1ScenarioComparisonViewModel;
}) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-scenario-comparison-title" data-scenario-stage="comparison-ux">
      <h3 id="plan-1-scenario-comparison-title">Scenario Comparison</h3>
      {viewModel == null ? (
        <table>
          <thead>
            <tr><th>Profile</th><th>Tasks</th><th>Deferred</th><th>Walking ft</th><th>Max queue</th></tr>
          </thead>
          <tbody>
            {comparison.items.map((item) => (
              <tr key={item.scenarioId}>
                <td>{item.profileId}</td>
                <td>{item.taskCount}</td>
                <td>{item.deferredTaskCount}</td>
                <td>{item.totalApproxWalkingFeet}</td>
                <td>{item.maxQueueDepth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table>
          <thead>
            <tr><th>Profile</th><th>Task delta</th><th>Deferred delta</th><th>Walking delta</th><th>Queue delta</th><th>Summary</th></tr>
          </thead>
          <tbody>
            {viewModel.rows.map((row) => (
              <tr key={row.profileId}>
                <td>{row.profileLabel}</td>
                <td>{row.taskPressureDelta}</td>
                <td>{row.deferredTaskDelta}</td>
                <td>{row.walkingBurdenDelta}</td>
                <td>{row.maxQueueDepthDelta}</td>
                <td>{row.plainLanguageSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>{comparison.limitations.join(" ")}</p>
      <p>{comparison.nonClaims.join(" ")}</p>
    </section>
  );
}
