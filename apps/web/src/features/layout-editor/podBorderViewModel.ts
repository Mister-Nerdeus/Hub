import { generateAutoPodBorder, type AutoPodBorder, type EditableLayoutGeometryContract } from "@nerdeus/shared";
import { rectFeetToPixels, type LayoutViewportTransform } from "./layoutCoordinateSystem";

export type PodBorderViewModel = AutoPodBorder & {
  rectPixels: ReturnType<typeof rectFeetToPixels>;
};

export function buildPodBorderViewModel(input: {
  layout: EditableLayoutGeometryContract | null;
  sourcePlanId: string;
  viewport: LayoutViewportTransform;
}): PodBorderViewModel | null {
  if (input.layout == null) {
    return null;
  }
  const border = generateAutoPodBorder({
    layout: input.layout,
    sourcePlanId: input.sourcePlanId,
    paddingFeet: 4
  });
  return {
    ...border,
    rectPixels: rectFeetToPixels(border.boundsFeet, input.viewport)
  };
}
