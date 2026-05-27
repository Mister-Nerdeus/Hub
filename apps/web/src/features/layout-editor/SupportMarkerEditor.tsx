import type { SupportMarkerEditorViewModel } from "./supportMarkerEditorViewModel";

export function SupportMarkerEditor({
  viewModel,
  onLabelChange,
  onTogglePresentationVisibility
}: {
  viewModel: SupportMarkerEditorViewModel;
  onLabelChange: (label: string) => void;
  onTogglePresentationVisibility: () => void;
}) {
  return (
    <section className="support-marker-editor" data-support-marker-editor={viewModel.status}>
      <strong>{viewModel.markerKindLabel}</strong>
      <label>
        Marker label
        <input
          value={viewModel.label}
          readOnly={viewModel.readOnly || viewModel.status !== "ready"}
          onChange={(event) => onLabelChange(event.currentTarget.value)}
        />
      </label>
      <button
        type="button"
        disabled={viewModel.readOnly || viewModel.status !== "ready"}
        onClick={onTogglePresentationVisibility}
      >
        {viewModel.presentationVisible ? "Hide marker" : "Show marker"}
      </button>
      <p>{viewModel.validationMessage}</p>
    </section>
  );
}
