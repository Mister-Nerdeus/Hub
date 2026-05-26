import type { EditorControlViewModel } from "./editorControlViewModel";

type FloorplanEditorControlsProps = {
  viewModel: EditorControlViewModel;
};

export function FloorplanEditorControls({ viewModel }: FloorplanEditorControlsProps) {
  return (
    <div className="floorplan-editor-controls" aria-label="Floorplan editor controls">
      {viewModel.controls.map((control) => <button type="button" key={control}>{control}</button>)}
      <span>{viewModel.copy}</span>
    </div>
  );
}
