import { supportSpaceVisibleLabel } from "@nerdeus/shared";

import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import type { LayoutAssignmentOverlayRoom } from "./layoutAssignmentOverlay";
import type { LayoutEditorMode } from "./layoutEditorMode";

export type RoomShapeViewModel = {
  objectType: "room";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  visibleLabel: string;
  roomNumber: string;
  roomType: string;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
  labelX: number;
  labelY: number;
  assignmentColor: string | null;
  assignmentLabel: string | null;
  burdenLevel: string | null;
  warningState: string | null;
  unassignedOccupied: boolean;
  presentationActive: boolean;
};

export function buildRoomShapeViewModel(
  item: LayoutObjectRenderItem,
  options: {
    mode?: LayoutEditorMode;
    assignment?: LayoutAssignmentOverlayRoom | null;
  } = {}
): RoomShapeViewModel {
  if (item.objectType !== "room") {
    throw new Error("room shape view model requires a room render item");
  }
  const source = item.sourceGeometry;
  if (source.objectType !== "room") {
    throw new Error("room render item requires room source geometry");
  }
  const { xPixels, yPixels, widthPixels, heightPixels } = item.displayRectPixels;
  return {
    objectType: "room",
    objectId: item.objectId,
    ariaLabel: item.ariaLabel,
    hitTargetKey: item.hitTargetKey,
    label: source.label,
    visibleLabel: supportSpaceVisibleLabel({
      roomType: source.roomType,
      label: source.label,
      internalReferenceId: source.roomNumber
    }),
    roomNumber: source.roomNumber,
    roomType: source.roomType,
    xPixels,
    yPixels,
    widthPixels,
    heightPixels,
    labelX: xPixels + widthPixels / 2,
    labelY: yPixels + heightPixels / 2,
    assignmentColor: options.mode === "edit" ? null : options.assignment?.assignmentColor ?? null,
    assignmentLabel: options.mode === "edit" ? null : options.assignment?.assignmentLabel ?? null,
    burdenLevel: options.mode === "edit" ? null : options.assignment?.burdenLevel ?? null,
    warningState: options.mode === "edit" ? null : options.assignment?.warningState ?? null,
    unassignedOccupied: options.mode === "edit" ? false : options.assignment?.unassignedOccupied ?? false,
    presentationActive: options.mode === "assignment" || options.mode === "presentation"
  };
}
