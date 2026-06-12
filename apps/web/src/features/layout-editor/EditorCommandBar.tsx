import { buildEditorCommandBarViewModel } from "./editorCommandBarViewModel";
import { EditorAdvancedStatusPanel } from "./EditorAdvancedStatusPanel";
import { EditorAdvancedToolsPanel } from "./EditorAdvancedToolsPanel";

export type EditorCommandBarProps = {
  layoutLabel: string;
  hasActiveFloorplan: boolean;
  activeCopyName: string;
  activeRecordId: string | null;
  activePlanId: string | null;
  activeSourceLabel: string;
  localRecoveryDraftLabel: string;
  lastNamedCopySaveLabel: string;
  reloadProofLabel: string;
  hasLocalRecoveryDraft: boolean;
  readOnly: boolean;
  isDirty: boolean;
  undoDisabled: boolean;
  redoDisabled: boolean;
  jsonStatus: string;
  saveStatus: string;
  validationSummary: string;
  validationDisabled: boolean;
  inspectorCollapsed: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRestoreDraft: () => void;
  onResetDraft: () => void;
  onSaveWorkingCopy: () => void;
  onSaveAsNewCopy: () => void;
  onDoneEditing?: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onValidate: () => void;
  onResetView: () => void;
  onAddObject: () => void;
  onToggleInspector: () => void;
};

export function EditorCommandBar({
  layoutLabel,
  hasActiveFloorplan,
  activeCopyName,
  activeRecordId,
  activePlanId,
  activeSourceLabel,
  localRecoveryDraftLabel,
  lastNamedCopySaveLabel,
  reloadProofLabel,
  hasLocalRecoveryDraft,
  readOnly,
  isDirty,
  undoDisabled,
  redoDisabled,
  jsonStatus,
  saveStatus,
  validationSummary,
  validationDisabled,
  inspectorCollapsed,
  onUndo,
  onRedo,
  onRestoreDraft,
  onResetDraft,
  onSaveWorkingCopy,
  onSaveAsNewCopy,
  onDoneEditing = () => undefined,
  onExportJson,
  onImportJson,
  onValidate,
  onResetView,
  onAddObject,
  onToggleInspector
}: EditorCommandBarProps) {
  const viewModel = buildEditorCommandBarViewModel({
    hasActiveFloorplan,
    activeCopyName,
    activeRecordId,
    activePlanId,
    activeSourceLabel,
    localRecoveryDraftLabel,
    lastNamedCopySaveLabel,
    reloadProofLabel,
    isDirty,
    readOnly,
    undoDisabled,
    redoDisabled,
    validationSummary,
    validationDisabled,
    saveStatus
  });

  return (
    <section
      className="editor-command-bar"
      aria-label="Editor command bar"
      data-editor-command-bar="consolidated"
      data-proceed-placeholder="disabled"
    >
      <div className="editor-command-bar__primary editor-command-bar__primary-save" data-command-group="primary-save">
        <button
          type="button"
          className="editor-command-bar__save-primary"
          data-editor-control="save-working-copy"
          disabled={viewModel.saveWorkingCopyDisabled}
          onClick={onSaveWorkingCopy}
        >
          Save Floorplan
        </button>
        <button type="button" onClick={onDoneEditing}>Done Editing</button>
      </div>
      <p className="editor-command-bar__save-status" role="status">
        {viewModel.saveStatusLabel}
      </p>
      <div
        className="editor-command-bar__primary"
        data-command-group="edit-history"
        data-editor-undo-redo-surface="advanced"
      >
        <button type="button" disabled={viewModel.undoDisabled} onClick={onUndo}>
          Undo
        </button>
        <button type="button" disabled={viewModel.redoDisabled} onClick={onRedo}>
          Redo
        </button>
      </div>
      <EditorAdvancedToolsPanel>
        <div className="editor-command-bar__primary editor-command-bar__primary-save" data-command-group="advanced-save">
          <button
            type="button"
            data-editor-control="save-as-new-version"
            disabled={viewModel.saveAsNewCopyDisabled}
            onClick={onSaveAsNewCopy}
          >
            Save as New Version
          </button>
          <button
            type="button"
            hidden
            data-editor-control="save-as-new-copy"
            disabled={viewModel.saveAsNewCopyDisabled}
            onClick={onSaveAsNewCopy}
            aria-hidden="true"
            tabIndex={-1}
          >
            Save as New Copy
          </button>
          <button type="button" data-editor-control="export-json-backup" onClick={onExportJson}>
            Export JSON Backup
          </button>
        </div>
        <div className="editor-command-bar__primary editor-command-bar__recovery" data-command-group="recovery-import-export">
          <button type="button" disabled={!hasLocalRecoveryDraft} onClick={onRestoreDraft}>
            Restore Local Draft
          </button>
          <button type="button" className="editor-command-bar__danger" onClick={onResetDraft}>
            Reset Local Draft
          </button>
          <button type="button" onClick={onImportJson}>
            Import JSON
          </button>
        </div>
      </EditorAdvancedToolsPanel>
      <div className="editor-command-bar__primary" data-command-group="editor-tools">
        <button type="button" disabled={viewModel.addObjectDisabled} onClick={onAddObject}>
          Add Object
        </button>
      </div>
      <div className="editor-command-bar__primary" data-command-group="validation-view">
        <button type="button" disabled={viewModel.validationDisabled} onClick={onValidate}>
          Validate
        </button>
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
      <EditorAdvancedStatusPanel
        viewModel={viewModel}
        layoutLabel={layoutLabel}
        jsonStatus={jsonStatus}
      />
      <p className="editor-command-bar__help" data-save-help="save-floorplan-active">
        Save Floorplan keeps this as the active floorplan for assignments and scenarios.
      </p>
      {viewModel.defaultWarningLabel == null ? null : (
        <p className="editor-command-bar__warning" role="status">
          {viewModel.defaultWarningLabel}
        </p>
      )}
      {viewModel.changedNotSavedWarningLabel == null ? null : (
        <p className="editor-command-bar__warning" role="status">
          {viewModel.changedNotSavedWarningLabel}
        </p>
      )}
    </section>
  );
}
