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
          <tr key={`${row.scenario}-${row.floorplan}`}>
            <td>{row.scenario}</td>
            <td>{row.floorplan}</td>
            <td>{row.staffRoster}</td>
            <td>{row.assignmentSet}</td>
            <td>{row.snapshot}</td>
            <td>{row.referenceIssues}</td>
            <td>{row.manualNotesCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
