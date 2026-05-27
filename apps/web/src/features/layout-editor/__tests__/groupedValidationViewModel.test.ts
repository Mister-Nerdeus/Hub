import { buildGroupedValidationViewModel } from "../groupedValidationViewModel";

const warnings = [
  warning("door_width", "door", "door-01", 2),
  warning("room_bounds", "room", "room-01", 1)
];
const viewModel = buildGroupedValidationViewModel(warnings);
if (viewModel.warningCount !== 3) {
  throw new Error("grouped validation must preserve duplicate warning counts");
}
if (viewModel.groups.length !== 2) {
  throw new Error("grouped validation should group by object/source");
}
if (!viewModel.groups.some((group) => group.repairSuggestion.includes("door wall"))) {
  throw new Error("grouped validation should include repair suggestions");
}

function warning(code: string, objectType: "room" | "door", objectId: string, duplicateCount: number) {
  return {
    code,
    severity: "warning" as const,
    severityLabel: "Warning",
    source: "door_sync" as const,
    sourceLabel: "Door sync",
    message: `${code} message`,
    objectType,
    objectId,
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: true,
    duplicateCount
  };
}
