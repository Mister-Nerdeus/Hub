import type { LayoutValidationPanelViewModel } from "./layoutValidationPanelViewModel";

export type LayoutValidationPanelProps = {
  viewModel: LayoutValidationPanelViewModel;
};

export function LayoutValidationPanel({ viewModel }: LayoutValidationPanelProps) {
  return (
    <aside className="layout-validation-panel" aria-label={viewModel.title} aria-readonly="true">
      <header className="layout-validation-panel__header">
        <p className="eyebrow">Validation</p>
        <h3>{viewModel.title}</h3>
        <span>{viewModel.warningCount}</span>
      </header>

      {viewModel.status === "empty" ? (
        <p className="layout-validation-panel__empty">{viewModel.emptyMessage}</p>
      ) : (
        <ol className="layout-validation-panel__list">
          {viewModel.warnings.map((warning) => (
            <li
              key={[
                warning.code,
                warning.objectType,
                warning.objectId,
                warning.relatedObjectType,
                warning.relatedObjectId
              ].join(":")}
            >
              <code>{warning.code}</code>
              <p>{warning.message}</p>
              <dl>
                <div>
                  <dt>Object</dt>
                  <dd>{formatObjectReference(warning.objectType, warning.objectId)}</dd>
                </div>
                <div>
                  <dt>Related</dt>
                  <dd>{formatObjectReference(warning.relatedObjectType, warning.relatedObjectId)}</dd>
                </div>
                <div>
                  <dt>Count</dt>
                  <dd>{warning.duplicateCount}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function formatObjectReference(
  objectType: string | null,
  objectId: string | null
): string {
  if (objectType == null || objectId == null) {
    return "none";
  }
  return `${objectType}:${objectId}`;
}
