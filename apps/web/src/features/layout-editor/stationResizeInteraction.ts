import type { EditableLayoutGeometryContract, EditableStationGeometry } from "@nerdeus/shared";

import {
  snapMoveDeltaFeet,
  snapRectFeet,
  snapSizeFeetForMode,
  type LayoutMoveDeltaFeet,
  type LayoutSnapEngineMode
} from "./layoutSnapEngine";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";
import type { RoomInspectorDimensionField } from "./roomInspectorDimensionEdit";
import { DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET } from "./roomResizeGeometry";
import {
  STATION_RESIZE_HANDLE_ORDER,
  type StationResizeHandle
} from "./stationResizeHandlesViewModel";

export type StationRect = Pick<
  EditableStationGeometry,
  "xFeet" | "yFeet" | "widthFeet" | "heightFeet"
>;

export type StationInspectorDimensionChanges = Partial<
  Pick<EditableStationGeometry, RoomInspectorDimensionField>
>;

export type ResizeSelectedStationInLayoutInput = {
  layout: EditableLayoutGeometryContract;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
  stationId: string;
  handle: StationResizeHandle;
  deltaFeet: LayoutMoveDeltaFeet;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet?: number;
};

export type EditSelectedStationDimensionsInLayoutInput = {
  layout: EditableLayoutGeometryContract;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
  stationId: string;
  changes: StationInspectorDimensionChanges;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet?: number;
};

export function resizeSelectedStationInLayout({
  layout,
  selectedObjectType,
  selectedObjectId,
  stationId,
  handle,
  deltaFeet,
  snapMode,
  minimumSizeFeet = DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET
}: ResizeSelectedStationInLayoutInput): EditableLayoutGeometryContract {
  if (selectedObjectType !== "station" || selectedObjectId !== stationId) {
    return layout;
  }
  requireStationResizeHandle(handle);
  const stationIndex = layout.stations.findIndex((station) => station.id === stationId);
  if (stationIndex < 0) {
    throw new Error(`unknown station: ${stationId}`);
  }
  return {
    ...layout,
    stations: layout.stations.map((station) =>
      station.id === stationId
        ? {
            ...station,
            ...resizeStationRectByHandleDeltaFeet({
              rect: station,
              handle,
              deltaFeet,
              snapMode,
              minimumSizeFeet
            })
          }
        : station
    )
  };
}

export function editSelectedStationDimensionsInLayout({
  layout,
  selectedObjectType,
  selectedObjectId,
  stationId,
  changes,
  snapMode,
  minimumSizeFeet = DEFAULT_MINIMUM_ROOM_RESIZE_SIZE_FEET
}: EditSelectedStationDimensionsInLayoutInput): EditableLayoutGeometryContract {
  if (selectedObjectType !== "station" || selectedObjectId !== stationId) {
    return layout;
  }
  const stationIndex = layout.stations.findIndex((station) => station.id === stationId);
  if (stationIndex < 0) {
    throw new Error(`unknown station: ${stationId}`);
  }
  const minimumSize = requirePositive(minimumSizeFeet, "minimumSizeFeet");
  return {
    ...layout,
    stations: layout.stations.map((station) => {
      if (station.id !== stationId) {
        return station;
      }
      const merged = {
        ...station,
        ...normalizeFiniteChanges(changes)
      };
      const snapped = snapRectFeet(merged, snapSizeFeetForMode(snapMode));
      return {
        ...station,
        xFeet: snapped.xFeet,
        yFeet: snapped.yFeet,
        widthFeet: Math.max(snapped.widthFeet, minimumSize),
        heightFeet: Math.max(snapped.heightFeet, minimumSize)
      };
    })
  };
}

function resizeStationRectByHandleDeltaFeet({
  rect,
  handle,
  deltaFeet,
  snapMode,
  minimumSizeFeet
}: {
  rect: StationRect;
  handle: StationResizeHandle;
  deltaFeet: LayoutMoveDeltaFeet;
  snapMode: LayoutSnapEngineMode;
  minimumSizeFeet: number;
}): StationRect {
  const minimumSize = requirePositive(minimumSizeFeet, "minimumSizeFeet");
  const snappedDelta = snapMoveDeltaFeet(deltaFeet, snapSizeFeetForMode(snapMode));
  const resized = applyHandleDelta(rect, handle, snappedDelta);
  return clampResizeGeometry(rect, resized, handle, minimumSize);
}

function applyHandleDelta(
  rect: StationRect,
  handle: StationResizeHandle,
  delta: LayoutMoveDeltaFeet
): StationRect {
  let xFeet = requireFinite(rect.xFeet, "station.xFeet");
  let yFeet = requireFinite(rect.yFeet, "station.yFeet");
  let widthFeet = requireFinite(rect.widthFeet, "station.widthFeet");
  let heightFeet = requireFinite(rect.heightFeet, "station.heightFeet");

  if (handle.includes("east")) {
    widthFeet += delta.deltaXFeet;
  }
  if (handle.includes("west")) {
    xFeet += delta.deltaXFeet;
    widthFeet -= delta.deltaXFeet;
  }
  if (handle.includes("south")) {
    heightFeet += delta.deltaYFeet;
  }
  if (handle.includes("north")) {
    yFeet += delta.deltaYFeet;
    heightFeet -= delta.deltaYFeet;
  }

  return normalizeGeometry({ xFeet, yFeet, widthFeet, heightFeet });
}

function clampResizeGeometry(
  original: StationRect,
  resized: StationRect,
  handle: StationResizeHandle,
  minimumSizeFeet: number
): StationRect {
  const originalRightFeet = original.xFeet + original.widthFeet;
  const originalBottomFeet = original.yFeet + original.heightFeet;
  let { xFeet, yFeet, widthFeet, heightFeet } = resized;

  if (widthFeet < minimumSizeFeet) {
    widthFeet = minimumSizeFeet;
    if (handle.includes("west")) {
      xFeet = originalRightFeet - minimumSizeFeet;
    }
  }

  if (heightFeet < minimumSizeFeet) {
    heightFeet = minimumSizeFeet;
    if (handle.includes("north")) {
      yFeet = originalBottomFeet - minimumSizeFeet;
    }
  }

  return normalizeGeometry({ xFeet, yFeet, widthFeet, heightFeet });
}

function normalizeFiniteChanges(
  changes: StationInspectorDimensionChanges
): StationInspectorDimensionChanges {
  return Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [key, requireFinite(value, key)])
  ) as StationInspectorDimensionChanges;
}

function normalizeGeometry(geometry: StationRect): StationRect {
  return {
    xFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.xFeet, "xFeet"))),
    yFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.yFeet, "yFeet"))),
    widthFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.widthFeet, "widthFeet"))),
    heightFeet: normalizeSignedZero(roundFeet(requireFinite(geometry.heightFeet, "heightFeet")))
  };
}

function requireStationResizeHandle(handle: StationResizeHandle): void {
  if (!STATION_RESIZE_HANDLE_ORDER.includes(handle)) {
    throw new Error("handle must be a supported station resize handle");
  }
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
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
