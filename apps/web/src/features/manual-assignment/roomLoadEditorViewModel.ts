import {
  validateManualAssignmentRoomLoad,
  type ManualAssignmentRoomLoad
} from "@nerdeus/shared";

export type RoomLoadEditorCardViewModel = {
  roomId: string;
  occupied: boolean;
  acuity: number;
  riskLabels: string[];
  frequencySummary: string;
  procedureBurden: string;
  expectedTurnover: string;
};

export function createRoomLoadEditorViewModel(
  roomLoads: ManualAssignmentRoomLoad[],
  selectedRoomId: string | null = null
): {
  selectedRoomId: string | null;
  cards: RoomLoadEditorCardViewModel[];
} {
  const validatedLoads = roomLoads.map((roomLoad) => validateManualAssignmentRoomLoad(roomLoad));
  return {
    selectedRoomId: selectedRoomId ?? validatedLoads[0]?.roomId ?? null,
    cards: validatedLoads.map((roomLoad) => ({
      roomId: roomLoad.roomId,
      occupied: roomLoad.occupied,
      acuity: roomLoad.acuity,
      riskLabels: riskLabels(roomLoad),
      frequencySummary: `med ${roomLoad.medicationFrequency} / monitor ${roomLoad.monitoringFrequency}`,
      procedureBurden: roomLoad.procedureBurden,
      expectedTurnover: roomLoad.expectedTurnover
    }))
  };
}

function riskLabels(roomLoad: ManualAssignmentRoomLoad): string[] {
  return [
    roomLoad.traumaActive ? "Trauma" : null,
    roomLoad.isolationActive ? "Isolation" : null,
    roomLoad.behavioralRisk ? "Behavioral" : null,
    roomLoad.fallRisk ? "Fall" : null,
    roomLoad.sitterRequired ? "Sitter" : null
  ].filter((label): label is string => label != null);
}
