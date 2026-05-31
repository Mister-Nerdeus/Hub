import type { EditableHallwayGeometry } from "@nerdeus/shared";
import type { RoomInspectorDimensionField, RoomInspectorDimensionChanges } from "./roomInspectorDimensionEdit";
import type { LayoutInspectorViewModel } from "./layoutInspectorViewModel";

type HallwayInspectorPanelProps = {
  hallway: EditableHallwayGeometry | null;
  viewModel: LayoutInspectorViewModel;
  readOnly: boolean;
  onLabelChange: (label: string) => void;
  onDimensionChange: (changes: RoomInspectorDimensionChanges) => void;
};

const DIMENSION_FIELDS: readonly { field: RoomInspectorDimensionField; label: string }[] = [
  { field: "xFeet", label: "X" },
  { field: "yFeet", label: "Y" },
  { field: "widthFeet", label: "Width" },
  { field: "heightFeet", label: "Height" }
];

export function HallwayInspectorPanel({
  hallway,
  viewModel,
  readOnly,
  onLabelChange,
  onDimensionChange
}: HallwayInspectorPanelProps) {
  if (hallway == null || viewModel.objectType !== "hallway") {
    return (
      <aside className="hallway-inspector-panel" aria-label="Hallway inspector">
        <p>Select a hallway to edit hallway geometry.</p>
      </aside>
    );
  }

  return (
    <aside
      className="hallway-inspector-panel"
      aria-label="Hallway inspector"
      data-hallway-inspector-controls="normal"
      data-advanced-ids-hidden="true"
    >
      <header>
        <p className="eyebrow">Hallway</p>
        <h3>{hallway.label}</h3>
      </header>
      <label>
        Hallway label
        <input
          aria-label="Hallway label"
          type="text"
          value={hallway.label}
          disabled={readOnly}
          onChange={(event) => onLabelChange(event.currentTarget.value)}
        />
      </label>
      <fieldset>
        <legend>Dimensions</legend>
        {DIMENSION_FIELDS.map(({ field, label }) => (
          <label key={field}>
            {label}
            <input
              aria-label={`${label} feet`}
              type="number"
              inputMode="decimal"
              step="0.5"
              min={field === "widthFeet" || field === "heightFeet" ? 1 : undefined}
              value={hallway[field]}
              disabled={readOnly}
              onChange={(event) => {
                const value = Number(event.currentTarget.value);
                if (Number.isFinite(value)) {
                  onDimensionChange({ [field]: value });
                }
              }}
            />
          </label>
        ))}
      </fieldset>
    </aside>
  );
}
