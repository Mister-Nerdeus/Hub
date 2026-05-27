import { useMemo, useReducer } from "react";
import "./ManualAssignmentProof.css";
import { syntheticManualAssignmentNurseProfiles, syntheticManualAssignmentRoomLoads } from "@nerdeus/shared";
import {
  assignRoomToNurse,
  clearManualAssignments,
  reassignRoomToNurse,
  setActiveManualAssignmentNurse,
  unassignRoom
} from "./manualAssignmentActions";
import { manualAssignmentReducer } from "./manualAssignmentReducer";
import { createManualAssignmentInitialState } from "./manualAssignmentState";
import { AssignmentColorLegend } from "./AssignmentColorLegend";
import { AssignmentWarningsPanel } from "./AssignmentWarningsPanel";
import { FourPatientComparisonPanel } from "./FourPatientComparisonPanel";
import { ManualAssignmentRoomList } from "./ManualAssignmentRoomList";
import { NurseAssignmentCards } from "./NurseAssignmentCards";
import { NurseBurdenTable } from "./NurseBurdenTable";
import { createManualBurdenViewModel } from "./manualBurdenViewModel";
import { createManualAssignmentWorkspaceViewModel } from "./manualAssignmentWorkspaceViewModel";

export function ManualAssignmentWorkspace() {
  const initialState = useMemo(
    () => createManualAssignmentInitialState(syntheticManualAssignmentNurseProfiles, syntheticManualAssignmentRoomLoads),
    []
  );
  const [state, dispatch] = useReducer(manualAssignmentReducer, initialState);
  const viewModel = createManualAssignmentWorkspaceViewModel(state);
  const burdenViewModel = createManualBurdenViewModel(state);

  function assignSelectedNurse(roomId: string) {
    if (viewModel.activeNurseId == null) return;
    const existingAssignment = state.assignmentsByRoomId[roomId];
    dispatch(
      existingAssignment == null
        ? assignRoomToNurse(roomId, viewModel.activeNurseId)
        : reassignRoomToNurse(roomId, viewModel.activeNurseId)
    );
  }

  return (
    <section className="manual-assignment-workspace" aria-labelledby="manual-assignment-workspace-title">
      <div className="manual-assignment-workspace__header">
        <div>
          <p className="eyebrow">Synthetic operational assignment state</p>
          <h2 id="manual-assignment-workspace-title">Manual Assignment</h2>
        </div>
        <div className="manual-assignment-workspace__metrics" aria-label="Manual assignment status">
          <span>{viewModel.assignedRoomCount} assigned</span>
          <span>{viewModel.unassignedOccupiedRoomCount} unassigned occupied</span>
        </div>
      </div>

      <AssignmentColorLegend items={viewModel.colorLegend} />

      <section className="manual-assignment-workspace__panel" aria-labelledby="nurse-selection-title">
        <div className="manual-assignment-workspace__panel-header">
          <h3 id="nurse-selection-title">Nurse Selection</h3>
          <button type="button" onClick={() => dispatch(clearManualAssignments())}>
            Clear All
          </button>
        </div>
        <div className="manual-nurse-selector" role="group" aria-label="Active nurse">
          {viewModel.nurseOptions.map((nurse) => (
            <button
              className={nurse.selected ? "manual-nurse-selector__button manual-nurse-selector__button--selected" : "manual-nurse-selector__button"}
              disabled={!nurse.active}
              key={nurse.nurseId}
              type="button"
              onClick={() => dispatch(setActiveManualAssignmentNurse(nurse.nurseId))}
              style={{ borderColor: nurse.color }}
            >
              <span style={{ background: nurse.color }} />
              {nurse.displayLabel}
            </button>
          ))}
        </div>
        <p className="manual-assignment-workspace__note">Drag assignment is deferred; click assignment is the foundation behavior.</p>
      </section>

      <div className="manual-assignment-workspace__grid">
        <section className="manual-assignment-workspace__panel" aria-labelledby="manual-rooms-title">
          <h3 id="manual-rooms-title">Rooms</h3>
          <ManualAssignmentRoomList
            rooms={viewModel.roomCards}
            onRoomClick={assignSelectedNurse}
            onUnassignRoom={(roomId) => dispatch(unassignRoom(roomId))}
          />
        </section>

        <section className="manual-assignment-workspace__panel" aria-labelledby="manual-nurse-cards-title">
          <h3 id="manual-nurse-cards-title">Nurse Cards</h3>
          <NurseAssignmentCards cards={viewModel.nurseCards} />
        </section>
      </div>

      <section className="manual-assignment-workspace__panel" aria-labelledby="manual-burden-title">
        <h3 id="manual-burden-title">Burden Components</h3>
        <NurseBurdenTable rows={burdenViewModel.burdenRows} />
      </section>

      <section className="manual-assignment-workspace__panel" aria-labelledby="manual-warnings-title">
        <h3 id="manual-warnings-title">Warnings</h3>
        <AssignmentWarningsPanel warnings={burdenViewModel.warnings} />
      </section>

      <FourPatientComparisonPanel />
    </section>
  );
}
