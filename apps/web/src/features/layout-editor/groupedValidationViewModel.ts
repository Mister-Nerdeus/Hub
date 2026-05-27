import type { LayoutValidationPanelWarningViewModel } from "./layoutValidationPanelViewModel";
import { groupValidationWarnings, type ValidationDrawerGroupViewModel } from "./validationDrawerViewModel";

export type GroupedValidationWarningViewModel = ValidationDrawerGroupViewModel & {
  repairSuggestion: string;
};

export type GroupedValidationViewModel = {
  warningCount: number;
  groups: readonly GroupedValidationWarningViewModel[];
};

export function buildGroupedValidationViewModel(
  warnings: readonly LayoutValidationPanelWarningViewModel[]
): GroupedValidationViewModel {
  const groups = groupValidationWarnings(warnings).map((group) => ({
    ...group,
    repairSuggestion: repairSuggestionForGroup(group)
  }));
  return {
    warningCount: warnings.reduce((sum, warning) => sum + warning.duplicateCount, 0),
    groups
  };
}

function repairSuggestionForGroup(group: ValidationDrawerGroupViewModel): string {
  const codes = group.warnings.map((warning) => warning.code.toLowerCase());
  if (codes.some((code) => code.includes("door"))) {
    return "Review door wall, width, adjacent candidate, and path sync status.";
  }
  if (codes.some((code) => code.includes("room") || group.objectLabel.startsWith("room:"))) {
    return "Review room bounds, alignment, collision, and door coverage.";
  }
  if (group.objectLabel.startsWith("hallway:") || group.objectLabel.startsWith("zone:")) {
    return "Review presentation label, visibility, and path support markers.";
  }
  return "Review the grouped layout item and keep the warning visible until repaired.";
}
