import type { ValidationDrawerViewModel } from "./validationDrawerViewModel";

export type ValidationDrawerProps = {
  viewModel: ValidationDrawerViewModel;
};

export function ValidationDrawer({ viewModel }: ValidationDrawerProps) {
  return (
    <section
      className="validation-drawer"
      aria-label="Validation drawer"
      data-validation-drawer="compact-bottom"
      data-warning-count={viewModel.warningCount}
    >
      <details>
        <summary>
          <span>Validation</span>
          <strong>{viewModel.warningCount}</strong>
          <span>{viewModel.warningCount === 1 ? "warning" : "warnings"}</span>
        </summary>
        {viewModel.status === "empty" ? (
          <p className="validation-drawer__empty">No layout warnings.</p>
        ) : (
          <div className="validation-drawer__body">
            <div className="validation-drawer__summary" aria-label="Top validation warnings">
              {viewModel.summaryWarnings.map((warning) => (
                <article key={`${warning.code}-${warning.objectId ?? "none"}`}>
                  <code>{warning.code}</code>
                  <p>{warning.message}</p>
                </article>
              ))}
            </div>
            <div className="validation-drawer__groups" aria-label="Grouped validation warnings">
              {viewModel.groups.map((group) => (
                <section key={group.key}>
                  <h4>
                    {group.sourceLabel} / {group.objectLabel} ({group.warningCount})
                  </h4>
                  <ol>
                    {group.warnings.map((warning) => (
                      <li key={`${warning.code}-${warning.message}`}>
                        <code>{warning.code}</code>
                        <span>{warning.message}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </div>
        )}
      </details>
    </section>
  );
}
