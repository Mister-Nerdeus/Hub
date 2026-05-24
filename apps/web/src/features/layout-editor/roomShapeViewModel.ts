import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type RoomShapeViewModel = {
  objectType: "room";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  roomNumber: string;
  roomType: string;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
  labelX: number;
  labelY: number;
};

export function buildRoomShapeViewModel(item: LayoutObjectRenderItem): RoomShapeViewModel {
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
    roomNumber: source.roomNumber,
    roomType: source.roomType,
    xPixels,
    yPixels,
    widthPixels,
    heightPixels,
    labelX: xPixels + widthPixels / 2,
    labelY: yPixels + heightPixels / 2
  };
}
