import type { DoorWallGuideViewModel } from "./doorWallGuideViewModel";

export function DoorWallGuideOverlay({
  viewModel
}: {
  viewModel: DoorWallGuideViewModel;
}) {
  if (viewModel.status !== "ready") {
    return null;
  }
  const scale = viewModel.wallLengthFeet <= 0 ? 1 : 120 / viewModel.wallLengthFeet;
  return (
    <g
      className="layout-editor-stage__door-wall-guide"
      aria-label="Door wall snap guide"
      data-door-wall-guide={viewModel.doorId}
    >
      <line x1="8" y1="18" x2="128" y2="18" />
      <line x1={8 + viewModel.centerOffsetFeet * scale} y1="8" x2={8 + viewModel.centerOffsetFeet * scale} y2="28" />
      <circle cx={8 + viewModel.currentOffsetFeet * scale} cy="18" r="4" />
      {viewModel.markers.map((marker) => (
        <line
          key={marker.offsetFeet}
          className="layout-editor-stage__door-wall-guide-marker"
          x1={8 + marker.offsetFeet * scale}
          y1="13"
          x2={8 + marker.offsetFeet * scale}
          y2="23"
        />
      ))}
    </g>
  );
}
