import type { StationShapeViewModel } from "./stationShapeViewModel";

type StationShapeProps = {
  viewModel: StationShapeViewModel;
};

export function StationShape({ viewModel }: StationShapeProps) {
  return (
    <g
      className="layout-editor-stage__station"
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
