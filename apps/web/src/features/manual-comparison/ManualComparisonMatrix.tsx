import type { ManualComparisonReferenceMatrixRow } from "@nerdeus/shared";

type ManualComparisonMatrixProps = {
  rows: readonly ManualComparisonReferenceMatrixRow[];
};

export function ManualComparisonMatrix({ rows }: ManualComparisonMatrixProps) {
  return (
    <table
      className="manual-comparison-matrix"
      data-manual-comparison-matrix="true"
      data-manual-comparison-matrix-scope="identity_reference_only"
      data-manual-comparison-scoring-blocked="true"
      data-manual-comparison-recommendations-blocked="true"
      data-manual-comparison-simulation-blocked="true"
    >
      <thead>
        <tr>
          <th>Scenario ID</th>
          <th>Scenario</th>
          <th>Floorplan</th>
          <th>Staff roster</th>
          <th>Assignment set</th>
          <th>Snapshot</th>
          <th>Reference issues</th>
          <th>Manual notes count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.scenarioId} data-manual-comparison-scenario-id={row.scenarioId}>
            <td>{row.scenarioId}</td>
            <td>{row.scenarioLabel}</td>
            <td>{row.floorplanId}</td>
            <td>{row.staffRosterId}</td>
            <td>{row.assignmentSetId}</td>
            <td>{row.snapshotStatus}</td>
            <td>{row.referenceIssues}</td>
            <td>{row.manualNotesCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
