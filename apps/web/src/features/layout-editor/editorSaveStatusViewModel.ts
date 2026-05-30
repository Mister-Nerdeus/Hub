export type EditorSaveStatusViewModelInput = {
  activeCopyName: string;
  activeRecordId: string | null;
  activePlanId: string | null;
  activeSourceLabel: string;
  localRecoveryDraftLabel: string;
  lastNamedCopySaveLabel: string;
  reloadProofLabel: string;
  readOnly: boolean;
  isDirty: boolean;
  saveStatus: string;
};

export type EditorSaveStatusViewModel = {
  activeCopyName: string;
  activeRecordIdLabel: string;
  activePlanIdLabel: string;
  sourceKindLabel: string;
  modeLabel: string;
  localEditorStateLabel: string;
  namedSaveStatusLabel: string;
  localRecoveryDraftLabel: string;
  lastNamedCopySaveLabel: string;
  reloadProofLabel: string;
  canonicalWarningLabel: string | null;
  localOnlyWarningLabel: string | null;
};

export function buildEditorSaveStatusViewModel({
  activeCopyName,
  activeRecordId,
  activePlanId,
  activeSourceLabel,
  localRecoveryDraftLabel,
  lastNamedCopySaveLabel,
  reloadProofLabel,
  readOnly,
  isDirty,
  saveStatus
}: EditorSaveStatusViewModelInput): EditorSaveStatusViewModel {
  return {
    activeCopyName,
    activeRecordIdLabel: activeRecordId ?? "No active record",
    activePlanIdLabel: activePlanId ?? "No active plan",
    sourceKindLabel: activeSourceLabel,
    modeLabel: readOnly ? "Read-only" : "Editable",
    localEditorStateLabel: isDirty
      ? "Editor state: changed"
      : "Editor state: unchanged",
    namedSaveStatusLabel: isDirty && !readOnly
      ? "Floorplan: not saved since changes"
      : `Floorplan: ${saveStatus}`,
    localRecoveryDraftLabel,
    lastNamedCopySaveLabel,
    reloadProofLabel,
    canonicalWarningLabel: readOnly
      ? "This floorplan is read-only. Save Floorplan creates an editable saved version."
      : null,
    localOnlyWarningLabel: isDirty && !readOnly
      ? "Changes are only in the editor until Save Floorplan is used."
      : null
  };
}
