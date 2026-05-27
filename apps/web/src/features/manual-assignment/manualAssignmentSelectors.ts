import {
  isNurseAssignableRoomType,
  type ManualAssignmentNurse,
  type ManualAssignmentRoomLoad,
  type ManualRoomAssignment
} from "@nerdeus/shared";
import type { ManualAssignmentState } from "./manualAssignmentState";

export function selectManualAssignments(state: ManualAssignmentState): ManualRoomAssignment[] {
  return Object.values(state.assignmentsByRoomId).sort(compareByRoomId);
}

export function selectAssignedRoomsByNurse(state: ManualAssignmentState): Record<string, string[]> {
  const result = Object.fromEntries(state.nurses.map((nurse) => [nurse.nurseId, [] as string[]]));
  for (const assignment of selectManualAssignments(state)) {
    const roomType = state.roomTypesByRoomId?.[assignment.roomId];
    if (roomType != null && !isNurseAssignableRoomType(roomType)) continue;
    result[assignment.nurseId] ??= [];
    const assignedRoomIds = result[assignment.nurseId];
    if (assignedRoomIds) assignedRoomIds.push(assignment.roomId);
  }
  return sortRoomIdLists(result);
}

export function selectUnassignedOccupiedRooms(state: ManualAssignmentState): ManualAssignmentRoomLoad[] {
  return Object.values(state.roomLoadsByRoomId)
    .filter((roomLoad) => roomLoad.occupied && !state.assignmentsByRoomId[roomLoad.roomId])
    .sort(compareRoomLoadsByRoomId);
}

export function selectAssignmentCountByNurse(state: ManualAssignmentState): Record<string, number> {
  const counts = createZeroCountMap(state.nurses);
  for (const assignment of selectManualAssignments(state)) {
    const roomType = state.roomTypesByRoomId?.[assignment.roomId];
    if (roomType != null && !isNurseAssignableRoomType(roomType)) continue;
    counts[assignment.nurseId] = (counts[assignment.nurseId] ?? 0) + 1;
  }
  return counts;
}

export function selectOccupiedAssignmentCountByNurse(state: ManualAssignmentState): Record<string, number> {
  const counts = createZeroCountMap(state.nurses);
  for (const assignment of selectManualAssignments(state)) {
    const roomType = state.roomTypesByRoomId?.[assignment.roomId];
    if (roomType != null && !isNurseAssignableRoomType(roomType)) continue;
    if (state.roomLoadsByRoomId[assignment.roomId]?.occupied) {
      counts[assignment.nurseId] = (counts[assignment.nurseId] ?? 0) + 1;
    }
  }
  return counts;
}

export function selectOverTargetCountByNurse(state: ManualAssignmentState): Record<string, number> {
  const occupiedCounts = selectOccupiedAssignmentCountByNurse(state);
  return Object.fromEntries(
    state.nurses.map((nurse) => [nurse.nurseId, Math.max(0, (occupiedCounts[nurse.nurseId] ?? 0) - nurse.targetPatientCount)])
  );
}

export function selectOverMaxCountByNurse(state: ManualAssignmentState): Record<string, number> {
  const occupiedCounts = selectOccupiedAssignmentCountByNurse(state);
  return Object.fromEntries(
    state.nurses.map((nurse) => [nurse.nurseId, Math.max(0, (occupiedCounts[nurse.nurseId] ?? 0) - nurse.maxPatientCount)])
  );
}

function createZeroCountMap(nurses: ManualAssignmentNurse[]): Record<string, number> {
  return Object.fromEntries(nurses.map((nurse) => [nurse.nurseId, 0]));
}

function sortRoomIdLists(value: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(value).map(([nurseId, roomIds]) => [nurseId, [...roomIds].sort()]));
}

function compareByRoomId(left: ManualRoomAssignment, right: ManualRoomAssignment): number {
  return left.roomId.localeCompare(right.roomId);
}

function compareRoomLoadsByRoomId(left: ManualAssignmentRoomLoad, right: ManualAssignmentRoomLoad): number {
  return left.roomId.localeCompare(right.roomId);
}
