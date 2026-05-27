export type EditorCommandBarViewModelInput = {
  isDirty: boolean;
  readOnly: boolean;
  undoDisabled: boolean;
  redoDisabled: boolean;
  validationSummary: string;
  validationDisabled: boolean;
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
  proceedDisabled: boolean;
  proceedLabel: string;
  proceedStatusLabel: string;
  commandGroups: readonly string[];
};

export function buildEditorCommandBarViewModel({
  isDirty,
  readOnly,
  undoDisabled,
  redoDisabled,
  validationSummary,
  validationDisabled
}: EditorCommandBarViewModelInput): EditorCommandBarViewModel {
  return {
    saveStatusLabel: readOnly ? "Not saved in read-only mode" : "Local browser draft writes automatically",
    dirtyStateLabel: isDirty ? "Draft changed" : "No unsaved edits",
    modeLabel: readOnly ? "Read-only" : "Editable",
    validationLabel: validationSummary,
    undoDisabled,
    redoDisabled,
    validationDisabled,
    addObjectDisabled: readOnly,
    proceedDisabled: true,
    proceedLabel: "Proceed later",
    proceedStatusLabel: "Future step",
    commandGroups: ["history", "draft", "object", "validation", "view", "next"]
  };
}
