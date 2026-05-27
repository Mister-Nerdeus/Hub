import type { EditableDoorGeometry, EditableRoomGeometry } from "@nerdeus/shared";

export function validateDoorPlacementWarning(
  door: EditableDoorGeometry | null,
  rooms: EditableRoomGeometry[]
): string | null {
  if (door == null) return null;
  const room = rooms.find((candidate) => candidate.id === door.ownerId);
  if (room == null) return "Door owner room is missing.";
  const wallLength = door.wall === "north" || door.wall === "south" ? room.widthFeet : room.heightFeet;
  if (door.offsetFeet < 0 || door.offsetFeet + door.widthFeet > wallLength) {
    return "Door offset is outside the selected wall bounds.";
  }
  return null;
}
