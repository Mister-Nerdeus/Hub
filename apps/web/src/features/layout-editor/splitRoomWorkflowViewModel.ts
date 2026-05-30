import {
  resolveSplitRoomPair,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "@nerdeus/shared";
import {
  createSplitRoomActionLabel,
  previewSplitRoomActionLabel,
  splitRoomDisplayName
} from "./splitRoomTerminology";

export type SplitRoomWorkflowViewModel = {
  status: "missing" | "ready" | "blocked";
  selectedRoomId: string | null;
  pairId: string | null;
  pairLabel: string | null;
  title: string;
  partnerText: string;
  description: string;
  previewActionLabel: string | null;
  createActionLabel: string | null;
  helpActionLabel: string;
  disabledReason: string | null;
};

export function buildSplitRoomWorkflowViewModel(input: {
  layout: EditableLayoutGeometryContract | null;
  room: EditableRoomGeometry | null;
  readOnly: boolean;
}): SplitRoomWorkflowViewModel {
  const { layout, room, readOnly } = input;
  if (layout == null || room == null) {
    return missing("Select a room to check split room availability.");
  }
  const resolution = resolveSplitRoomPair({ layout, selectedRoomId: room.id });
  if (resolution.status === "blocked") {
    return {
      status: "blocked",
      selectedRoomId: room.id,
      pairId: null,
      pairLabel: null,
      title: "Split room unavailable",
      partnerText: resolution.expectedPartnerId == null
        ? "This room has no configured split room partner."
        : `${roomDisplay(room)} cannot create a split room right now.`,
      description: "This creates one physical bay with two patient-care positions.",
      previewActionLabel: null,
      createActionLabel: null,
      helpActionLabel: "What is a split room?",
      disabledReason: readOnly ? "Read-only layouts cannot be edited." : resolution.reason
    };
  }
  const selectedIsA = room.id === resolution.roomAId;
  const selectedLabel = selectedIsA ? resolution.roomALabel : resolution.roomBLabel;
  const partnerLabel = selectedIsA ? resolution.roomBLabel : resolution.roomALabel;
  return {
    status: readOnly ? "blocked" : "ready",
    selectedRoomId: room.id,
    pairId: resolution.pairId,
    pairLabel: resolution.pairLabel,
    title: "Split room available",
    partnerText: `${selectedLabel} can be paired with ${partnerLabel}.`,
    description: "This creates one physical bay with two patient-care positions.",
    previewActionLabel: previewSplitRoomActionLabel(resolution.pairLabel),
    createActionLabel: createSplitRoomActionLabel(resolution.pairLabel),
    helpActionLabel: "What is a split room?",
    disabledReason: readOnly ? "Read-only layouts cannot be edited." : null
  };
}

function missing(reason: string): SplitRoomWorkflowViewModel {
  return {
    status: "missing",
    selectedRoomId: null,
    pairId: null,
    pairLabel: null,
    title: "Split room unavailable",
    partnerText: reason,
    description: "This creates one physical bay with two patient-care positions.",
    previewActionLabel: null,
    createActionLabel: null,
    helpActionLabel: "What is a split room?",
    disabledReason: reason
  };
}

function roomDisplay(room: EditableRoomGeometry): string {
  return splitRoomDisplayName(room.roomNumber).replace("Split Room", "Room");
}
