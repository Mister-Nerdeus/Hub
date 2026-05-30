import {
  isNurseAssignableRoomType,
  type ManualAssignmentNurse,
  type ManualAssignmentRoomLoad
} from "@nerdeus/shared";
import {
  selectAssignedRoomsByNurse,
  selectAssignmentCountByNurse,
  selectManualAssignments,
  selectUnassignedOccupiedRooms
} from "./manualAssignmentSelectors";
import type { ManualAssignmentState } from "./manualAssignmentState";
import { createWalkingBurdenSummaryByNurse } from "./walkingBurdenViewModel";

export type ManualAssignmentWorkspaceViewModel = {
  activeNurseId: string | null;
  nurseOptions: ManualAssignmentNurseOption[];
  roomCards: ManualAssignmentRoomCard[];
  nurseCards: ManualAssignmentNurseCard[];
  colorLegend: ManualAssignmentColorLegendItem[];
  assignedRoomCount: number;
  unassignedOccupiedRoomCount: number;
};

export type ManualAssignmentNurseOption = {
  nurseId: string;
  displayLabel: string;
  color: string;
  active: boolean;
  selected: boolean;
};

export type ManualAssignmentRoomCard = {
  roomId: string;
  label: string;
  occupied: boolean;
  acuity: number;
  assignedNurseId: string | null;
  assignedNurseLabel: string;
  assignedColor: string | null;
  unassignedOccupied: boolean;
  controlLabel: string;
  assignmentDisabled: boolean;
  assignmentDisabledReason: string | null;
};

export type ManualAssignmentNurseCard = {
  nurseId: string;
  displayLabel: string;
  color: string;
  assignedRoomCount: number;
  assignedRoomIds: string[];
  assignedRoomLabels: string[];
  targetPatientCount: number;
  maxPatientCount: number;
  walkingSummary: string;
  roomSpread: number;
  walkingBurdenUnits: number;
};

export type ManualAssignmentColorLegendItem = {
  nurseId: string;
  displayLabel: string;
  color: string;
};

export type ManualAssignmentDisplayOptions = {
  displayLabelsByNurseId?: Readonly<Record<string, string>>;
};

export function createManualAssignmentColorLegend(
  nurses: ManualAssignmentState["nurses"],
  options: ManualAssignmentDisplayOptions = {}
): ManualAssignmentColorLegendItem[] {
  return nurses.map((nurse) => ({
    nurseId: nurse.nurseId,
    displayLabel: displayLabelForNurse(nurse, options),
    color: nurse.color
  }));
}

export function createManualAssignmentWorkspaceViewModel(
  state: ManualAssignmentState,
  options: ManualAssignmentDisplayOptions = {}
): ManualAssignmentWorkspaceViewModel {
  const nursesById = new Map(state.nurses.map((nurse) => [nurse.nurseId, nurse]));
  const assignmentByRoomId = new Map(selectManualAssignments(state).map((assignment) => [assignment.roomId, assignment]));
  const unassignedOccupiedRoomIds = new Set(selectUnassignedOccupiedRooms(state).map((roomLoad) => roomLoad.roomId));
  const assignedRoomsByNurse = selectAssignedRoomsByNurse(state);
  const assignmentCounts = selectAssignmentCountByNurse(state);
  const walkingByNurse = createWalkingBurdenSummaryByNurse(state);
  const sortedRoomLoads = Object.values(state.roomLoadsByRoomId).sort(compareRoomLoadsByRoomId);

  return {
    activeNurseId: state.activeNurseId,
    nurseOptions: state.nurses.map((nurse) => ({
      nurseId: nurse.nurseId,
      displayLabel: displayLabelForNurse(nurse, options),
      color: nurse.color,
      active: nurse.active,
      selected: nurse.nurseId === state.activeNurseId
    })),
    roomCards: sortedRoomLoads.map((roomLoad) => {
      const assignment = assignmentByRoomId.get(roomLoad.roomId);
      const roomType = state.roomTypesByRoomId?.[roomLoad.roomId];
      const assignmentDisabled = roomType != null && !isNurseAssignableRoomType(roomType);
      const assignedNurse = assignment ? nursesById.get(assignment.nurseId) : null;
      const assignedNurseLabel = assignedNurse == null
        ? "Unassigned"
        : displayLabelForNurse(assignedNurse, options);
      return {
        roomId: roomLoad.roomId,
        label: labelRoom(roomLoad.roomId),
        occupied: roomLoad.occupied,
        acuity: roomLoad.acuity,
        assignedNurseId: assignment?.nurseId ?? null,
        assignedNurseLabel,
        assignedColor: assignedNurse?.color ?? null,
        unassignedOccupied: unassignedOccupiedRoomIds.has(roomLoad.roomId),
        controlLabel: `${labelRoom(roomLoad.roomId)} ${roomLoad.occupied ? "occupied" : "open"} ${assignedNurseLabel}`,
        assignmentDisabled,
        assignmentDisabledReason: assignmentDisabled
          ? disabledReasonForRoomType(roomType)
          : null
      };
    }),
    nurseCards: state.nurses.map((nurse) => {
      const assignedRoomIds = assignedRoomsByNurse[nurse.nurseId] ?? [];
      return {
        nurseId: nurse.nurseId,
        displayLabel: displayLabelForNurse(nurse, options),
        color: nurse.color,
        assignedRoomCount: assignmentCounts[nurse.nurseId] ?? 0,
        assignedRoomIds,
        assignedRoomLabels: assignedRoomIds.map(labelRoom),
        targetPatientCount: nurse.targetPatientCount,
        maxPatientCount: nurse.maxPatientCount,
        walkingSummary: walkingByNurse[nurse.nurseId]?.displaySummary ?? "0 walk units / spread 0",
        roomSpread: walkingByNurse[nurse.nurseId]?.roomToRoomSpread ?? 0,
        walkingBurdenUnits: walkingByNurse[nurse.nurseId]?.estimatedWalkingBurdenUnits ?? 0
      };
    }),
    colorLegend: createManualAssignmentColorLegend(state.nurses, options),
    assignedRoomCount: selectManualAssignments(state).length,
    unassignedOccupiedRoomCount: unassignedOccupiedRoomIds.size
  };
}

function disabledReasonForRoomType(roomType: string | undefined): string {
  return roomType === "storage"
    ? "Storage is excluded from nurse assignment."
    : "Solid wall / blocked area is excluded from nurse assignment.";
}

function labelRoom(roomId: string): string {
  const match = /^room-(\d+)$/u.exec(roomId);
  if (match?.[1] != null) {
    return `Room ${Number(match[1])}`;
  }
  return roomId.replace(/^room-/u, "Room ");
}

function compareRoomLoadsByRoomId(left: ManualAssignmentRoomLoad, right: ManualAssignmentRoomLoad): number {
  return left.roomId.localeCompare(right.roomId);
}

function displayLabelForNurse(
  nurse: ManualAssignmentNurse,
  options: ManualAssignmentDisplayOptions
): string {
  return options.displayLabelsByNurseId?.[nurse.nurseId] ?? nurse.displayLabel;
}
