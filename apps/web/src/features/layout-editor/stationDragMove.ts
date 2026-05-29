import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import type { LayoutEditorSnapMode } from "./layoutEditorState";
import {
  DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET,
  type LayoutWorkspaceBoundsFeet
} from "./layoutWorkspaceConfig";
import { snapSizeForRoomMove } from "./roomDragMove";
import { snapMoveDeltaFeet, type LayoutMoveDeltaFeet } from "./layoutSnapEngine";

export type StationMoveDeltaFeet = LayoutMoveDeltaFeet;

export type MoveStationByDeltaFeetInput = {
  layout: EditableLayoutGeometryContract;
  stationId: string;
  delta: StationMoveDeltaFeet;
  snapMode?: LayoutEditorSnapMode;
  boundsFeet?: LayoutWorkspaceBoundsFeet;
};

export function moveStationByDeltaFeet({
  layout,
  stationId,
  delta,
  snapMode = "default",
  boundsFeet = DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET
}: MoveStationByDeltaFeetInput): EditableLayoutGeometryContract {
  if (typeof stationId !== "string" || stationId.length === 0) {
    throw new Error("stationId must be a non-empty string");
  }

  const station = layout.stations.find((candidate) => candidate.id === stationId);
  if (station == null) {
    throw new Error(`unknown station: ${stationId}`);
  }

  const snappedDelta = snapMoveDeltaFeet(delta, snapSizeForRoomMove(snapMode));
  const xFeet = clampFeet(
    roundFeet(station.xFeet + snappedDelta.deltaXFeet),
    boundsFeet.xFeet,
    boundsFeet.xFeet + boundsFeet.widthFeet - station.widthFeet
  );
  const yFeet = clampFeet(
    roundFeet(station.yFeet + snappedDelta.deltaYFeet),
    boundsFeet.yFeet,
    boundsFeet.yFeet + boundsFeet.heightFeet - station.heightFeet
  );

  return {
    ...layout,
    stations: layout.stations.map((candidate) =>
      candidate.id === stationId
        ? {
            ...candidate,
            xFeet,
            yFeet
          }
        : candidate
    )
  };
}

function clampFeet(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function roundFeet(value: number): number {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}
