import {
  buildLayoutValidationPanelWarningKey,
  type LayoutValidationPanelViewModel,
  type LayoutValidationPanelWarningViewModel
} from "./layoutValidationPanelViewModel";

export type ValidationDrawerGroupViewModel = {
  key: string;
  sourceLabel: string;
  objectLabel: string;
  warningCount: number;
  warnings: readonly LayoutValidationPanelWarningViewModel[];
};

export type ValidationDrawerViewModel = {
  status: "empty" | "warnings";
  warningCount: number;
  summaryWarnings: readonly LayoutValidationPanelWarningViewModel[];
  groups: readonly ValidationDrawerGroupViewModel[];
  fullWarningKeys: readonly string[];
};

export function buildValidationDrawerViewModel(
  panelViewModel: LayoutValidationPanelViewModel
): ValidationDrawerViewModel {
  const summaryWarnings = panelViewModel.warnings.slice(0, 2);
  const groups = groupValidationWarnings(panelViewModel.warnings);
  return {
    status: panelViewModel.status,
    warningCount: panelViewModel.warningCount,
    summaryWarnings,
    groups,
    fullWarningKeys: panelViewModel.warnings.map(buildLayoutValidationPanelWarningKey)
  };
}

export function groupValidationWarnings(
  warnings: readonly LayoutValidationPanelWarningViewModel[]
): ValidationDrawerGroupViewModel[] {
  const groups = new Map<string, LayoutValidationPanelWarningViewModel[]>();
  for (const warning of warnings) {
    const objectLabel = formatObjectReference(warning.objectType, warning.objectId);
    const key = `${warning.sourceLabel}|${objectLabel}`;
    groups.set(key, [...(groups.get(key) ?? []), warning]);
  }

  return [...groups.entries()]
    .map(([key, groupWarnings]) => {
      const [sourceLabel = "Unknown", objectLabel = "none"] = key.split("|");
      return {
        key,
        sourceLabel,
        objectLabel,
        warningCount: groupWarnings.length,
        warnings: groupWarnings
      };
    })
    .sort((left, right) =>
      left.sourceLabel.localeCompare(right.sourceLabel) ||
      left.objectLabel.localeCompare(right.objectLabel)
    );
}

function formatObjectReference(objectType: string | null, objectId: string | null): string {
  if (objectType == null || objectId == null) {
    return "none";
  }
  return `${objectType}:${objectId}`;
}
