import { rectFeetToPixels, type LayoutViewportTransform } from "./layoutCoordinateSystem";
import type { ObjectPlacementPreviewViewModel } from "./clickToPlaceObject";

export type ObjectPlacementPreviewProps = {
  viewModel: ObjectPlacementPreviewViewModel;
  viewport: LayoutViewportTransform;
};

export function ObjectPlacementPreview({ viewModel, viewport }: ObjectPlacementPreviewProps) {
  const rect = rectFeetToPixels(
    {
      xFeet: viewModel.xFeet,
      yFeet: viewModel.yFeet,
      widthFeet: viewModel.widthFeet,
      heightFeet: viewModel.heightFeet
    },
    viewport
  );
  return (
    <g
      className="object-placement-preview"
      data-object-placement-preview="ready"
      data-object-placement-type={viewModel.objectType}
      aria-label={`${viewModel.label} placement preview`}
    >
      <rect
        x={rect.xPixels}
        y={rect.yPixels}
        width={rect.widthPixels}
        height={rect.heightPixels}
        rx="4"
      />
      <text x={rect.xPixels + 8} y={rect.yPixels + 18}>
        {viewModel.label}
      </text>
    </g>
  );
}
