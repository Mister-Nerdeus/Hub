import type { AddObjectMenuItemId } from "./addObjectMenuViewModel";
import type { LayoutPointFeet } from "./layoutCoordinateSystem";

export type ObjectPlacementPreviewViewModel = {
  objectType: AddObjectMenuItemId;
  label: string;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
};

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
  const size = defaultPlacementSize(objectType);
  return {
    objectType,
    label: placementLabel(objectType),
    xFeet: point.xFeet,
    yFeet: point.yFeet,
    widthFeet: size.widthFeet,
    heightFeet: size.heightFeet
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
  return objectType === "room" ? "place-room" : "future-object";
}

export function isCanvasPlacementTarget(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return false;
  }
  if (target.closest("[data-canvas-pan-blocker='true']") != null) return false;
  if (target.closest(".layout-editor-stage__room") != null) return false;
  if (target.closest(".layout-editor-stage__door") != null) return false;
  if (target.closest(".layout-editor-stage__resize-handle") != null) return false;
  if (target.closest(".layout-editor-stage__station") != null) return false;
  if (target.closest(".layout-editor-stage__hallway") != null) return false;
  if (target.closest(".layout-editor-stage__zone") != null) return false;
  if (target.closest(".canvas-object-popover") != null) return false;
  return target.closest(".layout-editor-stage__svg") != null;
}

function defaultPlacementSize(objectType: AddObjectMenuItemId): { widthFeet: number; heightFeet: number } {
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
    case "room":
      return { widthFeet: 12, heightFeet: 10 };
  }
}

function placementLabel(objectType: AddObjectMenuItemId): string {
  return objectType.replace(/_/g, " ");
}
