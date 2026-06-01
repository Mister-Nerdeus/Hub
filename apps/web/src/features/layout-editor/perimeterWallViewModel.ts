import type { PerimeterWallContract } from "@nerdeus/shared";

import {
  rectFeetToPixels,
  type LayoutViewportTransform
} from "./layoutCoordinateSystem";
import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type PerimeterWallViewModel = {
  objectId: string;
  label: string;
  locked: boolean;
  blocksTravel: true;
  ariaLabel: string;
  segments: Array<{
    segmentId: string;
    label: string;
    xPixels: number;
    yPixels: number;
    widthPixels: number;
    heightPixels: number;
    orientation: "horizontal" | "vertical";
    locked: boolean;
  }>;
};

export function buildPerimeterWallViewModel(
  item: LayoutObjectRenderItem,
  viewport: LayoutViewportTransform
): PerimeterWallViewModel {
  const wall = item.sourceGeometry as PerimeterWallContract;
  return {
    objectId: wall.perimeterWallId,
    label: wall.label,
    locked: wall.segments.every((segment) => segment.locked),
    blocksTravel: true,
    ariaLabel: `${wall.label} perimeter wall`,
    segments: wall.segments.map((segment) => {
      const rect = rectFeetToPixels(segment, viewport);
      return {
        segmentId: segment.segmentId,
        label: segment.label,
        xPixels: rect.xPixels,
        yPixels: rect.yPixels,
        widthPixels: rect.widthPixels,
        heightPixels: rect.heightPixels,
        orientation: segment.orientation,
        locked: segment.locked
      };
    })
  };
}
