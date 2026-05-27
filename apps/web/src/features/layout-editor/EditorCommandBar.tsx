export type EditorCommandBarProps = {
  layoutLabel: string;
  readOnly: boolean;
  isDirty: boolean;
  undoDisabled: boolean;
  redoDisabled: boolean;
  jsonStatus: string;
  validationSummary: string;
  inspectorCollapsed: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetDraft: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
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
  inspectorCollapsed,
  onUndo,
  onRedo,
  onResetDraft,
  onExportJson,
  onImportJson,
  onToggleInspector
}: EditorCommandBarProps) {
  return (
    <section className="editor-command-bar" aria-label="Editor command bar" data-editor-command-bar="compact">
      <div className="editor-command-bar__primary">
        <button type="button" disabled={undoDisabled} onClick={onUndo}>
          Undo
        </button>
        <button type="button" disabled={redoDisabled} onClick={onRedo}>
          Redo
        </button>
        <button type="button" onClick={onResetDraft}>
          Reset draft
        </button>
        <button type="button" onClick={onExportJson}>
          Export JSON
        </button>
        <button type="button" onClick={onImportJson}>
          Import JSON
        </button>
        <button type="button" onClick={onToggleInspector} aria-pressed={inspectorCollapsed}>
          {inspectorCollapsed ? "Show inspector" : "Hide inspector"}
        </button>
      </div>
      <dl className="editor-command-bar__status" aria-label="Editor status">
        <div>
          <dt>Layout</dt>
          <dd>{layoutLabel}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{readOnly ? "Read-only" : "Editable"}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{isDirty ? "Draft changed" : "No unsaved edits"}</dd>
        </div>
        <div>
          <dt>Validation</dt>
          <dd>{validationSummary}</dd>
        </div>
        <div>
          <dt>JSON</dt>
          <dd role="status">{jsonStatus}</dd>
        </div>
      </dl>
    </section>
  );
}
