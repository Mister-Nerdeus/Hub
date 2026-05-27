import type { EditableDoorGeometry, EditableDoorWall, EditableRoomGeometry } from "@nerdeus/shared";

export type DoorQuickEditViewModel = {
  status: "missing" | "ready";
  doorId: string | null;
  label: string;
  wall: EditableDoorWall | null;
  offsetFeet: number | null;
  readOnly: boolean;
  adjacentCandidateCount: number;
  canUseAdjacent: boolean;
  deleteDisabled: boolean;
};

export function buildDoorQuickEdit({
  door,
  rooms,
  readOnly
}: {
  door: EditableDoorGeometry | null;
  rooms: readonly EditableRoomGeometry[];
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
      deleteDisabled: true
    };
  }
  const adjacentCandidateCount = rooms.filter((room) => room.id !== door.ownerId).length;
  return {
    status: "ready",
    doorId: door.id,
    label: door.label,
    wall: door.wall,
    offsetFeet: door.offsetFeet,
    readOnly,
    adjacentCandidateCount,
    canUseAdjacent: adjacentCandidateCount > 0,
    deleteDisabled: readOnly
  };
}
