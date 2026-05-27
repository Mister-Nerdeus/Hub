import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import {
  buildCurvedDeskPresentationPath,
  createStationLabelPlate,
  stationPresentationStyleForType,
  type StationLabelPlateViewModel,
  type StationPresentationStyle
} from "./stationPresentationStyle";

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
  presentationStyle: StationPresentationStyle;
  presentationPath: string;
  labelPlate: StationLabelPlateViewModel;
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
  const presentationStyle = stationPresentationStyleForType(source.stationType);
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
    labelY: yPixels + heightPixels / 2,
    presentationStyle,
    presentationPath: buildCurvedDeskPresentationPath({ xPixels, yPixels, widthPixels, heightPixels }),
    labelPlate: createStationLabelPlate({
      xPixels,
      yPixels,
      widthPixels,
      heightPixels,
      label: presentationStyle === "curved_desk" ? "Nurses station" : source.label
    })
  };
}
