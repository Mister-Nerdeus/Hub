import type { EditorCommandBarViewModel } from "./editorCommandBarViewModel";

export type EditorAdvancedStatusPanelProps = {
  viewModel: EditorCommandBarViewModel;
  layoutLabel: string;
  jsonStatus: string;
};

export function EditorAdvancedStatusPanel({
  viewModel,
  layoutLabel,
  jsonStatus
}: EditorAdvancedStatusPanelProps) {
  return (
    <details
      className="editor-command-bar__advanced-status"
      data-editor-technical-status-advanced="true"
    >
      <summary>Advanced status</summary>
      <dl className="editor-command-bar__status" aria-label="Editor status">
        <div>
          <dt>Active copy</dt>
          <dd>{viewModel.activeCopyName}</dd>
        </div>
        <div>
          <dt>Record ID</dt>
          <dd>{viewModel.activeRecordIdLabel}</dd>
        </div>
        <div>
          <dt>Plan ID</dt>
          <dd>{viewModel.activePlanIdLabel}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{viewModel.activeSourceLabel}</dd>
        </div>
        <div>
          <dt>Layout</dt>
          <dd>{layoutLabel}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{viewModel.modeLabel}</dd>
        </div>
        <div>
          <dt>Local recovery draft</dt>
          <dd>{viewModel.localRecoveryDraftLabel}</dd>
        </div>
        <div>
          <dt>Named working copy</dt>
          <dd>{viewModel.saveStatusLabel}</dd>
        </div>
        <div>
          <dt>Last named-copy save</dt>
          <dd>{viewModel.lastNamedCopySaveLabel}</dd>
        </div>
        <div>
          <dt>Reload proof</dt>
          <dd>{viewModel.reloadProofLabel}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{viewModel.dirtyStateLabel}</dd>
        </div>
        <div>
          <dt>Validation</dt>
          <dd>{viewModel.validationLabel}</dd>
        </div>
        <div>
          <dt>JSON</dt>
          <dd role="status">{jsonStatus}</dd>
        </div>
        <div>
          <dt>Proceed</dt>
          <dd>{viewModel.proceedStatusLabel}</dd>
        </div>
      </dl>
    </details>
  );
}
