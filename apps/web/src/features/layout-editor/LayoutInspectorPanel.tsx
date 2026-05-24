import type {
  LayoutInspectorField,
  LayoutInspectorViewModel
} from "./layoutInspectorViewModel";
import type { RoomInspectorDimensionChanges } from "./roomInspectorDimensionEdit";

export type LayoutInspectorPanelProps = {
  viewModel: LayoutInspectorViewModel;
  onEditRoomDimensions?: (changes: RoomInspectorDimensionChanges) => void;
};

export function LayoutInspectorPanel({
  viewModel,
  onEditRoomDimensions
}: LayoutInspectorPanelProps) {
  return (
    <aside
      className="layout-inspector-panel"
      aria-label="Layout inspector"
      aria-readonly={viewModel.isReadOnly}
    >
      <header className="layout-inspector-panel__header">
        <p className="eyebrow">Inspector</p>
        <h3>{viewModel.title}</h3>
      </header>

      <dl className="layout-inspector-panel__identity">
        <div>
          <dt>Object type</dt>
          <dd>{viewModel.objectType ?? "none"}</dd>
        </div>
        <div>
          <dt>Object ID</dt>
          <dd>{viewModel.objectId ?? "none"}</dd>
        </div>
        <div>
          <dt>Source units</dt>
          <dd>{viewModel.sourceUnits}</dd>
        </div>
      </dl>

      {viewModel.status === "selected" ? (
        <div className="layout-inspector-panel__sections">
          {viewModel.sections.map((section) => (
            <section key={section.title} className="layout-inspector-panel__section">
              <h4>{section.title}</h4>
              <dl>
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <dt>{field.label}</dt>
                    <dd>{renderInspectorFieldValue(field, onEditRoomDimensions)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <p className="layout-inspector-panel__empty">{viewModel.title}</p>
      )}
    </aside>
  );
}

function renderInspectorFieldValue(
  field: LayoutInspectorField,
  onEditRoomDimensions: LayoutInspectorPanelProps["onEditRoomDimensions"]
) {
  if (field.editKey == null || field.valueFeet == null || onEditRoomDimensions == null) {
    return field.value;
  }

  const editKey = field.editKey;
  return (
    <input
      aria-label={`${field.label} feet`}
      type="number"
      step="0.5"
      value={field.valueFeet}
      onChange={(event) => {
        const nextValue = Number(event.currentTarget.value);
        if (Number.isFinite(nextValue)) {
          onEditRoomDimensions({ [editKey]: nextValue });
        }
      }}
    />
  );
}
