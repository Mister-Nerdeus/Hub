export const SPLIT_ROOM_TERM = "Split Room";

export const SPLIT_ROOM_HELP_COPY =
  "A split room is one physical bay with two patient-care positions. The divider shows how the space is split. Each numbered position can still be assigned independently.";

export function splitRoomDisplayName(pairLabel: string): string {
  return `${SPLIT_ROOM_TERM} ${pairLabel}`;
}

export function createSplitRoomActionLabel(pairLabel: string): string {
  return `Create ${splitRoomDisplayName(pairLabel)}`;
}

export function previewSplitRoomActionLabel(pairLabel: string): string {
  return `Preview ${splitRoomDisplayName(pairLabel)}`;
}
