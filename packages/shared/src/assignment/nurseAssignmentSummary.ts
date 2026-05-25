import type { PlanContract } from "../contracts.js";
import type { Plan1AssignmentWalkingPreview } from "./assignmentWalkingPreview.js";
import {
  type Plan1AssignmentWarning,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile,
  type Plan1RoomLoad
} from "./plan1AssignmentCommon.js";

export type Plan1NurseAssignmentSummary = {
  nurseId: string;
  displayName: string;
  color: string;
  role: string;
  homeStationLabel: string;
  assignedRoomIds: string[];
  assignedRoomLabels: string[];
  occupiedRoomCount: number;
  targetPatientCount: number;
  maxPatientCount: number;
  roomLoadSummary: {
    highOrCriticalAcuityCount: number;
    traumaActiveCount: number;
    isolationActiveCount: number;
    behavioralRiskCount: number;
  };
  warningCodes: string[];
  warningSeverities: string[];
  walkingPreviewPlaceholder: string;
  walkingPreview?: Plan1AssignmentWalkingPreview;
  limitations: string[];
};

export function buildPlan1NurseAssignmentSummaries(input: {
  plan: PlanContract;
  nurses: Plan1NurseProfile[];
  roomLoads: Plan1RoomLoad[];
  assignments: Plan1ManualAssignmentRecord[];
  warnings: Plan1AssignmentWarning[];
  walkingPreviews?: Plan1AssignmentWalkingPreview[];
}): Plan1NurseAssignmentSummary[] {
  const roomById = new Map(input.plan.rooms.map((room) => [room.id, room]));
  const stationById = new Map(input.plan.nurseStations.map((station) => [station.id, station]));
  const loadByRoomId = new Map(input.roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const walkingByNurseId = new Map((input.walkingPreviews ?? []).map((preview) => [preview.nurseId, preview]));
  return input.nurses.map((nurse) => {
    const assignedRoomIds = input.assignments
      .filter((assignment) => assignment.nurseId === nurse.nurseId && assignment.assignmentType === "primary")
      .map((assignment) => assignment.roomId);
    const assignedLoads = assignedRoomIds
      .map((roomId) => loadByRoomId.get(roomId))
      .filter((roomLoad): roomLoad is Plan1RoomLoad => roomLoad != null);
    const nurseWarnings = input.warnings.filter(
      (warning) => warning.nurseIds.includes(nurse.nurseId) || warning.nurseIds.length === 0
    );
    return {
      nurseId: nurse.nurseId,
      displayName: nurse.displayName,
      color: nurse.color,
      role: nurse.role,
      homeStationLabel: stationById.get(nurse.homeStationId)?.label ?? nurse.homeStationId,
      assignedRoomIds,
      assignedRoomLabels: assignedRoomIds.map((roomId) => roomById.get(roomId)?.label ?? roomId),
      occupiedRoomCount: assignedLoads.filter((roomLoad) => roomLoad.occupied).length,
      targetPatientCount: nurse.targetPatientCount,
      maxPatientCount: nurse.maxPatientCount,
      roomLoadSummary: {
        highOrCriticalAcuityCount: assignedLoads.filter(
          (roomLoad) => roomLoad.occupied && ["high", "critical"].includes(roomLoad.acuityLevel)
        ).length,
        traumaActiveCount: assignedLoads.filter((roomLoad) => roomLoad.occupied && roomLoad.traumaActive).length,
        isolationActiveCount: assignedLoads.filter((roomLoad) => roomLoad.occupied && roomLoad.isolationActive).length,
        behavioralRiskCount: assignedLoads.filter((roomLoad) => roomLoad.occupied && roomLoad.behavioralRisk).length
      },
      warningCodes: [...new Set(nurseWarnings.map((warning) => warning.code))],
      warningSeverities: [...new Set(nurseWarnings.map((warning) => warning.severity))],
      walkingPreviewPlaceholder: "Walking-aware preview added in Issue 247.",
      walkingPreview: walkingByNurseId.get(nurse.nurseId),
      limitations: ["Operational comparison summary only.", "No staffing safety guidance is implied."]
    };
  });
}
