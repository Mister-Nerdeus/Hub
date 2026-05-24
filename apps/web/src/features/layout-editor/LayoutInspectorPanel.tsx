import type { LayoutInspectorViewModel } from "./layoutInspectorViewModel";

export type LayoutInspectorPanelProps = {
  viewModel: LayoutInspectorViewModel;
};

export function LayoutInspectorPanel({ viewModel }: LayoutInspectorPanelProps) {
  return (
    <aside className="layout-inspector-panel" aria-label="Layout inspector" aria-readonly="true">
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
                    <dd>{field.value}</dd>
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
