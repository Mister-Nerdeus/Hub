import type { EditableDoorGeometry } from "@nerdeus/shared";

import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type DoorShapeViewModel = {
  objectType: "door";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  ownerKind: EditableDoorGeometry["ownerKind"];
  ownerId: string;
  wall: EditableDoorGeometry["wall"];
  offsetFeet: number;
  widthFeet: number;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
};

export function buildDoorShapeViewModel(item: LayoutObjectRenderItem): DoorShapeViewModel {
  if (item.objectType !== "door") {
    throw new Error("door shape view model requires a door render item");
  }
  const source = item.sourceGeometry;
  if (source.objectType !== "door") {
    throw new Error("door render item requires door source geometry");
  }
  const { xPixels, yPixels, widthPixels, heightPixels } = item.displayRectPixels;
  return {
    objectType: "door",
    objectId: item.objectId,
    ariaLabel: item.ariaLabel,
    hitTargetKey: item.hitTargetKey,
    label: source.label,
    ownerKind: source.ownerKind,
    ownerId: source.ownerId,
    wall: source.wall,
    offsetFeet: source.offsetFeet,
    widthFeet: source.widthFeet,
    xPixels,
    yPixels,
    widthPixels,
    heightPixels
  };
}
