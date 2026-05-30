import type { ActiveFloorplanContract } from "@nerdeus/shared";
import type { FloorplanVersionHistoryItem } from "./floorplanVersionHistory";
import { normalizeFloorplanDisplayName } from "./floorplanVersionNaming";
import { workflowStatusLabel } from "./activeFloorplanSelectorViewModel";

export type ActiveFloorplanBannerViewModel = {
  label: string;
  displayName: string;
  statusLabel: string;
  versionLabel: string;
  technicalIdsHidden: true;
};

export function createActiveFloorplanBannerViewModel(input: {
  activeFloorplan: ActiveFloorplanContract;
  versions: readonly FloorplanVersionHistoryItem[];
}): ActiveFloorplanBannerViewModel {
  const version = input.versions.find(
    (item) => item.versionId === input.activeFloorplan.activeFloorplanVersionId
  );
  return {
    label: [
      `Using floorplan: ${normalizeFloorplanDisplayName(input.activeFloorplan.displayName)}`,
      workflowStatusLabel(input.activeFloorplan.workflowStatus),
      version?.versionLabel ?? "Version 1"
    ].join(" - "),
    displayName: normalizeFloorplanDisplayName(input.activeFloorplan.displayName),
    statusLabel: workflowStatusLabel(input.activeFloorplan.workflowStatus),
    versionLabel: version?.versionLabel ?? "Version 1",
    technicalIdsHidden: true
  };
}
