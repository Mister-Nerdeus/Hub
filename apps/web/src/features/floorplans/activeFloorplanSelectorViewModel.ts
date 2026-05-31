import type { ActiveFloorplanContract } from "@nerdeus/shared";
import type { FloorplanVersionHistoryItem } from "./floorplanVersionHistory";
import {
  formatFloorplanSavedTime,
  normalizeFloorplanDisplayName
} from "./floorplanVersionNaming";

export type ActiveFloorplanSelectorVersionOption = {
  versionId: string;
  label: string;
  savedAtLabel: string;
  current: boolean;
  archived: boolean;
};

export type ActiveFloorplanSelectorViewModel = {
  title: "Active floorplan";
  displayName: string;
  statusLabel: string;
  lastSavedLabel: string;
  selectedVersionId: string;
  selectedVersionLabel: string;
  versionOptions: ActiveFloorplanSelectorVersionOption[];
  canUseForAssignment: boolean;
  technicalDetailsVisible: false;
};

export function createActiveFloorplanSelectorViewModel(input: {
  activeFloorplan: ActiveFloorplanContract;
  versions: readonly FloorplanVersionHistoryItem[];
}): ActiveFloorplanSelectorViewModel {
  const currentVersion = input.versions.find(
    (version) => version.versionId === input.activeFloorplan.activeFloorplanVersionId
  );
  const versionOptions = input.versions.map((version) => ({
    versionId: version.versionId,
    label: version.versionLabel,
    savedAtLabel: formatFloorplanSavedTime(version.savedAt),
    current: version.isCurrent,
    archived: version.status === "archived"
  }));
  const selectedVersionLabel = currentVersion?.versionLabel
    ?? (input.activeFloorplan.sourceKind === "canonical_default" ? "Version 1" : "Current version");

  return {
    title: "Active floorplan",
    displayName: normalizeFloorplanDisplayName(input.activeFloorplan.displayName),
    statusLabel: workflowStatusLabel(input.activeFloorplan.workflowStatus),
    lastSavedLabel: `Last saved: ${formatFloorplanSavedTime(input.activeFloorplan.savedAt)}`,
    selectedVersionId: input.activeFloorplan.activeFloorplanVersionId,
    selectedVersionLabel,
    versionOptions,
    canUseForAssignment: input.activeFloorplan.workflowStatus !== "no_floorplan_selected",
    technicalDetailsVisible: false
  };
}

export function workflowStatusLabel(status: ActiveFloorplanContract["workflowStatus"]): string {
  if (status === "ready_for_assignment") return "Ready for assignment";
  if (status === "saved") return "Saved";
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  return "No floorplan selected";
}
