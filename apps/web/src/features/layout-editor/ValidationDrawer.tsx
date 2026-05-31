import type { ValidationDrawerViewModel } from "./validationDrawerViewModel";
import { GroupedValidationPanel } from "./GroupedValidationPanel";
import { buildGroupedValidationViewModel } from "./groupedValidationViewModel";

export type ValidationDrawerProps = {
  viewModel: ValidationDrawerViewModel;
};

export function ValidationDrawer({ viewModel }: ValidationDrawerProps) {
  const groupedValidationViewModel = buildGroupedValidationViewModel(viewModel.groups.flatMap((group) => group.warnings));
  return (
    <section
      className="validation-drawer"
      aria-label="Validation drawer"
      data-validation-drawer="compact-bottom"
      data-warning-count={viewModel.warningCount}
    >
      <details data-validation-details-collapsed-by-default="true">
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
            <GroupedValidationPanel viewModel={groupedValidationViewModel} />
          </div>
        )}
      </details>
    </section>
  );
}
