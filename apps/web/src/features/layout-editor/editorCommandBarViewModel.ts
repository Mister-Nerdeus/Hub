export type EditorCommandBarViewModelInput = {
  hasActiveFloorplan: boolean;
  isDirty: boolean;
  readOnly: boolean;
  undoDisabled: boolean;
  redoDisabled: boolean;
  validationSummary: string;
  validationDisabled: boolean;
  saveStatus: string;
};

export type EditorCommandBarViewModel = {
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
  isDirty,
  readOnly,
  undoDisabled,
  redoDisabled,
  validationSummary,
  validationDisabled,
  saveStatus
}: EditorCommandBarViewModelInput): EditorCommandBarViewModel {
  return {
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
