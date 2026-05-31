import {
  validateRoomLoadContract,
  type AssignmentSetContract,
  type RoomLoadContract
} from "@nerdeus/shared";

export type RoomLoadEditorCard = RoomLoadContract & {
  riskLabels: string[];
  frequencySummary: string;
};

export type RoomLoadEditorViewModel = {
  selectedRoomId: string | null;
  cards: RoomLoadEditorCard[];
};

export function createRoomLoadViewModel(
  assignmentSet: AssignmentSetContract,
  selectedRoomId: string | null = null
): RoomLoadEditorViewModel {
  const cards = Object.values(assignmentSet.roomLoadsByRoomId)
    .map(validateRoomLoadContract)
    .sort((left, right) => left.roomId.localeCompare(right.roomId, undefined, { numeric: true }))
    .map((roomLoad) => ({
      ...roomLoad,
      riskLabels: riskLabels(roomLoad),
      frequencySummary: `med ${roomLoad.medicationFrequency} / monitor ${roomLoad.monitoringFrequency}`
    }));
  return {
    selectedRoomId: selectedRoomId ?? cards[0]?.roomId ?? null,
    cards
  };
}

function riskLabels(roomLoad: RoomLoadContract): string[] {
  return [
    roomLoad.traumaActive ? "Trauma" : null,
    roomLoad.isolationActive ? "Isolation" : null,
    roomLoad.behavioralRisk ? "Behavioral" : null,
    roomLoad.fallRisk ? "Fall" : null,
    roomLoad.sitterRequired ? "Sitter" : null
  ].filter((label): label is string => label != null);
}
