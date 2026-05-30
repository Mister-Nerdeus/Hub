import type { EditableRoomGeometry, EditableSplitBayGeometry } from "@nerdeus/shared";
import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type SplitBayShapeViewModel = {
  objectType: "split_bay";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  bedLabels: readonly [string, string];
  dividerStyle: EditableSplitBayGeometry["dividerStyle"];
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
};

export function buildSplitBayShapeViewModel(input: {
  item: LayoutObjectRenderItem;
  rooms: readonly EditableRoomGeometry[];
}): SplitBayShapeViewModel {
  const { item, rooms } = input;
  if (item.objectType !== "split_bay" || item.sourceGeometry.objectType !== "split_bay") {
    throw new Error("split bay shape view model requires split_bay render item");
  }
  const source = item.sourceGeometry;
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const bedLabels = source.bedPositionRoomIds.map((roomId) => {
    const room = roomById.get(roomId);
    return room?.roomNumber ?? room?.label ?? roomId;
  }) as [string, string];
  return {
    objectType: "split_bay",
    objectId: item.objectId,
    ariaLabel: item.ariaLabel,
    hitTargetKey: item.hitTargetKey,
    label: source.label,
    bedLabels,
    dividerStyle: source.dividerStyle,
    xPixels: item.displayRectPixels.xPixels,
    yPixels: item.displayRectPixels.yPixels,
    widthPixels: item.displayRectPixels.widthPixels,
    heightPixels: item.displayRectPixels.heightPixels
  };
}
