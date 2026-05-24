import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type StationShapeViewModel = {
  objectType: "station";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  stationType: string;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
  labelX: number;
  labelY: number;
};

export function buildStationShapeViewModel(item: LayoutObjectRenderItem): StationShapeViewModel {
  if (item.objectType !== "station") {
    throw new Error("station shape view model requires a station render item");
  }
  const source = item.sourceGeometry;
  if (source.objectType !== "station") {
    throw new Error("station render item requires station source geometry");
  }
  const { xPixels, yPixels, widthPixels, heightPixels } = item.displayRectPixels;
  return {
    objectType: "station",
    objectId: item.objectId,
    ariaLabel: item.ariaLabel,
    hitTargetKey: item.hitTargetKey,
    label: source.label,
    stationType: source.stationType,
    xPixels,
    yPixels,
    widthPixels,
    heightPixels,
    labelX: xPixels + widthPixels / 2,
    labelY: yPixels + heightPixels / 2
  };
}
