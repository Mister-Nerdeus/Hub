import type { LayoutDeltaPreviewViewModel } from "./layoutDeltaPreviewViewModel";

export type LayoutDeltaPreviewPanelProps = {
  viewModel: LayoutDeltaPreviewViewModel;
};

export function LayoutDeltaPreviewPanel({ viewModel }: LayoutDeltaPreviewPanelProps) {
  return (
    <aside
      className="layout-delta-preview-panel"
      aria-label={viewModel.title}
      aria-readonly="true"
      data-has-fake-metric-values={String(viewModel.hasFakeMetricValues)}
      data-rerun-wired={String(viewModel.rerunWired)}
    >
      <header className="layout-delta-preview-panel__header">
        <p className="eyebrow">Preview</p>
        <h3>{viewModel.title}</h3>
      </header>
      <p className="layout-delta-preview-panel__message">{viewModel.message}</p>
      {viewModel.latestEditId != null ? (
        <p className="layout-delta-preview-panel__edit">Latest edit: {viewModel.latestEditId}</p>
      ) : null}
      {viewModel.affectedCategories.length > 0 ? (
        <ul className="layout-delta-preview-panel__categories">
          {viewModel.affectedCategories.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
