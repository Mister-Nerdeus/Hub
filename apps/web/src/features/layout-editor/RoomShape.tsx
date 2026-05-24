import type { RoomShapeViewModel } from "./roomShapeViewModel";

type RoomShapeProps = {
  viewModel: RoomShapeViewModel;
};

export function RoomShape({ viewModel }: RoomShapeProps) {
  return (
    <g
      className="layout-editor-stage__room"
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
