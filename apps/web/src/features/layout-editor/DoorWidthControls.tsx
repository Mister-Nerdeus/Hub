import type { DoorWidthControlsViewModel } from "./doorWidthControlsViewModel";

export type DoorWidthControlsProps = {
  viewModel: DoorWidthControlsViewModel;
  onDecrease: () => void;
  onIncrease: () => void;
  onPreset: (widthFeet: number) => void;
};

export function DoorWidthControls({
  viewModel,
  onDecrease,
  onIncrease,
  onPreset
}: DoorWidthControlsProps) {
  return (
    <div className="door-width-controls" data-door-width-controls={viewModel.status}>
      <strong>Width</strong>
      <span>{viewModel.widthFeet == null ? "No door" : `${viewModel.widthFeet} ft`}</span>
      <button type="button" disabled={viewModel.readOnly || viewModel.status !== "ready"} onClick={onDecrease}>
        Width -
      </button>
      <button type="button" disabled={viewModel.readOnly || viewModel.status !== "ready"} onClick={onIncrease}>
        Width +
      </button>
      {viewModel.presetsFeet.map((widthFeet) => (
        <button
          key={widthFeet}
          type="button"
          disabled={viewModel.readOnly || viewModel.status !== "ready"}
          onClick={() => onPreset(widthFeet)}
        >
          {widthFeet} ft
        </button>
      ))}
      <span>{viewModel.orientationLabel}</span>
    </div>
  );
}
