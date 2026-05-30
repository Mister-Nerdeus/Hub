import type { AddObjectMenuItemId } from "./addObjectMenuViewModel";
import { isRoomPlacementMenuItem } from "./addObjectMenuViewModel";
import type { LayoutPointFeet } from "./layoutCoordinateSystem";
import { getRoomPresentationStyle } from "./roomPresentationStyles";

export type ObjectPlacementPreviewViewModel = {
  objectType: AddObjectMenuItemId;
  label: string;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
  fill: string;
  stroke: string;
};

export const DEFAULT_PATIENT_ROOM_WIDTH_FEET = 10;
export const DEFAULT_PATIENT_ROOM_HEIGHT_FEET = 10;
export const DEFAULT_STORAGE_ROOM_WIDTH_FEET = 10;
export const DEFAULT_STORAGE_ROOM_HEIGHT_FEET = 10;

export function buildObjectPlacementPreview({
  objectType,
  pointFeet
}: {
  objectType: AddObjectMenuItemId | null;
  pointFeet: LayoutPointFeet | null;
}): ObjectPlacementPreviewViewModel | null {
  if (objectType == null) {
    return null;
  }
  const point = pointFeet ?? { xFeet: 18, yFeet: 16 };
  const size = getDefaultPlacementSizeForObject(objectType);
  return {
    objectType,
    label: placementLabel(objectType),
    xFeet: point.xFeet,
    yFeet: point.yFeet,
    widthFeet: size.widthFeet,
    heightFeet: size.heightFeet,
    ...placementStyle(objectType)
  };
}

export function placeObjectOnCanvas({
  objectType,
  readOnly,
  target
}: {
  objectType: AddObjectMenuItemId | null;
  readOnly: boolean;
  target?: EventTarget | null;
}): "blocked" | "place-room" | "future-object" {
  if (readOnly || objectType == null) return "blocked";
  if (target != null && !isCanvasPlacementTarget(target)) return "blocked";
  return isRoomPlacementMenuItem(objectType) ? "place-room" : "future-object";
}

export function isCanvasPlacementTarget(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }
  if (target.closest("[data-canvas-pan-blocker='true']") != null) return false;
  if (target.closest(".layout-editor-stage__room") != null) return false;
  if (target.closest(".layout-editor-stage__door") != null) return false;
  if (target.closest(".layout-editor-stage__support-access") != null) return false;
  if (target.closest(".layout-editor-stage__split-bay") != null) return false;
  if (target.closest(".layout-editor-stage__resize-handle") != null) return false;
  if (target.closest(".layout-editor-stage__station") != null) return false;
  if (target.closest(".layout-editor-stage__hallway") != null) return false;
  if (target.closest(".layout-editor-stage__zone") != null) return false;
  if (target.closest(".canvas-object-popover") != null) return false;
  return target.closest(".layout-editor-stage__svg") != null;
}

export function getDefaultPlacementSizeForObject(
  objectType: AddObjectMenuItemId
): { widthFeet: number; heightFeet: number } {
  switch (objectType) {
    case "hallway":
      return { widthFeet: 18, heightFeet: 4 };
    case "door":
      return { widthFeet: 4, heightFeet: 1 };
    case "nurse_station":
      return { widthFeet: 8, heightFeet: 4 };
    case "zone":
    case "provider_pharmacy":
    case "ems_entry":
      return { widthFeet: 10, heightFeet: 8 };
    case "label":
      return { widthFeet: 8, heightFeet: 2 };
    case "patient_care_room":
      return {
        widthFeet: DEFAULT_PATIENT_ROOM_WIDTH_FEET,
        heightFeet: DEFAULT_PATIENT_ROOM_HEIGHT_FEET
      };
    case "storage_room":
      return {
        widthFeet: DEFAULT_STORAGE_ROOM_WIDTH_FEET,
        heightFeet: DEFAULT_STORAGE_ROOM_HEIGHT_FEET
      };
    case "solid_wall":
      return {
        widthFeet: DEFAULT_PATIENT_ROOM_WIDTH_FEET,
        heightFeet: DEFAULT_PATIENT_ROOM_HEIGHT_FEET
      };
  }
}

function placementLabel(objectType: AddObjectMenuItemId): string {
  switch (objectType) {
    case "patient_care_room":
      return "Patient care room";
    case "storage_room":
      return "Storage room";
    case "solid_wall":
      return "Solid wall / blocked area";
    default:
      return objectType.replace(/_/g, " ");
  }
}

function placementStyle(objectType: AddObjectMenuItemId): { fill: string; stroke: string } {
  if (objectType === "storage_room") {
    const style = getRoomPresentationStyle("storage");
    return { fill: style.fill, stroke: style.stroke };
  }
  if (objectType === "provider_pharmacy") {
    const style = getRoomPresentationStyle("provider_pharmacy");
    return { fill: style.fill, stroke: style.stroke };
  }
  if (objectType === "solid_wall") {
    const style = getRoomPresentationStyle("solid_wall");
    return { fill: style.fill, stroke: style.stroke };
  }
  return { fill: "rgba(139, 183, 216, 0.22)", stroke: "#0f766e" };
}
