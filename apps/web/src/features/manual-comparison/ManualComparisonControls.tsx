import type { ManualComparisonSetContract } from "@nerdeus/shared";

type ManualComparisonControlsProps = {
  comparisonSets: readonly ManualComparisonSetContract[];
  selectedComparisonSet: ManualComparisonSetContract | null;
  selectedComparisonSetId: string | null;
  canCreateComparisonSet: boolean;
  onCreateComparisonSet: () => void;
  onSelectComparisonSet: (comparisonSetId: string | null) => void;
  onRenameComparisonSet: (label: string) => void;
  onSave: () => void;
};

export function ManualComparisonControls({
  comparisonSets,
  selectedComparisonSet,
  selectedComparisonSetId,
  canCreateComparisonSet,
  onCreateComparisonSet,
  onSelectComparisonSet,
  onRenameComparisonSet,
  onSave
}: ManualComparisonControlsProps) {
  return (
    <>
      <div className="manual-comparison-panel__actions">
        <button
          type="button"
          data-manual-comparison-create="true"
          disabled={!canCreateComparisonSet}
          onClick={onCreateComparisonSet}
        >
          Create comparison set
        </button>
        <button type="button" onClick={onSave}>Save</button>
      </div>
      {comparisonSets.length === 0 ? null : (
        <div className="manual-comparison-panel__set-controls">
          <label>
            <span>Comparison set</span>
            <select
              value={selectedComparisonSetId ?? ""}
              data-manual-comparison-select="true"
              onChange={(event) => onSelectComparisonSet(
                event.target.value.length === 0 ? null : event.target.value
              )}
            >
              {comparisonSets.map((set) => (
                <option key={set.comparisonSetId} value={set.comparisonSetId}>{set.label}</option>
              ))}
            </select>
          </label>
          {selectedComparisonSet == null ? null : (
            <label>
              <span>Set label</span>
              <input
                value={selectedComparisonSet.label}
                data-manual-comparison-rename="true"
                onChange={(event) => {
                  if (event.target.value.trim().length === 0) return;
                  onRenameComparisonSet(event.target.value);
                }}
              />
            </label>
          )}
        </div>
      )}
    </>
  );
}
