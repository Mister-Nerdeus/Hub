import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";
import type { EditorPopupMode } from "./EditorPopupModeControl";

export type CanvasObjectPopoverViewModel = {
  objectType: LayoutEditorSelectableObjectType;
  objectId: string;
  title: string;
  placement: "canvas" | "docked";
  dockReason: string | null;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
};

export type BuildCanvasObjectPopoverInput = {
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
  renderItems: readonly LayoutObjectRenderItem[];
  popupMode?: EditorPopupMode;
  canvasWidthPixels?: number;
  canvasHeightPixels?: number;
};

const POPOVER_WIDTH_PIXELS = 230;
const POPOVER_HEIGHT_PIXELS = 290;

export function buildCanvasObjectPopover({
  selectedObjectType,
  selectedObjectId,
  renderItems,
  popupMode = "auto",
  canvasWidthPixels = 1080,
  canvasHeightPixels = 720
}: BuildCanvasObjectPopoverInput): CanvasObjectPopoverViewModel | null {
  if (selectedObjectType == null || selectedObjectId == null) {
    return null;
  }
  const item = renderItems.find(
    (candidate) =>
      candidate.objectType === selectedObjectType && candidate.objectId === selectedObjectId
  );
  if (item == null) {
    return null;
  }
  const rect = item.displayRectPixels;
  const fitsCanvas =
    POPOVER_WIDTH_PIXELS + 16 <= canvasWidthPixels &&
    POPOVER_HEIGHT_PIXELS + 16 <= canvasHeightPixels;
  const shouldDock = popupMode === "docked" || (popupMode === "auto" && !fitsCanvas);
  if (shouldDock) {
    return {
      objectType: selectedObjectType,
      objectId: selectedObjectId,
      title: `${formatObjectType(selectedObjectType)} ${selectedObjectId}`,
      placement: "docked",
      dockReason: popupMode === "docked" ? "User selected docked mode." : "Canvas space is too constrained for the popup.",
      xPixels: 0,
      yPixels: 0,
      widthPixels: POPOVER_WIDTH_PIXELS,
      heightPixels: POPOVER_HEIGHT_PIXELS
    };
  }
  const preferredX = rect.xPixels + rect.widthPixels + 10;
  const preferredY = rect.yPixels;
  const maxX = Math.max(8, canvasWidthPixels - POPOVER_WIDTH_PIXELS - 8);
  const maxY = Math.max(8, canvasHeightPixels - POPOVER_HEIGHT_PIXELS - 8);
  return {
    objectType: selectedObjectType,
    objectId: selectedObjectId,
    title: `${formatObjectType(selectedObjectType)} ${selectedObjectId}`,
    placement: "canvas",
    dockReason: null,
    xPixels: clamp(preferredX, 8, maxX),
    yPixels: clamp(preferredY, 8, maxY),
    widthPixels: POPOVER_WIDTH_PIXELS,
    heightPixels: POPOVER_HEIGHT_PIXELS
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function formatObjectType(objectType: LayoutEditorSelectableObjectType): string {
  switch (objectType) {
    case "room":
      return "Room";
    case "door":
      return "Door";
    case "support_access":
      return "Support access";
    case "station":
      return "Station";
    case "hallway":
      return "Hallway";
    case "zone":
      return "Zone";
    case "split_bay":
      return "Split Room";
  }
}
