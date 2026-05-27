import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";

export type HallwayArrowViewModel = {
  id: string;
  hallwayId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  visible: boolean;
  reversed: boolean;
};

export function buildHallwayArrowViewModels(
  items: LayoutObjectRenderItem[],
  state: Record<string, { visible?: boolean; reversed?: boolean }> = {}
): HallwayArrowViewModel[] {
  return items
    .filter((item) => item.objectType === "hallway")
    .map((item) => {
      const rect = item.displayRectPixels;
      const horizontal = rect.widthPixels >= rect.heightPixels;
      const padding = 18;
      const x1 = rect.xPixels + padding;
      const y1 = rect.yPixels + rect.heightPixels / 2;
      const x2 = horizontal ? rect.xPixels + rect.widthPixels - padding : rect.xPixels + rect.widthPixels / 2;
      const y2 = horizontal ? rect.yPixels + rect.heightPixels / 2 : rect.yPixels + rect.heightPixels - padding;
      const arrowState = state[item.objectId] ?? {};
      const reversed = arrowState.reversed === true;
      return {
        id: `arrow-${item.objectId}`,
        hallwayId: item.objectId,
        x1: reversed ? x2 : x1,
        y1: reversed ? y2 : y1,
        x2: reversed ? x1 : x2,
        y2: reversed ? y1 : y2,
        visible: arrowState.visible !== false,
        reversed
      };
    });
}
