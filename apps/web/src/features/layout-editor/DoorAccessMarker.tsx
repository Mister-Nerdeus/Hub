import type { DoorShapeViewModel } from "./doorShapeViewModel";

type DoorAccessMarkerProps = {
  viewModel: DoorShapeViewModel;
};

export function DoorAccessMarker({ viewModel }: DoorAccessMarkerProps) {
  const rx = Math.min(viewModel.markerWidthPixels, viewModel.markerHeightPixels) / 2;
  return (
    <>
      <rect
        className="layout-editor-stage__door-hit-target"
        x={viewModel.xPixels - viewModel.hitSlopPixels}
        y={viewModel.yPixels - viewModel.hitSlopPixels}
        width={viewModel.widthPixels + viewModel.hitSlopPixels * 2}
        height={viewModel.heightPixels + viewModel.hitSlopPixels * 2}
        rx="2"
      />
      <rect
        className="layout-editor-stage__door-marker-capsule"
        data-door-marker-shape="capsule"
        data-door-orientation={viewModel.orientation}
        data-door-invalid={viewModel.invalid ? "true" : "false"}
        x={viewModel.markerX}
        y={viewModel.markerY}
        width={viewModel.markerWidthPixels}
        height={viewModel.markerHeightPixels}
        rx={rx}
      />
    </>
  );
}
