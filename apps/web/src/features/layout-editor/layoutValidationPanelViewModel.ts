import type {
  LayoutEditorSelectableObjectType,
} from "./layoutEditorState";
import type {
  LayoutEditorValidationWarning,
  LayoutValidationWarningSeverity,
  LayoutValidationWarningSource
} from "./layoutValidationWarningContract";
import {
  formatLayoutValidationSeverity,
  formatLayoutValidationSource
} from "./layoutValidationSeverityDisplay";

export type LayoutValidationPanelWarningViewModel = {
  code: string;
  severity: LayoutValidationWarningSeverity;
  severityLabel: string;
  source: LayoutValidationWarningSource;
  sourceLabel: string;
  message: string;
  objectType: LayoutEditorSelectableObjectType | null;
  objectId: string | null;
  relatedObjectType: LayoutEditorSelectableObjectType | null;
  relatedObjectId: string | null;
  isGenerated: boolean;
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
    severity: warning.severity,
    severityLabel: formatLayoutValidationSeverity(warning.severity),
    source: warning.source,
    sourceLabel: formatLayoutValidationSource(warning.source),
    message: warning.message,
    objectType: warning.objectType,
    objectId: warning.objectId,
    relatedObjectType: warning.relatedObjectType,
    relatedObjectId: warning.relatedObjectId,
    isGenerated: warning.isGenerated,
    duplicateCount: 1
  };
}

function warningKey(warning: LayoutValidationPanelWarningViewModel): string {
  return [
    warning.code,
    warning.severity,
    warning.source,
    warning.message,
    warning.objectType ?? "",
    warning.objectId ?? "",
    warning.relatedObjectType ?? "",
    warning.relatedObjectId ?? "",
    String(warning.isGenerated)
  ].join("|");
}

function compareWarningViewModels(
  left: LayoutValidationPanelWarningViewModel,
  right: LayoutValidationPanelWarningViewModel
): number {
  return (
    left.source.localeCompare(right.source) ||
    left.code.localeCompare(right.code) ||
    left.severity.localeCompare(right.severity) ||
    (left.objectType ?? "").localeCompare(right.objectType ?? "") ||
    (left.objectId ?? "").localeCompare(right.objectId ?? "") ||
    (left.relatedObjectType ?? "").localeCompare(right.relatedObjectType ?? "") ||
    (left.relatedObjectId ?? "").localeCompare(right.relatedObjectId ?? "") ||
    Number(left.isGenerated) - Number(right.isGenerated) ||
    left.message.localeCompare(right.message)
  );
}
