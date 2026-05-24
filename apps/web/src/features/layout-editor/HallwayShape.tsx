import type { HallwayShapeViewModel } from "./hallwayZoneShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type HallwayShapeProps = {
  viewModel: HallwayShapeViewModel;
  isSelected?: boolean;
};

export function HallwayShape({ viewModel, isSelected = false }: HallwayShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__hallway", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
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
