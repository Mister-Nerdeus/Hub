import { useEffect, useState } from "react";
import type {
  ActiveFloorplanContract,
  ManualAssignmentSetContract
} from "@nerdeus/shared";
import { ManualScenarioControls } from "./ManualScenarioControls";
import { ManualScenarioList } from "./ManualScenarioList";
import {
  createManualScenario,
  duplicateManualScenario,
  renameManualScenario,
  selectManualScenario,
  selectedManualScenario,
  type ManualScenarioState
} from "./manualScenarioState";
import "./ManualScenario.css";

type ManualScenarioPanelProps = {
  activeFloorplan: ActiveFloorplanContract | null;
  assignmentSet: ManualAssignmentSetContract | null;
  scenarioState: ManualScenarioState;
  onScenarioStateChange: (state: ManualScenarioState) => void;
  onSaveScenarios: () => void;
  statusMessage?: string | null;
};

export function ManualScenarioPanel({
  activeFloorplan,
  assignmentSet,
  scenarioState,
  onScenarioStateChange,
  onSaveScenarios,
  statusMessage
}: ManualScenarioPanelProps) {
  const selectedScenario = selectedManualScenario(scenarioState);
  const [renameValue, setRenameValue] = useState(selectedScenario?.label ?? "");
  const floorplanId = activeFloorplan?.editableLayout.layoutId ?? "no-active-floorplan";
  const assignmentSetId = assignmentSet?.assignmentSetId ?? "manual-assignment-set-active";
  const referencesReady = activeFloorplan != null;

  useEffect(() => {
    setRenameValue(selectedScenario?.label ?? "");
  }, [selectedScenario?.scenarioId, selectedScenario?.label]);

  function createScenario() {
    if (!referencesReady) return;
    onScenarioStateChange(createManualScenario({
      state: scenarioState,
      references: {
        floorplanId,
        assignmentSetId,
        staffRosterId: "manual-staff-roster-active"
      }
    }));
  }

  return (
    <section
      className="manual-scenario-panel"
      data-manual-scenario-panel="true"
      data-scenario-scope="manual_only"
      aria-labelledby="manual-scenario-title"
    >
      <header className="manual-scenario-panel__header">
        <div>
          <h3 id="manual-scenario-title">Manual Scenario</h3>
          <p>Reference records for floorplan and manual assignments.</p>
        </div>
        <strong>Validation</strong>
      </header>
      {statusMessage == null ? null : (
        <p className="manual-scenario-panel__status">{statusMessage}</p>
      )}
      <ManualScenarioControls
        renameValue={renameValue}
        canDuplicate={selectedScenario != null}
        canRename={selectedScenario != null && renameValue.trim().length > 0}
        onCreateScenario={createScenario}
        onDuplicateScenario={() =>
          onScenarioStateChange(duplicateManualScenario({
            state: scenarioState,
            scenarioId: scenarioState.selectedScenarioId
          }))
        }
        onSaveScenarios={onSaveScenarios}
        onRenameValueChange={setRenameValue}
        onRenameScenario={() =>
          onScenarioStateChange(renameManualScenario({
            state: scenarioState,
            scenarioId: scenarioState.selectedScenarioId,
            label: renameValue
          }))
        }
      />
      <div className="manual-scenario-panel__grid">
        <section className="manual-scenario-panel__section" aria-labelledby="manual-scenario-list-title">
          <h4 id="manual-scenario-list-title">Manual Scenario</h4>
          <ManualScenarioList
            scenarios={scenarioState.scenarios}
            selectedScenarioId={scenarioState.selectedScenarioId}
            onSelectScenario={(scenarioId) =>
              onScenarioStateChange(selectManualScenario({ state: scenarioState, scenarioId }))
            }
          />
        </section>
        <section className="manual-scenario-panel__section" aria-labelledby="manual-scenario-linked-title">
          <h4 id="manual-scenario-linked-title">Manual assignments</h4>
          <dl className="manual-scenario-links">
            <div>
              <dt>Linked floorplan</dt>
              <dd>{activeFloorplan?.displayName ?? "No active floorplan"}</dd>
            </div>
            <div>
              <dt>Linked assignment set</dt>
              <dd>{assignmentSet == null ? "Manual assignment set draft" : assignmentSet.label}</dd>
            </div>
            <div>
              <dt>Validation</dt>
              <dd>{referencesReady ? "References available" : "Missing floorplan"}</dd>
            </div>
          </dl>
          <details className="manual-scenario-advanced">
            <summary>Advanced</summary>
            <dl>
              <div>
                <dt>Floorplan ID</dt>
                <dd>{floorplanId}</dd>
              </div>
              <div>
                <dt>Assignment set ID</dt>
                <dd>{assignmentSetId}</dd>
              </div>
              <div>
                <dt>Scenario ID</dt>
                <dd>{selectedScenario?.scenarioId ?? "No manual scenario selected"}</dd>
              </div>
            </dl>
          </details>
        </section>
      </div>
    </section>
  );
}
