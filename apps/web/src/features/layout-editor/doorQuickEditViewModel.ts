import {
  detectDoorAdjacency,
  type EditableDoorGeometry,
  type EditableDoorWall,
  type EditableHallwayGeometry,
  type EditableRoomGeometry,
  isDoorEligibleRoomType
} from "@nerdeus/shared";
import type { AdjacentDoorCandidateItem } from "./adjacentDoorCandidateViewModel";

export type DoorQuickEditViewModel = {
  status: "missing" | "ready";
  doorId: string | null;
  label: string;
  wall: EditableDoorWall | null;
  offsetFeet: number | null;
  readOnly: boolean;
  adjacentCandidateCount: number;
  canUseAdjacent: boolean;
  adjacentCandidates: readonly AdjacentDoorCandidateItem[];
  noCandidateReason: string | null;
  deleteDisabled: boolean;
};

export function buildDoorQuickEdit({
  door,
  rooms,
  hallways = [],
  readOnly
}: {
  door: EditableDoorGeometry | null;
  rooms: readonly EditableRoomGeometry[];
  hallways?: readonly EditableHallwayGeometry[];
  readOnly: boolean;
}): DoorQuickEditViewModel {
  if (door == null) {
    return {
      status: "missing",
      doorId: null,
      label: "No door selected",
      wall: null,
      offsetFeet: null,
      readOnly: true,
      adjacentCandidateCount: 0,
      canUseAdjacent: false,
      adjacentCandidates: [],
      noCandidateReason: "No door selected.",
      deleteDisabled: true
    };
  }
  const ownerRoom = door.ownerKind === "room"
    ? rooms.find((room) => room.id === door.ownerId) ?? null
    : null;
  const ownerDoorEligible = ownerRoom == null || isDoorEligibleRoomType(ownerRoom.roomType);
  const adjacency = detectDoorAdjacency({
    layout: {
      schemaVersion: "1.0.0",
      layoutId: "door-quick-edit-adjacent-candidates",
      units: "feet",
      rooms: [...rooms],
      doors: [door],
      stations: [],
      hallways: [...hallways],
      zones: [],
      limitations: ["Editor-only adjacent candidate view model."]
    },
    door
  });
  const adjacentCandidates = adjacency.candidates.map((candidate) => ({
    roomId: candidate.roomId,
    roomLabel: candidate.roomLabel,
    wall: candidate.wall,
    relationshipLabel: candidate.relationshipType.replace("_", " "),
    previewOffsetFeet: candidate.previewOffsetFeet,
    disabled: false as const
  }));
  const adjacentCandidateCount = adjacentCandidates.length;
  const toolsReadOnly = readOnly || !ownerDoorEligible;
  return {
    status: "ready",
    doorId: door.id,
    label: door.label,
    wall: door.wall,
    offsetFeet: door.offsetFeet,
    readOnly: toolsReadOnly,
    adjacentCandidateCount,
    canUseAdjacent: adjacentCandidateCount > 0,
    adjacentCandidates,
    noCandidateReason: !ownerDoorEligible
      ? "Solid wall / blocked area cannot accept doors."
      : adjacentCandidateCount === 0
        ? adjacency.reasonCodes.join(", ")
        : null,
    deleteDisabled: readOnly
  };
}
