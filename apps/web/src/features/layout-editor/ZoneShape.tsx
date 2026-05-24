import type { ZoneShapeViewModel } from "./hallwayZoneShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type ZoneShapeProps = {
  viewModel: ZoneShapeViewModel;
  isSelected?: boolean;
};

export function ZoneShape({ viewModel, isSelected = false }: ZoneShapeProps) {
  return (
    <g
      className={`${selectedClassName("layout-editor-stage__zone", isSelected)} layout-editor-stage__zone--${viewModel.zoneType}`}
      data-hit-target-key={viewModel.hitTargetKey}
      data-zone-type={viewModel.zoneType}
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
