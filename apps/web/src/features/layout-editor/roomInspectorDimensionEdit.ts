import type {
  EditableHallwayGeometry,
  EditableLayoutGeometryContract,
  EditableRoomGeometry
} from "@nerdeus/shared";

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

type EditableInspectorRectGeometry = Pick<
  EditableRoomGeometry,
  "id" | "xFeet" | "yFeet" | "widthFeet" | "heightFeet"
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
            rect: room,
            changes,
            snapMode,
            minimumSizeFeet
          })
        : room
    )
  };
}

export function editSelectedHallwayDimensionsInLayout({
  layout,
  selectedObjectType,
  selectedObjectId,
  hallwayId,
  changes,
  snapMode,
  minimumSizeFeet = 1
}: {
  layout: EditableLayoutGeometryContract;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
  hallwayId: string;
  changes: RoomInspectorDimensionChanges;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet?: number;
}): EditableLayoutGeometryContract {
  if (selectedObjectType !== "hallway" || selectedObjectId !== hallwayId) {
    return layout;
  }

  const hallwayIndex = layout.hallways.findIndex((hallway) => hallway.id === hallwayId);
  if (hallwayIndex < 0) {
    throw new Error(`unknown hallway: ${hallwayId}`);
  }

  return {
    ...layout,
    hallways: layout.hallways.map((hallway) =>
      hallway.id === hallwayId
        ? applyInspectorDimensionChanges<EditableHallwayGeometry>({
            rect: hallway,
            changes,
            snapMode,
            minimumSizeFeet
          })
        : hallway
    )
  };
}

function applyInspectorDimensionChanges<TRect extends EditableInspectorRectGeometry>({
  rect,
  changes,
  snapMode,
  minimumSizeFeet
}: {
  rect: TRect;
  changes: RoomInspectorDimensionChanges;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet: number;
}): TRect {
  const minimumSize = requirePositive(minimumSizeFeet, "minimumSizeFeet");
  const merged = {
    ...rect,
    ...normalizeFiniteChanges(changes)
  };
  const snapped = snapRectFeet(merged, snapSizeFeetForMode(snapMode));

  return {
    ...rect,
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
