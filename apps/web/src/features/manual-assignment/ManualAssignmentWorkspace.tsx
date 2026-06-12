import { useEffect, useMemo, useReducer } from "react";
import "./ManualAssignmentProof.css";
import {
  isRoomLoadEligibleRoomType,
  listSplitRoomParentIds,
  type ActiveFloorplanContract,
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads,
  type EditableLayoutGeometryContract,
  type ManualAssignmentNurse,
  type ManualAssignmentRoomLoad,
  type ManualRoomAssignment,
  type SemanticRoomType
} from "@nerdeus/shared";
import {
  assignRoomToNurse,
  clearManualAssignments,
  reassignRoomToNurse,
  setActiveManualAssignmentNurse,
  unassignRoom
} from "./manualAssignmentActions";
import { manualAssignmentReducer } from "./manualAssignmentReducer";
import {
  createManualAssignmentId,
  createManualAssignmentInitialState,
  type ManualAssignmentState
} from "./manualAssignmentState";
import { AssignmentColorLegend } from "./AssignmentColorLegend";
import { AssignmentWarningsPanel } from "./AssignmentWarningsPanel";
import { FourPatientComparisonPanel } from "./FourPatientComparisonPanel";
import { ManualAssignmentRoomList } from "./ManualAssignmentRoomList";
import { NurseAssignmentCards } from "./NurseAssignmentCards";
import { NurseBurdenTable } from "./NurseBurdenTable";
import { createManualBurdenViewModel } from "./manualBurdenViewModel";
import { createManualAssignmentWorkspaceViewModel } from "./manualAssignmentWorkspaceViewModel";

export type ManualAssignmentMap = Record<string, string>;

export type ManualAssignmentWorkspaceProps = {
  activeFloorplan?: ActiveFloorplanContract | null;
  activeEditableLayout?: EditableLayoutGeometryContract | null;
  assignmentsByRoomId?: Readonly<ManualAssignmentMap>;
  onAssignmentsChange?: (assignmentsByRoomId: ManualAssignmentMap) => void;
};

export const splitRoomManualAssignmentNurseDisplayLabelsById: Record<string, string> = {
  "nurse-a": "Nurse A",
  "nurse-b": "Nurse B"
};

const splitRoomManualAssignmentNurses: ManualAssignmentNurse[] = [
  {
    nurseId: "nurse-a",
    displayLabel: "Nurse Blue",
    color: "#2563eb",
    role: "primary",
    targetPatientCount: 4,
    maxPatientCount: 5,
    traumaQualified: true,
    psychQualified: true,
    chargeQualified: false,
    active: true,
    syntheticDataOnly: true
  },
  {
    nurseId: "nurse-b",
    displayLabel: "Nurse Green",
    color: "#16a34a",
    role: "primary",
    targetPatientCount: 4,
    maxPatientCount: 5,
    traumaQualified: true,
    psychQualified: true,
    chargeQualified: false,
    active: true,
    syntheticDataOnly: true
  }
];

export const splitRoomManualAssignmentOverlayNurses = splitRoomManualAssignmentNurses.map((nurse) => ({
  nurseId: nurse.nurseId,
  displayLabel: splitRoomManualAssignmentNurseDisplayLabelsById[nurse.nurseId] ?? nurse.displayLabel,
  color: nurse.color
}));

export function ManualAssignmentWorkspace({
  activeFloorplan = null,
  activeEditableLayout = null,
  assignmentsByRoomId = {},
  onAssignmentsChange
}: ManualAssignmentWorkspaceProps = {}) {
  const source = useMemo(
    () => buildManualAssignmentSource(activeFloorplan, activeEditableLayout, assignmentsByRoomId),
    [activeFloorplan, activeEditableLayout, assignmentsByRoomId]
  );

  return (
    <ManualAssignmentWorkspaceContent
      key={source.stateKey}
      source={source}
      onAssignmentsChange={onAssignmentsChange}
    />
  );
}

type ManualAssignmentSource = {
  stateKey: string;
  initialState: ManualAssignmentState;
  displayLabelsByNurseId: Record<string, string>;
  parentSplitBayIds: string[];
  activeLayoutId: string | null;
  activeFloorplanVersionId: string | null;
  sourceKind: "active-layout" | "synthetic-fixture";
};

type ManualAssignmentWorkspaceContentProps = {
  source: ManualAssignmentSource;
  onAssignmentsChange?: (assignmentsByRoomId: ManualAssignmentMap) => void;
};

function ManualAssignmentWorkspaceContent({
  source,
  onAssignmentsChange
}: ManualAssignmentWorkspaceContentProps) {
  const [state, dispatch] = useReducer(manualAssignmentReducer, source.initialState);
  const viewModel = createManualAssignmentWorkspaceViewModel(state, {
    displayLabelsByNurseId: source.displayLabelsByNurseId
  });
  const burdenViewModel = createManualBurdenViewModel(state, {
    displayLabelsByNurseId: source.displayLabelsByNurseId
  });

  useEffect(() => {
    onAssignmentsChange?.(manualAssignmentMapFromState(state));
  }, [state.assignmentsByRoomId, onAssignmentsChange]);

  function assignSelectedNurse(roomId: string) {
    if (viewModel.activeNurseId == null) return;
    const roomCard = viewModel.roomCards.find((room) => room.roomId === roomId);
    if (roomCard?.assignmentDisabled) return;
    const existingAssignment = state.assignmentsByRoomId[roomId];
    dispatch(
      existingAssignment == null
        ? assignRoomToNurse(roomId, viewModel.activeNurseId)
        : reassignRoomToNurse(roomId, viewModel.activeNurseId)
    );
  }

  return (
    <section
      className="manual-assignment-workspace"
      aria-labelledby="manual-assignment-workspace-title"
      data-manual-assignment-source={source.sourceKind}
      data-active-layout-id={source.activeLayoutId ?? ""}
      data-active-floorplan-version-id={source.activeFloorplanVersionId ?? ""}
      data-split-parent-ids={source.parentSplitBayIds.join(",")}
      data-parent-split-bays-assignable="false"
      data-assigned-count={viewModel.assignedRoomCount}
    >
      <div className="manual-assignment-workspace__header">
        <div>
          <p className="eyebrow">Synthetic operational assignment state</p>
          <h2 id="manual-assignment-workspace-title">Manual Assignment</h2>
        </div>
        <p className="manual-assignment-workspace__assignment-mode">
          Drag assignment is deferred; click assignment is the foundation behavior.
        </p>
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
              data-manual-nurse-id={nurse.nurseId}
              onClick={() => dispatch(setActiveManualAssignmentNurse(nurse.nurseId))}
              style={{ borderColor: nurse.color }}
            >
              <span style={{ background: nurse.color }} />
              {nurse.displayLabel}
            </button>
          ))}
        </div>
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

function buildManualAssignmentSource(
  activeFloorplan: ActiveFloorplanContract | null,
  activeEditableLayout: EditableLayoutGeometryContract | null,
  assignmentsByRoomId: Readonly<ManualAssignmentMap>
): ManualAssignmentSource {
  const activeLayout = activeFloorplan?.editableLayout ?? activeEditableLayout;
  if (activeLayout == null) {
    return {
      stateKey: "synthetic-fixture",
      initialState: hydrateManualAssignments(
        createManualAssignmentInitialState(
          syntheticManualAssignmentNurseProfiles,
          syntheticManualAssignmentRoomLoads
        ),
        assignmentsByRoomId
      ),
      displayLabelsByNurseId: {},
      parentSplitBayIds: [],
      activeLayoutId: null,
      activeFloorplanVersionId: null,
      sourceKind: "synthetic-fixture"
    };
  }

  const roomTypesByRoomId = Object.fromEntries(
    activeLayout.rooms.map((room) => [room.id, room.roomType])
  ) as Record<string, SemanticRoomType>;
  const roomLoads = activeLayout.rooms
    .filter((room) => isRoomLoadEligibleRoomType(room.roomType))
    .map((room) => buildLayoutRoomLoad(room.id, room.roomNumber, room.roomType));
  const initialState = createManualAssignmentInitialState(
    splitRoomManualAssignmentNurses,
    roomLoads,
    roomTypesByRoomId
  );
  const splitBayIds = listSplitRoomParentIds(activeLayout);

  return {
    stateKey: [
      "active-layout",
      activeFloorplan?.activeFloorplanVersionId ?? activeLayout.layoutId,
      splitBayIds.join("|"),
      roomLoads.map((roomLoad) => roomLoad.roomId).join("|")
    ].join(":"),
    initialState: hydrateManualAssignments(initialState, assignmentsByRoomId),
    displayLabelsByNurseId: splitRoomManualAssignmentNurseDisplayLabelsById,
    parentSplitBayIds: splitBayIds,
    activeLayoutId: activeLayout.layoutId,
    activeFloorplanVersionId: activeFloorplan?.activeFloorplanVersionId ?? null,
    sourceKind: "active-layout"
  };
}

function buildLayoutRoomLoad(
  roomId: string,
  roomNumber: string,
  roomType: SemanticRoomType
): ManualAssignmentRoomLoad {
  const roomIndex = numericRoomIndex(roomNumber, roomId);
  const acuity = (((roomIndex - 1) % 5) + 1) as ManualAssignmentRoomLoad["acuity"];
  const elevated = acuity >= 4;
  return {
    roomId,
    occupied: true,
    acuity,
    traumaActive: roomType === "trauma",
    isolationActive: roomType === "isolation",
    behavioralRisk: roomType === "behavioral" || roomType === "psych",
    fallRisk: elevated,
    sitterRequired: roomType === "behavioral" || roomType === "psych",
    medicationFrequency: elevated ? "high" : acuity >= 3 ? "medium" : "low",
    monitoringFrequency: elevated ? "high" : acuity >= 3 ? "medium" : "low",
    procedureBurden: roomType === "procedure" ? "high" : "low",
    expectedTurnover: elevated ? "medium" : "low",
    syntheticDataOnly: true
  };
}

function numericRoomIndex(roomNumber: string, roomId: string): number {
  const text = roomNumber.match(/\d+/u)?.[0] ?? roomId.match(/\d+/u)?.[0] ?? "1";
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function hydrateManualAssignments(
  state: ManualAssignmentState,
  assignmentsByRoomId: Readonly<ManualAssignmentMap>
): ManualAssignmentState {
  const validNurseIds = new Set(state.nurses.map((nurse) => nurse.nurseId));
  const assignments: Record<string, ManualRoomAssignment> = {};
  for (const [roomId, nurseId] of Object.entries(assignmentsByRoomId)) {
    if (state.roomLoadsByRoomId[roomId] == null || !validNurseIds.has(nurseId)) {
      continue;
    }
    assignments[roomId] = {
      assignmentId: createManualAssignmentId(roomId, nurseId),
      roomId,
      nurseId,
      primary: true,
      syntheticDataOnly: true
    };
  }
  return {
    ...state,
    assignmentsByRoomId: assignments
  };
}

function manualAssignmentMapFromState(state: ManualAssignmentState): ManualAssignmentMap {
  return Object.fromEntries(
    Object.values(state.assignmentsByRoomId).map((assignment) => [assignment.roomId, assignment.nurseId])
  );
}
