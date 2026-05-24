import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import type { LayoutSelectionObjectType } from "./layoutSelectionModel";

export const ROOM_RESIZE_HANDLE_ORDER = [
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest"
] as const;

export type RoomResizeHandle = (typeof ROOM_RESIZE_HANDLE_ORDER)[number];

export type RoomResizeHandleViewModel = {
  handle: RoomResizeHandle;
  xPixels: number;
  yPixels: number;
  sizePixels: number;
  ariaLabel: string;
};

export type RoomResizeHandlesViewModel = {
  objectType: "room";
  objectId: string;
  isDisplayOnly: true;
  handles: readonly RoomResizeHandleViewModel[];
};

export type BuildSelectedRoomResizeHandlesViewModelInput = {
  renderItems: readonly LayoutObjectRenderItem[];
  selectedObjectType: LayoutSelectionObjectType | null;
  selectedObjectId: string | null;
};

const HANDLE_SIZE_PIXELS = 8;

export function buildSelectedRoomResizeHandlesViewModel({
  renderItems,
  selectedObjectType,
  selectedObjectId
}: BuildSelectedRoomResizeHandlesViewModelInput): RoomResizeHandlesViewModel | null {
  if (selectedObjectType !== "room" || selectedObjectId == null) {
    return null;
  }

  const selectedRoomItem = renderItems.find(
    (item) => item.objectType === "room" && item.objectId === selectedObjectId
  );
  return selectedRoomItem == null ? null : buildRoomResizeHandlesViewModel(selectedRoomItem);
}

export function buildRoomResizeHandlesViewModel(
  selectedRoomItem: LayoutObjectRenderItem | null
): RoomResizeHandlesViewModel {
  if (selectedRoomItem == null) {
    throw new Error("resize handles require a selected room render item");
  }
  if (selectedRoomItem.objectType !== "room") {
    throw new Error("resize handles require a room render item");
  }

  const { xPixels, yPixels, widthPixels, heightPixels } = selectedRoomItem.displayRectPixels;
  const centerX = xPixels + widthPixels / 2;
  const centerY = yPixels + heightPixels / 2;
  const eastX = xPixels + widthPixels;
  const southY = yPixels + heightPixels;
  const points: Record<RoomResizeHandle, { xPixels: number; yPixels: number }> = {
    north: { xPixels: centerX, yPixels },
    south: { xPixels: centerX, yPixels: southY },
    east: { xPixels: eastX, yPixels: centerY },
    west: { xPixels, yPixels: centerY },
    northeast: { xPixels: eastX, yPixels },
    northwest: { xPixels, yPixels },
    southeast: { xPixels: eastX, yPixels: southY },
    southwest: { xPixels, yPixels: southY }
  };

  return {
    objectType: "room",
    objectId: selectedRoomItem.objectId,
    isDisplayOnly: true,
    handles: ROOM_RESIZE_HANDLE_ORDER.map((handle) => ({
      handle,
      xPixels: points[handle].xPixels,
      yPixels: points[handle].yPixels,
      sizePixels: HANDLE_SIZE_PIXELS,
      ariaLabel: `${handle} resize handle for ${selectedRoomItem.objectId}`
    }))
  };
}
