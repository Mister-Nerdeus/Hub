export type WallShapeViewModel = {
  wallId: string;
  kind: "outer_wall" | "solid_wall" | "partition_wall" | "blocked_boundary";
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
  editable: boolean;
  blocksTravel: boolean;
  ariaLabel: string;
};

type WallShapeProps = {
  viewModel: WallShapeViewModel;
};

export function WallShape({ viewModel }: WallShapeProps) {
  return (
    <g
      className={`layout-editor-stage__wall layout-editor-stage__wall--${viewModel.kind}`}
      data-layout-object-type={viewModel.kind}
      data-layout-object-id={viewModel.wallId}
      data-geometry-kind={viewModel.kind}
      data-geometry-layer={viewModel.editable ? "editable_geometry" : "locked_geometry"}
      data-geometry-source-id={viewModel.wallId}
      data-render-source-kind={viewModel.editable ? "editable" : "locked"}
      data-selectable="true"
      data-editable={viewModel.editable ? "true" : "false"}
      data-removable={viewModel.editable ? "true" : "false"}
      data-blocks-travel={viewModel.blocksTravel ? "true" : "false"}
      data-wall-renderer="first-class-geometry"
      data-locked-reason={viewModel.editable ? undefined : "Outer wall is locked boundary geometry."}
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
    >
      <rect
        x={viewModel.xPixels}
        y={viewModel.yPixels}
        width={viewModel.widthPixels}
        height={viewModel.heightPixels}
        rx="0"
      />
    </g>
  );
}
