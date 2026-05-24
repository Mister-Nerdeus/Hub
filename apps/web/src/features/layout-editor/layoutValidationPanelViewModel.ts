import type {
  LayoutEditorSelectableObjectType,
  LayoutEditorValidationWarning
} from "./layoutEditorState";

export type LayoutValidationPanelWarningViewModel = {
  code: string;
  message: string;
  objectType: LayoutEditorSelectableObjectType | null;
  objectId: string | null;
  relatedObjectType: LayoutEditorSelectableObjectType | null;
  relatedObjectId: string | null;
  duplicateCount: number;
};

export type LayoutValidationPanelViewModel = {
  status: "empty" | "warnings";
  title: "Layout warnings";
  emptyMessage: "No layout warnings.";
  warningCount: number;
  isReadOnly: true;
  warnings: readonly LayoutValidationPanelWarningViewModel[];
};

export type BuildLayoutValidationPanelViewModelInput = {
  warnings: readonly LayoutEditorValidationWarning[];
};

export function buildLayoutValidationPanelViewModel({
  warnings
}: BuildLayoutValidationPanelViewModelInput): LayoutValidationPanelViewModel {
  const warningViewModels = collapseDuplicateWarnings(warnings).sort(compareWarningViewModels);
  return {
    status: warningViewModels.length === 0 ? "empty" : "warnings",
    title: "Layout warnings",
    emptyMessage: "No layout warnings.",
    warningCount: warningViewModels.length,
    isReadOnly: true,
    warnings: warningViewModels
  };
}

function collapseDuplicateWarnings(
  warnings: readonly LayoutEditorValidationWarning[]
): LayoutValidationPanelWarningViewModel[] {
  const warningsByKey = new Map<string, LayoutValidationPanelWarningViewModel>();
  for (const warning of warnings) {
    const viewModel = normalizeWarning(warning);
    const key = warningKey(viewModel);
    const existing = warningsByKey.get(key);
    if (existing == null) {
      warningsByKey.set(key, viewModel);
      continue;
    }
    existing.duplicateCount += 1;
  }
  return [...warningsByKey.values()];
}

function normalizeWarning(
  warning: LayoutEditorValidationWarning
): LayoutValidationPanelWarningViewModel {
  return {
    code: warning.code,
    message: warning.message,
    objectType: warning.objectType ?? null,
    objectId: warning.objectId ?? null,
    relatedObjectType: warning.relatedObjectType ?? null,
    relatedObjectId: warning.relatedObjectId ?? null,
    duplicateCount: 1
  };
}

function warningKey(warning: LayoutValidationPanelWarningViewModel): string {
  return [
    warning.code,
    warning.message,
    warning.objectType ?? "",
    warning.objectId ?? "",
    warning.relatedObjectType ?? "",
    warning.relatedObjectId ?? ""
  ].join("|");
}

function compareWarningViewModels(
  left: LayoutValidationPanelWarningViewModel,
  right: LayoutValidationPanelWarningViewModel
): number {
  return (
    left.code.localeCompare(right.code) ||
    (left.objectType ?? "").localeCompare(right.objectType ?? "") ||
    (left.objectId ?? "").localeCompare(right.objectId ?? "") ||
    (left.relatedObjectType ?? "").localeCompare(right.relatedObjectType ?? "") ||
    (left.relatedObjectId ?? "").localeCompare(right.relatedObjectId ?? "") ||
    left.message.localeCompare(right.message)
  );
}
