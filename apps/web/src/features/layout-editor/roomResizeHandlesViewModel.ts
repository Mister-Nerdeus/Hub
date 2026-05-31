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

export function isRoomResizeHandle(value: unknown): value is RoomResizeHandle {
  return typeof value === "string" && ROOM_RESIZE_HANDLE_ORDER.includes(value as RoomResizeHandle);
}

export type RoomResizeHandleViewModel = {
  handle: RoomResizeHandle;
  xPixels: number;
  yPixels: number;
  sizePixels: number;
  ariaLabel: string;
};

export type RoomResizeHandlesViewModel = {
  objectType: "room" | "split_room_parent";
  objectId: string;
  isDisplayOnly: false;
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
  if ((selectedObjectType !== "room" && selectedObjectType !== "split_room_parent") || selectedObjectId == null) {
    return null;
  }

  const selectedRoomItem = renderItems.find(
    (item) => item.objectType === selectedObjectType && item.objectId === selectedObjectId
  );
  return selectedRoomItem == null ? null : buildRoomResizeHandlesViewModel(selectedRoomItem);
}

export function buildRoomResizeHandlesViewModel(
  selectedRoomItem: LayoutObjectRenderItem | null
): RoomResizeHandlesViewModel {
  if (selectedRoomItem == null) {
    throw new Error("resize handles require a selected room render item");
  }
  if (selectedRoomItem.objectType !== "room" && selectedRoomItem.objectType !== "split_room_parent") {
    throw new Error("resize handles require a room or split_room_parent render item");
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
    objectType: selectedRoomItem.objectType,
    objectId: selectedRoomItem.objectId,
    isDisplayOnly: false,
    handles: ROOM_RESIZE_HANDLE_ORDER.map((handle) => ({
      handle,
      xPixels: points[handle].xPixels,
      yPixels: points[handle].yPixels,
      sizePixels: HANDLE_SIZE_PIXELS,
      ariaLabel: `${handle} resize handle for ${selectedRoomItem.objectId}`
    }))
  };
}
