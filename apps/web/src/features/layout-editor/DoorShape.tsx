import type { DoorShapeViewModel } from "./doorShapeViewModel";

type DoorShapeProps = {
  viewModel: DoorShapeViewModel;
};

export function DoorShape({ viewModel }: DoorShapeProps) {
  return (
    <g
      className="layout-editor-stage__door"
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
