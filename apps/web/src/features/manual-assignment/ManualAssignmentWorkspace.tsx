import { useEffect, useMemo, useReducer, useState } from "react";
import "./ManualAssignmentProof.css";
import {
  isRoomLoadEligibleRoomType,
  listSplitRoomParentIds,
  type ActiveFloorplanContract,
  type AssignmentSetContract,
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads,
  type EditableLayoutGeometryContract,
  type ManualAssignmentNurse,
  type ManualAssignmentRoomLoad,
  type ManualRoomAssignment,
  type NurseProfileContract,
  type RoomLoadContract,
  type SemanticRoomType
} from "@nerdeus/shared";
import {
  assignRoomToNurse,
  clearManualAssignments,
  reassignRoomToNurse,
  setManualAssignmentRoomLoad,
  setActiveManualAssignmentNurse,
  unassignRoom
} from "./manualAssignmentActions";
import { manualAssignmentReducer } from "./manualAssignmentReducer";
import {
  createManualAssignmentId,
  createManualAssignmentInitialState,
  type ManualAssignmentState
} from "./manualAssignmentState";
import { AssignmentFloorplanOverview } from "./AssignmentFloorplanOverview";
import { AssignmentIssuesPanel } from "./AssignmentIssuesPanel";
import { BurdenExplanationPanel } from "./BurdenExplanationPanel";
import { FourPatientComparisonPanel } from "./FourPatientComparisonPanel";
import { ManualAssignmentLayout } from "./ManualAssignmentLayout";
import { NurseProfileBuilder } from "./NurseProfileBuilder";
import { NurseAssignmentCardStack } from "./NurseAssignmentCardStack";
import { RoomAssignmentTable } from "./RoomAssignmentTable";
import type { RoomAssignmentFilter } from "./RoomAssignmentFilters";
import { RoomLoadEditor } from "./RoomLoadEditor";
import { ClearAssignmentsConfirmationDialog } from "./ClearAssignmentsConfirmationDialog";
import { ManualAssignmentBlockedState } from "./ManualAssignmentBlockedState";
import { createManualBurdenViewModel } from "./manualBurdenViewModel";
import {
  createManualAssignmentWorkspaceViewModel,
  type ManualAssignmentRoomCard
} from "./manualAssignmentWorkspaceViewModel";

export type ManualAssignmentMap = Record<string, string>;

export type ManualAssignmentWorkspaceProps = {
  activeFloorplan?: ActiveFloorplanContract | null;
  activeEditableLayout?: EditableLayoutGeometryContract | null;
  assignmentSet?: AssignmentSetContract | null;
  assignmentsByRoomId?: Readonly<ManualAssignmentMap>;
  allowSyntheticFixture?: boolean;
  onAssignmentsChange?: (assignmentsByRoomId: ManualAssignmentMap) => void;
  onAssignmentSetChange?: (assignmentSet: AssignmentSetContract) => void;
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
  assignmentSet = null,
  assignmentsByRoomId = {},
  allowSyntheticFixture = false,
  onAssignmentsChange,
  onAssignmentSetChange
}: ManualAssignmentWorkspaceProps = {}) {
  const source = useMemo(
    () => buildManualAssignmentSource(activeFloorplan, activeEditableLayout, assignmentSet, assignmentsByRoomId, allowSyntheticFixture),
    [activeFloorplan, activeEditableLayout, assignmentSet, assignmentsByRoomId, allowSyntheticFixture]
  );

  if (source.sourceKind === "assignment-set-required") {
    return (
      <ManualAssignmentBlockedState
        reason="assignment_set_required"
        activeLayoutId={source.activeLayoutId}
        activeFloorplanVersionId={source.activeFloorplanVersionId}
      />
    );
  }

  if (source.sourceKind === "active-floorplan-required") {
    return (
      <ManualAssignmentBlockedState
        reason="active_floorplan_required"
        activeLayoutId={source.activeLayoutId}
        activeFloorplanVersionId={source.activeFloorplanVersionId}
      />
    );
  }

  return (
    <ManualAssignmentWorkspaceContent
      key={source.stateKey}
      source={source}
      onAssignmentsChange={onAssignmentsChange}
      onAssignmentSetChange={onAssignmentSetChange}
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
  assignmentSet: AssignmentSetContract | null;
  sourceKind: "assignment-set" | "assignment-set-required" | "active-floorplan-required" | "active-layout" | "synthetic-fixture";
};

type ManualAssignmentWorkspaceContentProps = {
  source: ManualAssignmentSource;
  onAssignmentsChange?: (assignmentsByRoomId: ManualAssignmentMap) => void;
  onAssignmentSetChange?: (assignmentSet: AssignmentSetContract) => void;
};

function ManualAssignmentWorkspaceContent({
  source,
  onAssignmentsChange,
  onAssignmentSetChange
}: ManualAssignmentWorkspaceContentProps) {
  const [state, dispatch] = useReducer(manualAssignmentReducer, source.initialState);
  const viewModel = createManualAssignmentWorkspaceViewModel(state, {
    displayLabelsByNurseId: source.displayLabelsByNurseId
  });
  const burdenViewModel = createManualBurdenViewModel(state, {
    displayLabelsByNurseId: source.displayLabelsByNurseId
  });
  const [activeRoomFilter, setActiveRoomFilter] = useState<RoomAssignmentFilter>("all");
  const [clearConfirmationVisible, setClearConfirmationVisible] = useState(false);
  const roomFilterCounts = createRoomFilterCounts(
    viewModel.roomCards,
    state.roomLoadsByRoomId,
    source.parentSplitBayIds
  );
  const filteredRoomCards = filterRoomCards(
    viewModel.roomCards,
    activeRoomFilter,
    state.roomLoadsByRoomId,
    source.parentSplitBayIds
  );

  useEffect(() => {
    const assignments = manualAssignmentMapFromState(state);
    onAssignmentsChange?.(assignments);
    if (source.assignmentSet != null) {
      onAssignmentSetChange?.({
        ...source.assignmentSet,
        assignmentsByRoomId: assignments,
        updatedAt: new Date().toISOString()
      });
    }
  }, [
    state.assignmentsByRoomId,
    onAssignmentSetChange,
    onAssignmentsChange,
    source.assignmentSet?.assignmentSetId,
    source.assignmentSet?.floorplanVersionId
  ]);

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

  function confirmClearAssignments() {
    dispatch(clearManualAssignments());
    setClearConfirmationVisible(false);
  }

  const clearAssignmentsControl = clearConfirmationVisible ? (
    <ClearAssignmentsConfirmationDialog
      onCancel={() => setClearConfirmationVisible(false)}
      onConfirm={confirmClearAssignments}
    />
  ) : (
    <button
      type="button"
      data-clear-assignments-requires-confirmation="true"
      onClick={() => setClearConfirmationVisible(true)}
    >
      Clear Assignments
    </button>
  );

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
          <p className="eyebrow">{source.sourceKind === "assignment-set" ? "Durable assignment set" : "Operational assignment state"}</p>
          <h2 id="manual-assignment-workspace-title">Manual Assignment</h2>
        </div>
        <div className="manual-assignment-workspace__metrics" aria-label="Manual assignment status">
          <span>{viewModel.assignedRoomCount} assigned</span>
          <span>{viewModel.unassignedOccupiedRoomCount} unassigned occupied</span>
        </div>
      </div>

      <ManualAssignmentLayout
        floorplanOverview={(
          <AssignmentFloorplanOverview
            activeLayoutId={source.activeLayoutId}
            activeFloorplanVersionId={source.activeFloorplanVersionId}
            assignmentSet={source.assignmentSet}
            assignedRoomCount={viewModel.assignedRoomCount}
            unassignedOccupiedRoomCount={viewModel.unassignedOccupiedRoomCount}
            roomCount={viewModel.roomCards.length}
            splitParentIds={source.parentSplitBayIds}
            colorLegend={viewModel.colorLegend}
            nurseOptions={viewModel.nurseOptions}
            onSelectNurse={(nurseId) => dispatch(setActiveManualAssignmentNurse(nurseId))}
            clearAssignmentsControl={clearAssignmentsControl}
          />
        )}
        roomAssignmentTable={(
          <RoomAssignmentTable
            rooms={filteredRoomCards}
            totalRoomCount={viewModel.roomCards.length}
            activeFilter={activeRoomFilter}
            filterCounts={roomFilterCounts}
            onFilterChange={setActiveRoomFilter}
            onRoomClick={assignSelectedNurse}
            onUnassignRoom={(roomId) => dispatch(unassignRoom(roomId))}
          />
        )}
        nurseAssignmentCards={(
          <NurseAssignmentCardStack
            cards={viewModel.nurseCards}
            burdenRows={burdenViewModel.burdenRows}
            warnings={burdenViewModel.warnings}
          />
        )}
        assignmentIssues={<AssignmentIssuesPanel warnings={burdenViewModel.warnings} />}
        burdenExplanation={<BurdenExplanationPanel rows={burdenViewModel.burdenRows} />}
      >
        {source.assignmentSet == null || onAssignmentSetChange == null ? null : (
          <NurseProfileBuilder
            assignmentSet={source.assignmentSet}
            onAssignmentSetChange={onAssignmentSetChange}
          />
        )}

        {source.assignmentSet == null || onAssignmentSetChange == null ? null : (
          <RoomLoadEditor
            assignmentSet={source.assignmentSet}
            onAssignmentSetChange={onAssignmentSetChange}
            onRoomLoadChange={(roomLoad) => dispatch(setManualAssignmentRoomLoad(roomLoadContractToManualRoomLoad(roomLoad)))}
          />
        )}

        <FourPatientComparisonPanel />
      </ManualAssignmentLayout>
    </section>
  );
}

function createRoomFilterCounts(
  rooms: ManualAssignmentRoomCard[],
  roomLoadsByRoomId: ManualAssignmentState["roomLoadsByRoomId"],
  splitParentIds: string[]
): Record<RoomAssignmentFilter, number> {
  return {
    all: rooms.length,
    unassigned: filterRoomCards(rooms, "unassigned", roomLoadsByRoomId, splitParentIds).length,
    "high-burden": filterRoomCards(rooms, "high-burden", roomLoadsByRoomId, splitParentIds).length,
    trauma: filterRoomCards(rooms, "trauma", roomLoadsByRoomId, splitParentIds).length,
    "split-rooms": filterRoomCards(rooms, "split-rooms", roomLoadsByRoomId, splitParentIds).length
  };
}

function filterRoomCards(
  rooms: ManualAssignmentRoomCard[],
  activeFilter: RoomAssignmentFilter,
  roomLoadsByRoomId: ManualAssignmentState["roomLoadsByRoomId"],
  splitParentIds: string[]
): ManualAssignmentRoomCard[] {
  if (activeFilter === "all") return rooms;
  return rooms.filter((room) => {
    const roomLoad = roomLoadsByRoomId[room.roomId];
    if (activeFilter === "unassigned") return room.unassignedOccupied;
    if (activeFilter === "high-burden") {
      return room.acuity >= 4 || Boolean(roomLoad?.sitterRequired) || roomLoad?.procedureBurden === "high";
    }
    if (activeFilter === "trauma") return Boolean(roomLoad?.traumaActive);
    if (activeFilter === "split-rooms") {
      return splitParentIds.some((parentId) => room.roomId.startsWith(`${parentId}-`) || room.roomId.includes(parentId));
    }
    return true;
  });
}

function buildManualAssignmentSource(
  activeFloorplan: ActiveFloorplanContract | null,
  activeEditableLayout: EditableLayoutGeometryContract | null,
  assignmentSet: AssignmentSetContract | null,
  assignmentsByRoomId: Readonly<ManualAssignmentMap>,
  allowSyntheticFixture: boolean
): ManualAssignmentSource {
  const activeLayout = activeFloorplan?.editableLayout ?? activeEditableLayout;
  if (activeFloorplan != null && assignmentSet == null) {
    const splitBayIds = listSplitRoomParentIds(activeFloorplan.editableLayout);
    return {
      stateKey: [
        "assignment-set-required",
        activeFloorplan.activeFloorplanVersionId,
        splitBayIds.join("|")
      ].join(":"),
      initialState: createManualAssignmentInitialState([], []),
      displayLabelsByNurseId: {},
      parentSplitBayIds: splitBayIds,
      activeLayoutId: activeFloorplan.editableLayout.layoutId,
      activeFloorplanVersionId: activeFloorplan.activeFloorplanVersionId,
      assignmentSet: null,
      sourceKind: "assignment-set-required"
    };
  }
  if (activeLayout != null && assignmentSet != null) {
    const roomTypesByRoomId = Object.fromEntries(
      activeLayout.rooms.map((room) => [room.id, room.roomType])
    ) as Record<string, SemanticRoomType>;
    const nurses = assignmentSet.nurseProfiles.map(nurseProfileToManualAssignmentNurse);
    const roomLoads = Object.values(assignmentSet.roomLoadsByRoomId).map(roomLoadContractToManualRoomLoad);
    const splitBayIds = listSplitRoomParentIds(activeLayout);
    return {
      stateKey: [
        "assignment-set",
        assignmentSet.assignmentSetId,
        assignmentSet.floorplanVersionId,
        assignmentSet.nurseProfiles.map(nurseProfileStateKey).join("|"),
        splitBayIds.join("|"),
        roomLoads.map((roomLoad) => roomLoad.roomId).join("|")
      ].join(":"),
      initialState: hydrateManualAssignments(
        createManualAssignmentInitialState(nurses, roomLoads, roomTypesByRoomId),
        assignmentSet.assignmentsByRoomId
      ),
      displayLabelsByNurseId: Object.fromEntries(
        assignmentSet.nurseProfiles.map((nurse) => [nurse.nurseProfileId, nurse.displayLabel])
      ),
      parentSplitBayIds: splitBayIds,
      activeLayoutId: activeLayout.layoutId,
      activeFloorplanVersionId: activeFloorplan?.activeFloorplanVersionId ?? assignmentSet.floorplanVersionId,
      assignmentSet,
      sourceKind: "assignment-set"
    };
  }

  if (activeLayout == null && !allowSyntheticFixture) {
    return {
      stateKey: "active-floorplan-required",
      initialState: createManualAssignmentInitialState([], []),
      displayLabelsByNurseId: {},
      parentSplitBayIds: [],
      activeLayoutId: null,
      activeFloorplanVersionId: null,
      assignmentSet: null,
      sourceKind: "active-floorplan-required"
    };
  }

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
      assignmentSet: null,
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
    assignmentSet: null,
    sourceKind: "active-layout"
  };
}

function nurseProfileStateKey(profile: NurseProfileContract): string {
  return [
    profile.nurseProfileId,
    profile.displayLabel,
    profile.color,
    profile.role,
    profile.targetPatientCount,
    profile.maxPatientCount,
    profile.traumaQualified,
    profile.psychQualified,
    profile.chargeQualified,
    profile.active
  ].join(":");
}

function nurseProfileToManualAssignmentNurse(profile: NurseProfileContract): ManualAssignmentNurse {
  return {
    nurseId: profile.nurseProfileId,
    displayLabel: profile.displayLabel,
    color: profile.color,
    role: profile.role,
    targetPatientCount: profile.targetPatientCount,
    maxPatientCount: profile.maxPatientCount,
    traumaQualified: profile.traumaQualified,
    psychQualified: profile.psychQualified,
    chargeQualified: profile.chargeQualified,
    active: profile.active,
    syntheticDataOnly: true
  };
}

function roomLoadContractToManualRoomLoad(roomLoad: RoomLoadContract): ManualAssignmentRoomLoad {
  return {
    roomId: roomLoad.roomId,
    occupied: roomLoad.occupied,
    acuity: roomLoad.acuity,
    traumaActive: roomLoad.traumaActive,
    isolationActive: roomLoad.isolationActive,
    behavioralRisk: roomLoad.behavioralRisk,
    fallRisk: roomLoad.fallRisk,
    sitterRequired: roomLoad.sitterRequired,
    medicationFrequency: roomLoad.medicationFrequency === "continuous" ? "high" : roomLoad.medicationFrequency,
    monitoringFrequency: roomLoad.monitoringFrequency === "continuous" ? "high" : roomLoad.monitoringFrequency,
    procedureBurden: roomLoad.procedureBurden === "very_high" ? "high" : roomLoad.procedureBurden,
    expectedTurnover: roomLoad.expectedTurnover === "normal"
      ? "medium"
      : roomLoad.expectedTurnover === "surge"
        ? "high"
        : roomLoad.expectedTurnover,
    syntheticDataOnly: true
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
