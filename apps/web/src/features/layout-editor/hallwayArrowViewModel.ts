import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type HallwayArrowViewModel = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function buildHallwayArrowViewModels(items: LayoutObjectRenderItem[]): HallwayArrowViewModel[] {
  return items
    .filter((item) => item.objectType === "hallway")
    .map((item) => {
      const rect = item.displayRectPixels;
      const horizontal = rect.widthPixels >= rect.heightPixels;
      const padding = 18;
      return {
        id: `arrow-${item.objectId}`,
        x1: rect.xPixels + padding,
        y1: rect.yPixels + rect.heightPixels / 2,
        x2: horizontal ? rect.xPixels + rect.widthPixels - padding : rect.xPixels + rect.widthPixels / 2,
        y2: horizontal ? rect.yPixels + rect.heightPixels / 2 : rect.yPixels + rect.heightPixels - padding
      };
    });
}
