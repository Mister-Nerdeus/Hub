import { buildEditorCommandBarViewModel } from "./editorCommandBarViewModel";

export type EditorCommandBarProps = {
  layoutLabel: string;
  readOnly: boolean;
  isDirty: boolean;
  undoDisabled: boolean;
  redoDisabled: boolean;
  jsonStatus: string;
  validationSummary: string;
  validationDisabled: boolean;
  inspectorCollapsed: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetDraft: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onValidate: () => void;
  onResetView: () => void;
  onAddObject: () => void;
  onToggleInspector: () => void;
};

export function EditorCommandBar({
  layoutLabel,
  readOnly,
  isDirty,
  undoDisabled,
  redoDisabled,
  jsonStatus,
  validationSummary,
  validationDisabled,
  inspectorCollapsed,
  onUndo,
  onRedo,
  onResetDraft,
  onExportJson,
  onImportJson,
  onValidate,
  onResetView,
  onAddObject,
  onToggleInspector
}: EditorCommandBarProps) {
  const viewModel = buildEditorCommandBarViewModel({
    isDirty,
    readOnly,
    undoDisabled,
    redoDisabled,
    validationSummary,
    validationDisabled
  });

  return (
    <section
      className="editor-command-bar"
      aria-label="Editor command bar"
      data-editor-command-bar="consolidated"
      data-proceed-placeholder="disabled"
    >
      <div className="editor-command-bar__primary" data-command-group="history">
        <button type="button" disabled={viewModel.undoDisabled} onClick={onUndo}>
          Undo
        </button>
        <button type="button" disabled={viewModel.redoDisabled} onClick={onRedo}>
          Redo
        </button>
      </div>
      <div className="editor-command-bar__primary" data-command-group="draft">
        <button type="button" onClick={onResetDraft}>
          Reset draft
        </button>
        <button type="button" onClick={onImportJson}>
          Import JSON
        </button>
        <button type="button" onClick={onExportJson}>
          Export
        </button>
      </div>
      <div className="editor-command-bar__primary" data-command-group="object">
        <button type="button" disabled={viewModel.addObjectDisabled} onClick={onAddObject}>
          Add Object
        </button>
      </div>
      <div className="editor-command-bar__primary" data-command-group="validation">
        <button type="button" disabled={viewModel.validationDisabled} onClick={onValidate}>
          Validate
        </button>
      </div>
      <div className="editor-command-bar__primary" data-command-group="view">
        <button type="button" onClick={onResetView}>
          Reset view
        </button>
        <button type="button" onClick={onToggleInspector} aria-pressed={inspectorCollapsed}>
          {inspectorCollapsed ? "Show inspector" : "Hide inspector"}
        </button>
      </div>
      <div className="editor-command-bar__primary" data-command-group="next">
        <button type="button" disabled aria-disabled="true">
          {viewModel.proceedLabel}
        </button>
      </div>
      <dl className="editor-command-bar__status" aria-label="Editor status">
        <div>
          <dt>Layout</dt>
          <dd>{layoutLabel}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{viewModel.modeLabel}</dd>
        </div>
        <div>
          <dt>Local draft</dt>
          <dd>{viewModel.saveStatusLabel}</dd>
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
    </section>
  );
}
