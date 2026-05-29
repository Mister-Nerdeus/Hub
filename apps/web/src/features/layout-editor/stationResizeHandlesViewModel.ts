import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import type { LayoutSelectionObjectType } from "./layoutSelectionModel";
import {
  ROOM_RESIZE_HANDLE_ORDER,
  type RoomResizeHandle
} from "./roomResizeHandlesViewModel";

export const STATION_RESIZE_HANDLE_ORDER = ROOM_RESIZE_HANDLE_ORDER;

export type StationResizeHandle = RoomResizeHandle;

export type StationResizeHandleViewModel = {
  handle: StationResizeHandle;
  xPixels: number;
  yPixels: number;
  sizePixels: number;
  ariaLabel: string;
};

export type StationResizeHandlesViewModel = {
  objectType: "station";
  objectId: string;
  isDisplayOnly: false;
  handles: readonly StationResizeHandleViewModel[];
};

export type BuildSelectedStationResizeHandlesViewModelInput = {
  renderItems: readonly LayoutObjectRenderItem[];
  selectedObjectType: LayoutSelectionObjectType | null;
  selectedObjectId: string | null;
};

const HANDLE_SIZE_PIXELS = 8;

export function buildSelectedStationResizeHandlesViewModel({
  renderItems,
  selectedObjectType,
  selectedObjectId
}: BuildSelectedStationResizeHandlesViewModelInput): StationResizeHandlesViewModel | null {
  if (selectedObjectType !== "station" || selectedObjectId == null) {
    return null;
  }

  const selectedStationItem = renderItems.find(
    (item) => item.objectType === "station" && item.objectId === selectedObjectId
  );
  return selectedStationItem == null ? null : buildStationResizeHandlesViewModel(selectedStationItem);
}

export function buildStationResizeHandlesViewModel(
  selectedStationItem: LayoutObjectRenderItem | null
): StationResizeHandlesViewModel {
  if (selectedStationItem == null) {
    throw new Error("resize handles require a selected station render item");
  }
  if (selectedStationItem.objectType !== "station") {
    throw new Error("resize handles require a station render item");
  }

  const { xPixels, yPixels, widthPixels, heightPixels } = selectedStationItem.displayRectPixels;
  const centerX = xPixels + widthPixels / 2;
  const centerY = yPixels + heightPixels / 2;
  const eastX = xPixels + widthPixels;
  const southY = yPixels + heightPixels;
  const points: Record<StationResizeHandle, { xPixels: number; yPixels: number }> = {
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
    objectType: "station",
    objectId: selectedStationItem.objectId,
    isDisplayOnly: false,
    handles: STATION_RESIZE_HANDLE_ORDER.map((handle) => ({
      handle,
      xPixels: points[handle].xPixels,
      yPixels: points[handle].yPixels,
      sizePixels: HANDLE_SIZE_PIXELS,
      ariaLabel: `${handle} resize handle for ${selectedStationItem.objectId}`
    }))
  };
}
