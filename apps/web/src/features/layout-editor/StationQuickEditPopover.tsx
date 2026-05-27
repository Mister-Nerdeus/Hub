import type { EditableStationType } from "@nerdeus/shared";
import type { StationQuickEditViewModel } from "./stationQuickEditViewModel";

export type StationQuickEditPopoverProps = {
  viewModel: StationQuickEditViewModel;
  onStationTypeChange: (stationType: EditableStationType) => void;
  onPresentationStyle: () => void;
  onMoveResize: () => void;
};

const STATION_TYPES: readonly EditableStationType[] = ["nurse_station", "desk"];

export function StationQuickEditPopover({
  viewModel,
  onStationTypeChange,
  onPresentationStyle,
  onMoveResize
}: StationQuickEditPopoverProps) {
  if (viewModel.status !== "ready" || viewModel.stationType == null) {
    return <p>No station selected.</p>;
  }
  return (
    <div className="station-quick-edit-popover" data-station-quick-edit="ready">
      <label>
        Station label
        <input value={viewModel.label} readOnly />
      </label>
      <label>
        Station type
        <select
          value={viewModel.stationType}
          disabled={viewModel.readOnly}
          onChange={(event) => onStationTypeChange(event.currentTarget.value as EditableStationType)}
        >
          {STATION_TYPES.map((stationType) => (
            <option key={stationType} value={stationType}>
              {stationType}
            </option>
          ))}
        </select>
      </label>
      <div className="station-quick-edit-popover__actions">
        <button type="button" onClick={onPresentationStyle}>
          Presentation style: {viewModel.presentationStyle}
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={onMoveResize}>
          Move / resize
        </button>
      </div>
      <p>Associated nurse group: optional synthetic group only.</p>
    </div>
  );
}
