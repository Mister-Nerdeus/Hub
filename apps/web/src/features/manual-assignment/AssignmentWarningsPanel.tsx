import type { ManualWarningRow } from "./manualBurdenViewModel";

type AssignmentWarningsPanelProps = {
  warnings: ManualWarningRow[];
};

export function AssignmentWarningsPanel({ warnings }: AssignmentWarningsPanelProps) {
  return (
    <ul className="manual-warning-panel" aria-label="Manual assignment warnings">
      {warnings.length > 0 ? (
        warnings.map((warning) => (
          <li className={`manual-warning-panel__item manual-warning-panel__item--${warning.severity}`} key={warning.id}>
            <strong>{warning.code}</strong>
            <span>{warning.displayText}</span>
          </li>
        ))
      ) : (
        <li className="manual-warning-panel__item manual-warning-panel__item--info">
          <strong>NO_WARNINGS</strong>
          <span>No manual assignment warnings for the current synthetic state.</span>
        </li>
      )}
    </ul>
  );
}
