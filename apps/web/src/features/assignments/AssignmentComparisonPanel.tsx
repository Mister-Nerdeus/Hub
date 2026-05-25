import type { Plan1AssignmentComparisonOutput } from "@nerdeus/shared";

export function AssignmentComparisonPanel({ comparisons }: { comparisons: Plan1AssignmentComparisonOutput[] }) {
  return (
    <section className="assignment-panel" aria-labelledby="assignment-comparison-title" data-assignment-stage="comparison-fixtures">
      <h3 id="assignment-comparison-title">Deterministic 3:1 vs 4:1 Fixtures</h3>
      <table>
        <thead>
          <tr><th>Fixture</th><th>Rooms</th><th>Occupied</th><th>Burden</th><th>Walking</th><th>Warnings</th></tr>
        </thead>
        <tbody>
          {comparisons.map((comparison) => (
            <tr key={comparison.fixtureId} data-fixture-id={comparison.fixtureId}>
              <td>{comparison.label}</td>
              <td>{comparison.assignedRoomCount}</td>
              <td>{comparison.occupiedRoomCount}</td>
              <td>{comparison.totalBurdenScore}</td>
              <td>{comparison.walkingTotalFeet}</td>
              <td>{comparison.warningCodes.join(", ") || "none"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
