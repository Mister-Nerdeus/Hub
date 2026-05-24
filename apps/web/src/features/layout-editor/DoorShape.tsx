import type { DoorShapeViewModel } from "./doorShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type DoorShapeProps = {
  viewModel: DoorShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "door", objectId: string) => void;
};

export function DoorShape({ viewModel, isSelected = false, onSelect }: DoorShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__door", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-door-wall={viewModel.wall}
      role="img"
      aria-label={viewModel.ariaLabel}
      onClick={() => onSelect?.("door", viewModel.objectId)}
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
