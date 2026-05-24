import type { DoorShapeViewModel } from "./doorShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type DoorShapeProps = {
  viewModel: DoorShapeViewModel;
  isSelected?: boolean;
};

export function DoorShape({ viewModel, isSelected = false }: DoorShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__door", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-door-wall={viewModel.wall}
      role="img"
      aria-label={viewModel.ariaLabel}
    >
      <rect
        x={viewModel.xPixels}
        y={viewModel.yPixels}
        width={viewModel.widthPixels}
        height={viewModel.heightPixels}
      />
    </g>
  );
}
