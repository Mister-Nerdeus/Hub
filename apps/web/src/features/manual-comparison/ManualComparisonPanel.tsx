import {
  buildManualComparisonReferenceMatrix,
  buildManualScenarioReviewSummary,
  type ManualScenarioContract,
  type ManualScenarioSnapshotContract
} from "@nerdeus/shared";
import type { ManualScenarioReviewNote } from "../manual-scenario-review/manualScenarioReviewNotesContract";
import { ManualComparisonMatrix } from "./ManualComparisonMatrix";
import {
  createManualComparisonSet,
  renameManualComparisonSet,
  selectManualComparisonSet,
  toggleManualComparisonScenario,
  type ManualComparisonState
} from "./manualComparisonState";
import "./ManualComparison.css";

type ManualComparisonPanelProps = {
  scenarios: readonly ManualScenarioContract[];
  snapshots: readonly ManualScenarioSnapshotContract[];
  notes: readonly ManualScenarioReviewNote[];
  state: ManualComparisonState;
  onStateChange: (state: ManualComparisonState) => void;
  onSave: () => void;
};

export function ManualComparisonPanel({
  scenarios,
  snapshots,
  notes,
  state,
  onStateChange,
  onSave
}: ManualComparisonPanelProps) {
  const selectedSet = state.comparisonSets.find((set) => set.comparisonSetId === state.selectedComparisonSetId) ?? null;
  const comparedScenarios = selectedSet == null
    ? []
    : scenarios.filter((scenario) => selectedSet.scenarioIds.includes(scenario.scenarioId));
  const summaries = comparedScenarios.map((scenario) => buildManualScenarioReviewSummary({ scenario, snapshots }));
  const notesByScenarioId = Object.fromEntries(
    comparedScenarios.map((scenario) => [
      scenario.scenarioId,
      notes.filter((note) => note.scenarioId === scenario.scenarioId)
    ])
  );
  const rows = buildManualComparisonReferenceMatrix({
    scenarios: comparedScenarios,
    summaries,
    notesByScenarioId
  });
  const renameDraft = selectedSet?.label ?? "";

  return (
    <section className="manual-comparison-panel" data-manual-comparison-panel="true">
      <header className="manual-comparison-panel__header">
        <div>
          <h3>Manual Comparison</h3>
          <p>Side-by-side identity and reference comparison only.</p>
        </div>
        <div className="manual-comparison-panel__actions">
          <button
            type="button"
            data-manual-comparison-create="true"
            onClick={() => onStateChange(createManualComparisonSet({
              state,
              scenarioIds: scenarios.slice(0, 2).map((scenario) => scenario.scenarioId)
            }))}
          >
            Create comparison set
          </button>
          <button type="button" onClick={onSave}>Save</button>
        </div>
      </header>
      {state.comparisonSets.length === 0 ? null : (
        <div className="manual-comparison-panel__set-controls">
          <label>
            <span>Comparison set</span>
            <select
              value={state.selectedComparisonSetId ?? ""}
              data-manual-comparison-select="true"
              onChange={(event) => onStateChange(selectManualComparisonSet({
                state,
                comparisonSetId: event.target.value.length === 0 ? null : event.target.value
              }))}
            >
              {state.comparisonSets.map((set) => (
                <option key={set.comparisonSetId} value={set.comparisonSetId}>{set.label}</option>
              ))}
            </select>
          </label>
          {selectedSet == null ? null : (
            <label>
              <span>Set label</span>
              <input
                value={renameDraft}
                data-manual-comparison-rename="true"
                onChange={(event) => {
                  if (event.target.value.trim().length === 0) return;
                  onStateChange(renameManualComparisonSet({
                    state,
                    comparisonSetId: selectedSet.comparisonSetId,
                    label: event.target.value
                  }));
                }}
              />
            </label>
          )}
        </div>
      )}
      {selectedSet == null ? (
        <p className="manual-comparison-panel__empty">Create a comparison set after manual scenarios exist.</p>
      ) : (
        <>
          <div className="manual-comparison-panel__scenario-picker">
            {scenarios.map((scenario) => (
              <label key={scenario.scenarioId}>
                <input
                  type="checkbox"
                  checked={selectedSet.scenarioIds.includes(scenario.scenarioId)}
                  data-manual-comparison-scenario-toggle="true"
                  onChange={() => onStateChange(toggleManualComparisonScenario({
                    state,
                    comparisonSetId: selectedSet.comparisonSetId,
                    scenarioId: scenario.scenarioId
                  }))}
                />
                <span>{scenario.label}</span>
              </label>
            ))}
          </div>
          <ManualComparisonMatrix rows={rows} />
        </>
      )}
    </section>
  );
}
