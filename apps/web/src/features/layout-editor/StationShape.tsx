import type { StationShapeViewModel } from "./stationShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type StationShapeProps = {
  viewModel: StationShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "station", objectId: string) => void;
};

export function StationShape({ viewModel, isSelected = false, onSelect }: StationShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__station", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-station-type={viewModel.stationType}
      role="img"
      aria-label={viewModel.ariaLabel}
      onClick={() => onSelect?.("station", viewModel.objectId)}
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
