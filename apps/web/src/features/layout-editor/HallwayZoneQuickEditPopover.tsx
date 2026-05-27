import type { EditableZoneType } from "@nerdeus/shared";
import type { HallwayZoneQuickEditViewModel } from "./hallwayZoneQuickEditViewModel";

export type HallwayZoneQuickEditPopoverProps = {
  viewModel: HallwayZoneQuickEditViewModel;
  onLabelChange: (label: string) => void;
  onZoneTypeChange: (zoneType: EditableZoneType) => void;
  onTogglePresentationVisibility: () => void;
  onReverseArrow?: () => void;
  onHideArrow?: () => void;
  onShowArrow?: () => void;
};

const ZONE_TYPES: readonly EditableZoneType[] = ["ems_entry", "trauma", "provider_pharmacy"];

export function HallwayZoneQuickEditPopover({
  viewModel,
  onLabelChange,
  onZoneTypeChange,
  onTogglePresentationVisibility,
  onReverseArrow,
  onHideArrow,
  onShowArrow
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
          onChange={(event) => {
            if (event.currentTarget.value.trim().length > 0) {
              onLabelChange(event.currentTarget.value);
            }
          }}
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
      {viewModel.status === "hallway" ? (
        <div className="hallway-zone-quick-edit-popover__actions">
          <button type="button" disabled={viewModel.readOnly} onClick={onReverseArrow}>
            Reverse arrow
          </button>
          <button type="button" disabled={viewModel.readOnly} onClick={onHideArrow}>
            Hide arrow
          </button>
          <button type="button" disabled={viewModel.readOnly} onClick={onShowArrow}>
            Show arrow
          </button>
          <p>Arrows are presentation hints only.</p>
        </div>
      ) : (
        <p>Support markers are operational presentation labels only.</p>
      )}
    </div>
  );
}
