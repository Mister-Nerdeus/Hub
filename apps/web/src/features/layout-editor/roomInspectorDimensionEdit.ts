import type { EditableLayoutGeometryContract, EditableRoomGeometry } from "@nerdeus/shared";

import {
  snapRectFeet,
  snapSizeFeetForMode,
  type LayoutSnapEngineMode
} from "./layoutSnapEngine";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";
import { DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET } from "./roomResizeGeometry";

export const ROOM_INSPECTOR_DIMENSION_FIELDS = [
  "xFeet",
  "yFeet",
  "widthFeet",
  "heightFeet"
] as const;

export type RoomInspectorDimensionField = (typeof ROOM_INSPECTOR_DIMENSION_FIELDS)[number];

export type RoomInspectorDimensionChanges = Partial<
  Pick<EditableRoomGeometry, RoomInspectorDimensionField>
>;

export type EditSelectedRoomDimensionsInLayoutInput = {
  layout: EditableLayoutGeometryContract;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
  roomId: string;
  changes: RoomInspectorDimensionChanges;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet?: number;
};

export function editSelectedRoomDimensionsInLayout({
  layout,
  selectedObjectType,
  selectedObjectId,
  roomId,
  changes,
  snapMode,
  minimumSizeFeet = DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET
}: EditSelectedRoomDimensionsInLayoutInput): EditableLayoutGeometryContract {
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
        ? applyInspectorDimensionChanges({
            room,
            changes,
            snapMode,
            minimumSizeFeet
          })
        : room
    )
  };
}

function applyInspectorDimensionChanges({
  room,
  changes,
  snapMode,
  minimumSizeFeet
}: {
  room: EditableRoomGeometry;
  changes: RoomInspectorDimensionChanges;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet: number;
}): EditableRoomGeometry {
  const minimumSize = requirePositive(minimumSizeFeet, "minimumSizeFeet");
  const merged = {
    ...room,
    ...normalizeFiniteChanges(changes)
  };
  const snapped = snapRectFeet(merged, snapSizeFeetForMode(snapMode));

  return {
    ...room,
    xFeet: snapped.xFeet,
    yFeet: snapped.yFeet,
    widthFeet: Math.max(snapped.widthFeet, minimumSize),
    heightFeet: Math.max(snapped.heightFeet, minimumSize)
  };
}

function normalizeFiniteChanges(
  changes: RoomInspectorDimensionChanges
): RoomInspectorDimensionChanges {
  return Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [key, requireFinite(value, key)])
  ) as RoomInspectorDimensionChanges;
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}

function requireFinite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}
