import type { GroupedValidationViewModel } from "./groupedValidationViewModel";

export function GroupedValidationPanel({
  viewModel
}: {
  viewModel: GroupedValidationViewModel;
}) {
  return (
    <div
      className="grouped-validation-panel"
      aria-label="Grouped validation warnings"
      data-grouped-validation-count={viewModel.warningCount}
    >
      {viewModel.groups.map((group) => (
        <section key={group.key}>
          <h4>
            {group.sourceLabel} / {group.objectLabel} ({group.warningCount})
          </h4>
          <p>{group.repairSuggestion}</p>
          <ol>
            {group.warnings.map((warning) => (
              <li key={`${warning.code}-${warning.message}`}>
                <code>{warning.code}</code>
                <span>{warning.message}</span>
                {warning.duplicateCount > 1 ? <small>Count {warning.duplicateCount}</small> : null}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
