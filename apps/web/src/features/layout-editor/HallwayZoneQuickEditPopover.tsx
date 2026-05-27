import type { EditableZoneType } from "@nerdeus/shared";
import type { HallwayZoneQuickEditViewModel } from "./hallwayZoneQuickEditViewModel";

export type HallwayZoneQuickEditPopoverProps = {
  viewModel: HallwayZoneQuickEditViewModel;
  onLabelChange: (label: string) => void;
  onZoneTypeChange: (zoneType: EditableZoneType) => void;
  onTogglePresentationVisibility: () => void;
};

const ZONE_TYPES: readonly EditableZoneType[] = ["ems_entry", "trauma", "provider_pharmacy"];

export function HallwayZoneQuickEditPopover({
  viewModel,
  onLabelChange,
  onZoneTypeChange,
  onTogglePresentationVisibility
}: HallwayZoneQuickEditPopoverProps) {
  if (viewModel.status === "missing") {
    return <p>No hallway or zone selected.</p>;
  }
  return (
    <div className="hallway-zone-quick-edit-popover" data-hallway-zone-quick-edit={viewModel.status}>
      <label>
        {viewModel.status === "hallway" ? "Hallway label" : "Zone label"}
        <input
          value={viewModel.label}
          readOnly={viewModel.readOnly}
          onChange={(event) => onLabelChange(event.currentTarget.value)}
        />
      </label>
      {viewModel.status === "zone" && viewModel.zoneType != null ? (
        <label>
          Zone type
          <select
            value={viewModel.zoneType}
            disabled={viewModel.readOnly}
            onChange={(event) => onZoneTypeChange(event.currentTarget.value as EditableZoneType)}
          >
            {ZONE_TYPES.map((zoneType) => (
              <option key={zoneType} value={zoneType}>
                {zoneType}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <dl>
        <div>
          <dt>Arrow direction hint</dt>
          <dd>{viewModel.arrowDirectionHint}</dd>
        </div>
        <div>
          <dt>Presentation visibility</dt>
          <dd>{viewModel.presentationVisible ? "visible" : "hidden"}</dd>
        </div>
        <div>
          <dt>Validation status</dt>
          <dd>{viewModel.validationStatus}</dd>
        </div>
      </dl>
      <button type="button" disabled={viewModel.readOnly} onClick={onTogglePresentationVisibility}>
        Toggle presentation visibility
      </button>
    </div>
  );
}
