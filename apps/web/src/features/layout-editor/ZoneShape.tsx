import type { ZoneShapeViewModel } from "./hallwayZoneShapeViewModel";

type ZoneShapeProps = {
  viewModel: ZoneShapeViewModel;
};

export function ZoneShape({ viewModel }: ZoneShapeProps) {
  return (
    <g
      className={`layout-editor-stage__zone layout-editor-stage__zone--${viewModel.zoneType}`}
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
