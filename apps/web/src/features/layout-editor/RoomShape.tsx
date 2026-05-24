import type { RoomShapeViewModel } from "./roomShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type RoomShapeProps = {
  viewModel: RoomShapeViewModel;
  isSelected?: boolean;
};

export function RoomShape({ viewModel, isSelected = false }: RoomShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__room", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-room-type={viewModel.roomType}
      role="img"
      aria-label={viewModel.ariaLabel}
    >
      <rect
        x={viewModel.xPixels}
        y={viewModel.yPixels}
        width={viewModel.widthPixels}
        height={viewModel.heightPixels}
      />
      <text x={viewModel.labelX} y={viewModel.labelY}>{viewModel.roomNumber}</text>
    </g>
  );
}
