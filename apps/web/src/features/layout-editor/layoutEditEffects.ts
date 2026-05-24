import type { LayoutEditorState, LayoutEditorValidationWarning } from "./layoutEditorState";
import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";

export type ApplyLayoutEditEffectsInput = {
  state: LayoutEditorState;
  editableLayout: LayoutEditorState["editableLayout"];
  validationWarnings: readonly LayoutEditorValidationWarning[];
  auditEntry: LayoutEditAuditEntry;
  selectedObjectType: LayoutEditorState["selectedObjectType"];
  selectedObjectId: LayoutEditorState["selectedObjectId"];
};

const DELTA_PREVIEW_TRIGGERING_EDIT_TYPES = [
  "move_room",
  "resize_room",
  "edit_room_dimensions"
] as const;

export function applyLayoutEditEffects({
  state,
  editableLayout,
  validationWarnings,
  auditEntry,
  selectedObjectType,
  selectedObjectId
}: ApplyLayoutEditEffectsInput): LayoutEditorState {
  if (isNoOpLayoutEdit(auditEntry)) {
    return state;
  }

  return {
    ...state,
    editableLayout,
    validationWarnings,
    editAuditTrail: [...state.editAuditTrail, auditEntry],
    selectedObjectType,
    selectedObjectId,
    isDirty: true
  };
}

export function isDeltaPreviewTriggeringEdit(entry: LayoutEditAuditEntry): boolean {
  return DELTA_PREVIEW_TRIGGERING_EDIT_TYPES.includes(entry.editType);
}

export function getLatestDeltaPreviewEdit(
  entries: readonly LayoutEditAuditEntry[]
): LayoutEditAuditEntry | null {
  return (
    entries
      .filter(isDeltaPreviewTriggeringEdit)
      .sort(
        (left, right) =>
          right.createdAtOrder - left.createdAtOrder || right.editId.localeCompare(left.editId)
      )[0] ?? null
  );
}

export function isNoOpLayoutEdit(entry: LayoutEditAuditEntry): boolean {
  switch (entry.editType) {
    case "move_room":
      return entry.deltaFeet.deltaXFeet === 0 && entry.deltaFeet.deltaYFeet === 0;
    case "resize_room":
    case "edit_room_dimensions":
      return (
        entry.deltaFeet.deltaXFeet === 0 &&
        entry.deltaFeet.deltaYFeet === 0 &&
        entry.deltaFeet.deltaWidthFeet === 0 &&
        entry.deltaFeet.deltaHeightFeet === 0
      );
  }
}
