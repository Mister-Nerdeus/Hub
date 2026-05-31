import {
  buildLayoutValidationPanelWarningKey,
  type LayoutValidationPanelViewModel
} from "./layoutValidationPanelViewModel";

export type LayoutValidationPanelProps = {
  viewModel: LayoutValidationPanelViewModel;
  maxVisibleWarnings?: number;
};

export function LayoutValidationPanel({ viewModel, maxVisibleWarnings }: LayoutValidationPanelProps) {
  const visibleWarnings = maxVisibleWarnings == null
    ? viewModel.warnings
    : viewModel.warnings.slice(0, maxVisibleWarnings);
  const hiddenWarningCount = viewModel.warnings.length - visibleWarnings.length;

  return (
    <aside
      className="layout-validation-panel"
      aria-label={viewModel.title}
      aria-readonly="true"
      data-validation-panel={maxVisibleWarnings == null ? "full" : "summary"}
      data-split-room-validation="parent-bed-model"
      data-geometry-truth-validation-panel="detailed"
    >
      <header className="layout-validation-panel__header">
        <p className="eyebrow">Validation</p>
        <h3>{viewModel.title}</h3>
        <span>{viewModel.warningCount}</span>
      </header>

      {viewModel.status === "empty" ? (
        <p className="layout-validation-panel__empty">{viewModel.emptyMessage}</p>
      ) : (
        <ol className="layout-validation-panel__list">
          {visibleWarnings.map((warning) => (
            <li key={buildLayoutValidationPanelWarningKey(warning)}>
              <code>{warning.code}</code>
              <p>{warning.message}</p>
              <dl className="layout-validation-panel__metadata">
                <div>
                  <dt>Severity</dt>
                  <dd>{warning.severityLabel}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{warning.sourceLabel}</dd>
                </div>
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
      {hiddenWarningCount > 0 ? (
        <p className="layout-validation-panel__drawer-hint">
          {hiddenWarningCount} more in the validation drawer.
        </p>
      ) : null}
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
