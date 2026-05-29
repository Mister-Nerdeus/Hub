export type EditorCommandBarViewModelInput = {
  hasActiveFloorplan: boolean;
  activeCopyName: string;
  activeRecordId: string | null;
  activePlanId: string | null;
  activeSourceLabel: string;
  lastNamedCopySaveLabel: string;
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
  lastNamedCopySaveLabel: string;
  defaultWarningLabel: string | null;
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
  lastNamedCopySaveLabel,
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
    lastNamedCopySaveLabel,
    defaultWarningLabel: readOnly
      ? "Canonical default is read-only. Save working copy creates a saved editable copy."
      : null,
    saveStatusLabel: saveStatus,
    dirtyStateLabel: isDirty ? "Draft changed" : "No unsaved edits",
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
    commandGroups: ["history", "draft", "object", "validation", "view", "next"]
  };
}
