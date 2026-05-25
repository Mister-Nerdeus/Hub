import type { Plan1ScenarioComparisonFixture } from "@nerdeus/shared";

export function Plan1ScenarioComparisonPanel({ comparison }: { comparison: Plan1ScenarioComparisonFixture }) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-scenario-comparison-title" data-scenario-stage="comparison-fixtures">
      <h3 id="plan-1-scenario-comparison-title">Scenario Comparison</h3>
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
      <p>{comparison.limitations.join(" ")}</p>
      <p>{comparison.nonClaims.join(" ")}</p>
    </section>
  );
}
