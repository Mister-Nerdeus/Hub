import type { EditorNextStepViewModel } from "./editorNextStepViewModel";

export type EditorNextStepPanelProps = {
  viewModel: EditorNextStepViewModel;
};

export function EditorNextStepPanel({ viewModel }: EditorNextStepPanelProps) {
  return (
    <aside
      className="editor-next-step-panel"
      aria-label={viewModel.title}
      data-editor-next-step={viewModel.status}
    >
      <h3>{viewModel.title}</h3>
      <p>{viewModel.primaryStep}</p>
      <ul>
        {viewModel.secondarySteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
    </aside>
  );
}
