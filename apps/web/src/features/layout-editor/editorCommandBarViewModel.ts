export type EditorCommandBarViewModelInput = {
  hasActiveFloorplan: boolean;
  activeCopyName: string;
  activeRecordId: string | null;
  activePlanId: string | null;
  activeSourceLabel: string;
  localRecoveryDraftLabel: string;
  lastNamedCopySaveLabel: string;
  reloadProofLabel: string;
  isDirty: boolean;
  readOnly: boolean;
  undoDisabled: boolean;
  redoDisabled: boolean;
  validationSummary: string;
  validationDisabled: boolean;
  saveStatus: string;
};

export type EditorCommandBarViewModel = {
  activeCopyName: string;
  activeRecordIdLabel: string;
  activePlanIdLabel: string;
  activeSourceLabel: string;
  localRecoveryDraftLabel: string;
  lastNamedCopySaveLabel: string;
  reloadProofLabel: string;
  defaultWarningLabel: string | null;
  changedNotSavedWarningLabel: string | null;
  saveStatusLabel: string;
  dirtyStateLabel: string;
  modeLabel: string;
  validationLabel: string;
  undoDisabled: boolean;
  redoDisabled: boolean;
  validationDisabled: boolean;
  addObjectDisabled: boolean;
  saveWorkingCopyDisabled: boolean;
  saveAsNewCopyDisabled: boolean;
  proceedDisabled: boolean;
  proceedLabel: string;
  proceedStatusLabel: string;
  commandGroups: readonly string[];
};

export function buildEditorCommandBarViewModel({
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
}: EditorCommandBarViewModelInput): EditorCommandBarViewModel {
  return {
    activeCopyName,
    activeRecordIdLabel: activeRecordId ?? "No active record",
    activePlanIdLabel: activePlanId ?? "No active plan",
    activeSourceLabel,
    localRecoveryDraftLabel,
    lastNamedCopySaveLabel,
    reloadProofLabel,
    defaultWarningLabel: readOnly
      ? "Canonical default is read-only. Save Working Copy creates a saved editable copy."
      : null,
    changedNotSavedWarningLabel: isDirty && !readOnly
      ? "Changes are in the local editor only. Click Save Working Copy to persist this saved copy."
      : null,
    saveStatusLabel: isDirty && !readOnly ? "Not saved since local changes" : saveStatus,
    dirtyStateLabel: isDirty ? "Local editor state: changed" : "Local editor state: unchanged",
    modeLabel: readOnly ? "Read-only" : "Editable",
    validationLabel: validationSummary,
    undoDisabled,
    redoDisabled,
    validationDisabled,
    addObjectDisabled: readOnly,
    saveWorkingCopyDisabled: !hasActiveFloorplan,
    saveAsNewCopyDisabled: !hasActiveFloorplan,
    proceedDisabled: true,
    proceedLabel: "Proceed later",
    proceedStatusLabel: "Future step",
    commandGroups: ["primary-save", "edit-history", "recovery-import-export", "editor-tools", "validation-view", "next"]
  };
}
