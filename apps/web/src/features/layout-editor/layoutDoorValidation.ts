import { normalizeDoorForOwnerWall, type EditableDoorGeometry, type EditableRoomGeometry } from "@nerdeus/shared";

export function validateDoorPlacementWarning(
  door: EditableDoorGeometry | null,
  rooms: EditableRoomGeometry[]
): string | null {
  if (door == null) return null;
  const room = rooms.find((candidate) => candidate.id === door.ownerId);
  if (room == null) return "Door owner room is missing.";
  const normalized = normalizeDoorForOwnerWall({
    door,
    ownerRect: room,
    minimumDoorWidthFeet: 2
  });
  if (normalized.status === "invalid") {
    return "Door cannot fit on the selected owner wall.";
  }
  if (normalized.status === "clamped") {
    return "Door offset is outside the selected wall bounds.";
  }
  return null;
}
