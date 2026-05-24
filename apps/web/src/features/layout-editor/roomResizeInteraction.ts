import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import type { LayoutEditorSelectableObjectType, LayoutEditorSnapMode } from "./layoutEditorState";
import { resizeRoomByHandleDeltaFeet } from "./roomResizeGeometry";
import type { RoomResizeHandle } from "./roomResizeHandlesViewModel";

export type ResizeSelectedRoomInLayoutInput = {
  layout: EditableLayoutGeometryContract;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
  roomId: string;
  handle: RoomResizeHandle;
  deltaFeet: {
    deltaXFeet: number;
    deltaYFeet: number;
  };
  snapMode: LayoutEditorSnapMode;
};

export function resizeSelectedRoomInLayout({
  layout,
  selectedObjectType,
  selectedObjectId,
  roomId,
  handle,
  deltaFeet,
  snapMode
}: ResizeSelectedRoomInLayoutInput): EditableLayoutGeometryContract {
  if (selectedObjectType !== "room" || selectedObjectId !== roomId) {
    return layout;
  }

  const roomIndex = layout.rooms.findIndex((room) => room.id === roomId);
  if (roomIndex < 0) {
    throw new Error(`unknown room: ${roomId}`);
  }

  return {
    ...layout,
    rooms: layout.rooms.map((room) =>
      room.id === roomId
        ? resizeRoomByHandleDeltaFeet({
            room,
            handle,
            deltaFeet,
            snapMode
          })
        : room
    )
  };
}
