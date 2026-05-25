import type { AuthoringRoomType } from "@nerdeus/shared";

export type AddRoomToolDraft = {
  selectedRoomType: AuthoringRoomType;
  defaultWidthFeet: number;
  defaultHeightFeet: number;
};

export function buildAddRoomAction(input: {
  sequence: number;
  draft: AddRoomToolDraft;
  xFeet: number;
  yFeet: number;
}) {
  const roomId = `authored-room-${String(input.sequence).padStart(3, "0")}`;
  return {
    type: "addRoom" as const,
    roomId,
    label: `Authored Room ${String(input.sequence).padStart(3, "0")}`,
    roomType: input.draft.selectedRoomType,
    xFeet: input.xFeet,
    yFeet: input.yFeet,
    widthFeet: input.draft.defaultWidthFeet,
    heightFeet: input.draft.defaultHeightFeet
  };
}
