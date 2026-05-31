import type { LayoutValidationPanelViewModel } from "./layoutValidationPanelViewModel";

export type EditorValidationSummaryRowProps = {
  viewModel: LayoutValidationPanelViewModel;
};

export function EditorValidationSummaryRow({ viewModel }: EditorValidationSummaryRowProps) {
  const statusLabel = viewModel.warningCount === 0
    ? "No layout warnings"
    : `${viewModel.warningCount} ${viewModel.warningCount === 1 ? "warning" : "warnings"}`;

  return (
    <section
      className="editor-validation-summary-row"
      aria-label="Editor validation summary"
      data-editor-validation-summary-row="compact"
      data-geometry-truth-validation-summary="visible"
    >
      <span>Validation</span>
      <strong>{statusLabel}</strong>
      <span>{viewModel.status === "empty" ? "Ready for floorplan editing" : "Details available below"}</span>
    </section>
  );
}
