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
      ? "Local editor state: changed"
      : "Local editor state: unchanged",
    namedSaveStatusLabel: isDirty && !readOnly
      ? "Named working copy: not saved since local changes"
      : `Named working copy: ${saveStatus}`,
    localRecoveryDraftLabel,
    lastNamedCopySaveLabel,
    reloadProofLabel,
    canonicalWarningLabel: readOnly
      ? "Canonical default is read-only. Save Working Copy creates an editable saved copy."
      : null,
    localOnlyWarningLabel: isDirty && !readOnly
      ? "Changes are only in the local editor/recovery draft. Click Save Working Copy to persist this named copy."
      : null
  };
}
