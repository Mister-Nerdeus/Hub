import type { ReactNode } from "react";
import type { ActiveFloorplanContract, FloorplanReadinessContract } from "@nerdeus/shared";
import { ActiveFloorplanSelector } from "./ActiveFloorplanSelector";
import type { ActiveFloorplanSelectorViewModel } from "./activeFloorplanSelectorViewModel";
import { ActiveFloorplanThumbnail } from "./ActiveFloorplanThumbnail";
import { FloorplanAdvancedPanel } from "./FloorplanAdvancedPanel";
import { FloorplanReadinessChecklist } from "./FloorplanReadinessChecklist";
import type { FloorplanVersionHistoryItem } from "./floorplanVersionHistory";
import { formatFloorplanSavedTime } from "./floorplanVersionNaming";
import { NextWorkflowStepCard } from "./NextWorkflowStepCard";

type ActiveFloorplanHubProps = {
  activeFloorplan: ActiveFloorplanContract;
  selectorViewModel: ActiveFloorplanSelectorViewModel;
  readinessViewModel: FloorplanReadinessContract;
  versions: readonly FloorplanVersionHistoryItem[];
  advancedContent: ReactNode;
  onEditFloorplan: () => void;
  onUseForAssignment: () => void;
  onPrepareForSimulation: () => void;
  onChangeFloorplan: (versionId: string) => void;
  onOpenAdvanced: () => void;
};

export function ActiveFloorplanHub({
  activeFloorplan,
  selectorViewModel,
  readinessViewModel,
  versions,
  advancedContent,
  onEditFloorplan,
  onUseForAssignment,
  onPrepareForSimulation,
  onChangeFloorplan,
  onOpenAdvanced
}: ActiveFloorplanHubProps) {
  const currentVersion = versions.find((version) => version.versionId === activeFloorplan.activeFloorplanVersionId);

  return (
    <section
      className="active-floorplan-hub"
      aria-labelledby="active-floorplan-hub-title"
      data-active-floorplan-hub="normal"
      data-advanced-technical-details-hidden="true"
    >
      <header className="active-floorplan-hub__header">
        <div>
          <p className="eyebrow">Active Floorplan Hub</p>
          <h3 id="active-floorplan-hub-title">One active floorplan</h3>
        </div>
        <span>{readinessViewModel.assignmentStatus === "ready_for_assignment" ? "Ready for assignments" : "Needs floorplan review"}</span>
      </header>
      <div className="active-floorplan-hub__grid">
        <ActiveFloorplanSelector
          viewModel={selectorViewModel}
          onEditFloorplan={onEditFloorplan}
          onUseForAssignment={onUseForAssignment}
          onPrepareForSimulation={onPrepareForSimulation}
          onChangeFloorplan={onChangeFloorplan}
          onOpenAdvanced={onOpenAdvanced}
        />
        <ActiveFloorplanThumbnail activeFloorplan={activeFloorplan} />
      </div>
      <NextWorkflowStepCard
        canUseForAssignment={selectorViewModel.canUseForAssignment}
        canPrepareForSimulation={selectorViewModel.canUseForSimulation}
        onUseForAssignment={onUseForAssignment}
        onPrepareForSimulation={onPrepareForSimulation}
      />
      <FloorplanReadinessChecklist viewModel={readinessViewModel} />
      <section className="active-floorplan-version-summary" aria-labelledby="active-floorplan-version-summary-title">
        <h3 id="active-floorplan-version-summary-title">Version summary</h3>
        <dl>
          <div>
            <dt>Selected version</dt>
            <dd>{currentVersion?.versionLabel ?? selectorViewModel.selectedVersionLabel}</dd>
          </div>
          <div>
            <dt>Saved versions</dt>
            <dd>{versions.length}</dd>
          </div>
          <div>
            <dt>Last saved</dt>
            <dd>{formatFloorplanSavedTime(activeFloorplan.savedAt)}</dd>
          </div>
        </dl>
      </section>
      <FloorplanAdvancedPanel>
        {advancedContent}
      </FloorplanAdvancedPanel>
    </section>
  );
}
