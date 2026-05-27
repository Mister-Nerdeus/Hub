import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";

export type CanvasObjectPopoverViewModel = {
  objectType: LayoutEditorSelectableObjectType;
  objectId: string;
  title: string;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
};

export type BuildCanvasObjectPopoverInput = {
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
  renderItems: readonly LayoutObjectRenderItem[];
};

const POPOVER_WIDTH_PIXELS = 230;
const POPOVER_HEIGHT_PIXELS = 128;

export function buildCanvasObjectPopover({
  selectedObjectType,
  selectedObjectId,
  renderItems
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
  return {
    objectType: selectedObjectType,
    objectId: selectedObjectId,
    title: `${formatObjectType(selectedObjectType)} ${selectedObjectId}`,
    xPixels: Math.min(rect.xPixels + rect.widthPixels + 10, 960),
    yPixels: Math.max(rect.yPixels, 8),
    widthPixels: POPOVER_WIDTH_PIXELS,
    heightPixels: POPOVER_HEIGHT_PIXELS
  };
}

function formatObjectType(objectType: LayoutEditorSelectableObjectType): string {
  switch (objectType) {
    case "room":
      return "Room";
    case "door":
      return "Door";
    case "station":
      return "Station";
    case "hallway":
      return "Hallway";
    case "zone":
      return "Zone";
  }
}
