import {
  buildManualComparisonReferenceMatrix,
  buildManualScenarioReviewSummary,
  type ManualScenarioContract,
  type ManualScenarioSnapshotContract
} from "@nerdeus/shared";
import type { ManualScenarioReviewNote } from "../manual-scenario-review/manualScenarioReviewNotesContract";
import { ManualComparisonControls } from "./ManualComparisonControls";
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
  const canCreateComparisonSet = scenarios.length >= 2;

  return (
    <section
      className="manual-comparison-panel"
      data-manual-comparison-panel="true"
      data-comparison-scope="manual_identity_reference_only"
      data-comparison-scoring-blocked="true"
      data-comparison-simulation-blocked="true"
      data-comparison-recommendations-blocked="true"
      data-comparison-clinical-claims-blocked="true"
    >
      <header className="manual-comparison-panel__header">
        <div>
          <h3>Manual Comparison</h3>
          <p>Side-by-side identity and reference comparison only.</p>
        </div>
        <ManualComparisonControls
          comparisonSets={state.comparisonSets}
          selectedComparisonSet={selectedSet}
          selectedComparisonSetId={state.selectedComparisonSetId}
          canCreateComparisonSet={canCreateComparisonSet}
          onCreateComparisonSet={() => onStateChange(createManualComparisonSet({
              state,
              scenarioIds: scenarios.slice(0, 2).map((scenario) => scenario.scenarioId)
          }))}
          onSelectComparisonSet={(comparisonSetId) => onStateChange(selectManualComparisonSet({
            state,
            comparisonSetId
          }))}
          onRenameComparisonSet={(label) => {
            if (selectedSet == null) return;
            onStateChange(renameManualComparisonSet({
              state,
              comparisonSetId: selectedSet.comparisonSetId,
              label
            }));
          }}
          onSave={onSave}
        />
      </header>
      {selectedSet == null ? (
        <p className="manual-comparison-panel__empty">
          {canCreateComparisonSet
            ? "Create a comparison set after manual scenarios exist."
            : "Manual comparison needs at least two manual scenarios for a set."}
        </p>
      ) : (
        <>
          <p className="manual-comparison-panel__selected" data-manual-comparison-selected-label="true">
            {selectedSet.label}
          </p>
          <div className="manual-comparison-panel__scenario-picker">
            {scenarios.map((scenario) => (
              <label key={scenario.scenarioId}>
                <input
                  type="checkbox"
                  checked={selectedSet.scenarioIds.includes(scenario.scenarioId)}
                  data-manual-comparison-scenario-toggle="true"
                  data-manual-comparison-scenario-id={scenario.scenarioId}
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
