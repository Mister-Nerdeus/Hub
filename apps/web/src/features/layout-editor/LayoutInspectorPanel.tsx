import type {
  LayoutInspectorField,
  LayoutInspectorViewModel
} from "./layoutInspectorViewModel";
import type {
  RoomInspectorDimensionDraftState
} from "./roomInspectorDimensionDraft";
import type { RoomInspectorDimensionField } from "./roomInspectorDimensionEdit";

export type LayoutInspectorPanelProps = {
  viewModel: LayoutInspectorViewModel;
  roomDimensionDraft?: RoomInspectorDimensionDraftState;
  onChangeRoomDimensionDraft?: (field: RoomInspectorDimensionField, value: string) => void;
  onCommitRoomDimensionDraft?: (field: RoomInspectorDimensionField) => void;
  onCancelRoomDimensionDraft?: (field: RoomInspectorDimensionField) => void;
};

export function LayoutInspectorPanel({
  viewModel,
  roomDimensionDraft,
  onChangeRoomDimensionDraft,
  onCommitRoomDimensionDraft,
  onCancelRoomDimensionDraft
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
          <dt>Selection type</dt>
          <dd>{viewModel.objectType ?? "none"}</dd>
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
                    <dd>
                      {renderInspectorFieldValue({
                        field,
                        roomDimensionDraft,
                        onChangeRoomDimensionDraft,
                        onCommitRoomDimensionDraft,
                        onCancelRoomDimensionDraft
                      })}
                    </dd>
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

function renderInspectorFieldValue({
  field,
  roomDimensionDraft,
  onChangeRoomDimensionDraft,
  onCommitRoomDimensionDraft,
  onCancelRoomDimensionDraft
}: {
  field: LayoutInspectorField;
  roomDimensionDraft: LayoutInspectorPanelProps["roomDimensionDraft"];
  onChangeRoomDimensionDraft: LayoutInspectorPanelProps["onChangeRoomDimensionDraft"];
  onCommitRoomDimensionDraft: LayoutInspectorPanelProps["onCommitRoomDimensionDraft"];
  onCancelRoomDimensionDraft: LayoutInspectorPanelProps["onCancelRoomDimensionDraft"];
}) {
  if (
    field.editKey == null ||
    field.valueFeet == null ||
    roomDimensionDraft == null ||
    onChangeRoomDimensionDraft == null ||
    onCommitRoomDimensionDraft == null ||
    onCancelRoomDimensionDraft == null
  ) {
    return field.value;
  }

  const editKey = field.editKey;
  const draftField = roomDimensionDraft.fields[editKey];
  const draftValue = draftField?.value ?? String(field.valueFeet);
  const error = draftField?.error ?? null;
  return (
    <>
      <input
        aria-label={`${field.label} feet`}
        aria-invalid={error == null ? "false" : "true"}
        type="text"
        inputMode="decimal"
        value={draftValue}
        onChange={(event) => onChangeRoomDimensionDraft(editKey, event.currentTarget.value)}
        onBlur={() => onCommitRoomDimensionDraft(editKey)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommitRoomDimensionDraft(editKey);
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onCancelRoomDimensionDraft(editKey);
          }
        }}
      />
      {error == null ? null : (
        <span className="layout-inspector-panel__field-error" role="status">
          {error}
        </span>
      )}
    </>
  );
}
