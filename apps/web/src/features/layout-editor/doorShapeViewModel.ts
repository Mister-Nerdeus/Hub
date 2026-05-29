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
  orientation: "horizontal" | "vertical";
  markerX: number;
  markerY: number;
  markerWidthPixels: number;
  markerHeightPixels: number;
  hitSlopPixels: number;
  invalid: boolean;
  warnings: readonly string[];
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
  const orientation = widthPixels >= heightPixels ? "horizontal" : "vertical";
  const markerThickness = Math.max(10, Math.min(widthPixels, heightPixels) + 8);
  const markerLength = Math.max(22, Math.max(widthPixels, heightPixels));
  const markerWidthPixels = orientation === "horizontal" ? markerLength : markerThickness;
  const markerHeightPixels = orientation === "horizontal" ? markerThickness : markerLength;
  const markerX = xPixels + widthPixels / 2 - markerWidthPixels / 2;
  const markerY = yPixels + heightPixels / 2 - markerHeightPixels / 2;
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
    heightPixels,
    orientation,
    markerX,
    markerY,
    markerWidthPixels,
    markerHeightPixels,
    hitSlopPixels: 6,
    invalid: item.geometryStatus === "clamped" || item.geometryStatus === "invalid" || source.widthFeet <= 0 || source.offsetFeet < 0,
    warnings: item.geometryWarnings ?? []
  };
}
