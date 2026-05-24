import type { StationShapeViewModel } from "./stationShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type StationShapeProps = {
  viewModel: StationShapeViewModel;
  isSelected?: boolean;
};

export function StationShape({ viewModel, isSelected = false }: StationShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__station", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-station-type={viewModel.stationType}
      role="img"
      aria-label={viewModel.ariaLabel}
    >
      <rect
        x={viewModel.xPixels}
        y={viewModel.yPixels}
        width={viewModel.widthPixels}
        height={viewModel.heightPixels}
      />
      <text x={viewModel.labelX} y={viewModel.labelY}>{viewModel.label}</text>
    </g>
  );
}
