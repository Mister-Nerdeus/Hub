import type { HallwayShapeViewModel } from "./hallwayZoneShapeViewModel";

type HallwayShapeProps = {
  viewModel: HallwayShapeViewModel;
};

export function HallwayShape({ viewModel }: HallwayShapeProps) {
  return (
    <g
      className="layout-editor-stage__hallway"
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
