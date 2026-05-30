import type { EditableSupportAccessPointGeometry } from "@nerdeus/shared";
import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type SupportAccessPointViewModel = {
  objectType: "support_access";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  ownerId: string;
  wall: EditableSupportAccessPointGeometry["wall"];
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
};

export function buildSupportAccessPointViewModel(
  item: LayoutObjectRenderItem
): SupportAccessPointViewModel {
  if (item.objectType !== "support_access" || item.sourceGeometry.objectType !== "support_access") {
    throw new Error("support access shape view model requires support_access render item");
  }
  const source = item.sourceGeometry;
  const { xPixels, yPixels, widthPixels, heightPixels } = item.displayRectPixels;
  const orientation = widthPixels >= heightPixels ? "horizontal" : "vertical";
  const markerThickness = Math.max(8, Math.min(widthPixels, heightPixels) + 6);
  const markerLength = Math.max(20, Math.max(widthPixels, heightPixels));
  const markerWidthPixels = orientation === "horizontal" ? markerLength : markerThickness;
  const markerHeightPixels = orientation === "horizontal" ? markerThickness : markerLength;
  return {
    objectType: "support_access",
    objectId: item.objectId,
    ariaLabel: item.ariaLabel,
    hitTargetKey: item.hitTargetKey,
    label: source.label,
    ownerId: source.ownerId,
    wall: source.wall,
    offsetFeet: source.offsetFeet,
    widthFeet: source.widthFeet,
    xPixels,
    yPixels,
    widthPixels,
    heightPixels,
    orientation,
    markerX: xPixels + widthPixels / 2 - markerWidthPixels / 2,
    markerY: yPixels + heightPixels / 2 - markerHeightPixels / 2,
    markerWidthPixels,
    markerHeightPixels
  };
}
