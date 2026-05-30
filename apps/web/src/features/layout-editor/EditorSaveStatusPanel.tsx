import {
  buildEditorSaveStatusViewModel,
  type EditorSaveStatusViewModelInput
} from "./editorSaveStatusViewModel";

export type EditorSaveStatusPanelProps = EditorSaveStatusViewModelInput;

export function EditorSaveStatusPanel(props: EditorSaveStatusPanelProps) {
  const viewModel = buildEditorSaveStatusViewModel(props);
  return (
    <details
      className="editor-save-status-panel"
      aria-label="Active copy and save status"
      data-editor-save-status-panel="true"
    >
      <summary>Advanced save details</summary>
      <dl>
        <div>
          <dt>Active copy</dt>
          <dd>{viewModel.activeCopyName}</dd>
        </div>
        <div data-active-record-id={viewModel.activeRecordIdLabel}>
          <dt>Record ID</dt>
          <dd>{viewModel.activeRecordIdLabel}</dd>
        </div>
        <div>
          <dt>Plan ID</dt>
          <dd>{viewModel.activePlanIdLabel}</dd>
        </div>
        <div data-active-source-kind={viewModel.sourceKindLabel}>
          <dt>Source</dt>
          <dd>{viewModel.sourceKindLabel}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{viewModel.modeLabel}</dd>
        </div>
        <div>
          <dt>Local editor state</dt>
          <dd>{viewModel.localEditorStateLabel}</dd>
        </div>
        <div data-named-save-status={viewModel.namedSaveStatusLabel}>
          <dt>Named working copy</dt>
          <dd>{viewModel.namedSaveStatusLabel}</dd>
        </div>
        <div>
          <dt>Last named-copy save</dt>
          <dd>{viewModel.lastNamedCopySaveLabel}</dd>
        </div>
        <div>
          <dt>Local recovery draft</dt>
          <dd>{viewModel.localRecoveryDraftLabel}</dd>
        </div>
        <div>
          <dt>Reload proof</dt>
          <dd>{viewModel.reloadProofLabel}</dd>
        </div>
      </dl>
      {viewModel.canonicalWarningLabel == null ? null : (
        <p className="editor-save-status-panel__warning" role="status">
          {viewModel.canonicalWarningLabel}
        </p>
      )}
      {viewModel.localOnlyWarningLabel == null ? null : (
        <p className="editor-save-status-panel__warning" role="status">
          {viewModel.localOnlyWarningLabel}
        </p>
      )}
    </details>
  );
}
