import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type HallwayShapeViewModel = {
  objectType: "hallway";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
  labelX: number;
  labelY: number;
};

export type ZoneShapeViewModel = {
  objectType: "zone";
  objectId: string;
  ariaLabel: string;
  hitTargetKey: string;
  label: string;
  zoneType: string;
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
  labelX: number;
  labelY: number;
};

export function buildHallwayShapeViewModel(
  item: LayoutObjectRenderItem
): HallwayShapeViewModel {
  if (item.objectType !== "hallway") {
    throw new Error("hallway shape view model requires a hallway render item");
  }
  return {
    objectType: "hallway",
    objectId: item.objectId,
    ariaLabel: item.ariaLabel,
    hitTargetKey: item.hitTargetKey,
    label: String(item.sourceGeometry.label),
    ...rectFields(item)
  };
}

export function buildZoneShapeViewModel(
  item: LayoutObjectRenderItem
): ZoneShapeViewModel {
  if (item.objectType !== "zone") {
    throw new Error("zone shape view model requires a zone render item");
  }
  const source = item.sourceGeometry;
  if (source.objectType !== "zone") {
    throw new Error("zone render item requires zone source geometry");
  }
  return {
    objectType: "zone",
    objectId: item.objectId,
    ariaLabel: item.ariaLabel,
    hitTargetKey: item.hitTargetKey,
    label: source.label,
    zoneType: source.zoneType,
    ...rectFields(item)
  };
}

function rectFields(item: LayoutObjectRenderItem) {
  const { xPixels, yPixels, widthPixels, heightPixels } = item.displayRectPixels;
  return {
    xPixels,
    yPixels,
    widthPixels,
    heightPixels,
    labelX: xPixels + 8,
    labelY: yPixels + 16
  };
}
