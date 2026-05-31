import type { SimulationReadyExportResult } from "@nerdeus/shared";

export type SimulationReadyExportPanelProps = {
  result: SimulationReadyExportResult | null;
  disabled: boolean;
  onValidateExport: () => void;
  showValidateButton?: boolean;
};

export function SimulationReadyExportPanel({
  result,
  disabled,
  onValidateExport,
  showValidateButton = true
}: SimulationReadyExportPanelProps) {
  return (
    <section className="simulation-ready-export-panel" aria-label="Route-ready export">
      {showValidateButton ? (
        <button type="button" disabled={disabled} onClick={onValidateExport}>
          Validate route-ready export
        </button>
      ) : null}
      <p role="status">{result?.status ?? "not validated"}</p>
      {result == null ? null : (
        <dl>
          <div>
            <dt>Path sync</dt>
            <dd>{result.pathSyncStatus}</dd>
          </div>
          <div>
            <dt>Blocking issues</dt>
            <dd>{result.blockingIssues.length}</dd>
          </div>
          <div>
            <dt>Warnings</dt>
            <dd>{result.warningIssues.length}</dd>
          </div>
          <div>
            <dt>Route-ready plan</dt>
            <dd>{result.simulationReadyPlan == null ? "blocked" : "present"}</dd>
          </div>
        </dl>
      )}
      <IssueList label="Blocking" values={result?.blockingIssues ?? []} />
      <IssueList label="Warnings" values={result?.warningIssues ?? []} />
      <IssueList label="Limitations" values={result?.limitations ?? []} />
    </section>
  );
}

function IssueList({ label, values }: { label: string; values: readonly string[] }) {
  if (values.length === 0) {
    return null;
  }
  return (
    <div>
      <h4>{label}</h4>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}
