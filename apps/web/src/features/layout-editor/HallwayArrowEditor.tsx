import type { HallwayArrowEditorViewModel } from "./hallwayArrowEditorViewModel";

export function HallwayArrowEditor({
  viewModel,
  onReverse,
  onHide,
  onShow
}: {
  viewModel: HallwayArrowEditorViewModel;
  onReverse: () => void;
  onHide: () => void;
  onShow: () => void;
}) {
  return (
    <section className="hallway-arrow-editor" data-hallway-arrow-editor={viewModel.status}>
      <strong>Hallway arrow</strong>
      <span>{viewModel.directionLabel}</span>
      <button type="button" disabled={viewModel.readOnly || viewModel.status !== "ready"} onClick={onReverse}>
        Reverse
      </button>
      <button type="button" disabled={viewModel.readOnly || viewModel.status !== "ready" || !viewModel.visible} onClick={onHide}>
        Hide
      </button>
      <button type="button" disabled={viewModel.readOnly || viewModel.status !== "ready" || viewModel.visible} onClick={onShow}>
        Show
      </button>
      <p>{viewModel.hintCopy}</p>
    </section>
  );
}
