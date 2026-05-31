import type { ReactNode } from "react";
import type { ActiveFloorplanContract, FloorplanReadinessContract } from "@nerdeus/shared";
import { ActiveFloorplanThumbnail } from "./ActiveFloorplanThumbnail";
import { ActiveFloorplanSelector } from "./ActiveFloorplanSelector";
import type { ActiveFloorplanSelectorViewModel } from "./activeFloorplanSelectorViewModel";
import { FloorplanReadinessSummary } from "./FloorplanReadinessSummary";
import { createFloorplanThumbnailViewModel } from "./floorplanThumbnailViewModel";
import { NextWorkflowStepCard } from "./NextWorkflowStepCard";
import {
  createNextWorkflowStepViewModel,
  type NextWorkflowTargetSection
} from "./nextWorkflowStepViewModel";

type ActiveFloorplanHubProps = {
  activeFloorplan: ActiveFloorplanContract | null;
  selectorViewModel: ActiveFloorplanSelectorViewModel;
  readinessViewModel: FloorplanReadinessContract | null;
  statusMessage: string | null;
  advancedContent: ReactNode;
  onEditFloorplan: () => void;
  onUseForAssignment: () => void;
  onChangeFloorplan: (versionId: string) => void;
  onNavigateToSection: (targetSection: NextWorkflowTargetSection) => void;
};

export function ActiveFloorplanHub({
  activeFloorplan,
  selectorViewModel,
  readinessViewModel,
  statusMessage,
  advancedContent,
  onEditFloorplan,
  onUseForAssignment,
  onChangeFloorplan,
  onNavigateToSection
}: ActiveFloorplanHubProps) {
  const thumbnailViewModel = createFloorplanThumbnailViewModel(activeFloorplan);
  const nextWorkflowStepViewModel = createNextWorkflowStepViewModel({
    activeFloorplan,
    assignmentSetState: "not_started",
    scenarioAssumptionsState: "not_started"
  });

  return (
    <section
      className="active-floorplan-hub"
      aria-labelledby="active-floorplan-hub-title"
      data-active-floorplan-hub="true"
    >
      <div className="active-floorplan-hub__header">
        <div>
          <p className="eyebrow">Floorplan hub</p>
          <h2 id="active-floorplan-hub-title">Floorplan</h2>
        </div>
        <p className="active-floorplan-hub__status">
          {selectorViewModel.statusLabel}
        </p>
      </div>

      {statusMessage == null ? null : (
        <p className="floorplan-status-message" role="status">{statusMessage}</p>
      )}

      <div className="active-floorplan-hub__grid">
        <div data-active-floorplan-card-slot="true">
          <ActiveFloorplanSelector
            viewModel={selectorViewModel}
            onEditFloorplan={onEditFloorplan}
            onUseForAssignment={onUseForAssignment}
            onChangeFloorplan={onChangeFloorplan}
            onOpenAdvanced={() => document.getElementById("floorplan-advanced-panel")?.scrollIntoView()}
          />
        </div>

        <div data-floorplan-thumbnail-slot="true">
          <ActiveFloorplanThumbnail viewModel={thumbnailViewModel} />
        </div>

        <div data-floorplan-next-step-slot="true">
          <NextWorkflowStepCard
            viewModel={nextWorkflowStepViewModel}
            onNavigate={onNavigateToSection}
          />
        </div>

        <section
          className="active-floorplan-hub__version"
          aria-labelledby="active-floorplan-version-summary-title"
          data-floorplan-version-summary="true"
        >
          <p className="eyebrow">Version summary</p>
          <h3 id="active-floorplan-version-summary-title">{selectorViewModel.selectedVersionLabel}</h3>
          <p>{selectorViewModel.lastSavedLabel}</p>
          <p>{selectorViewModel.versionOptions.length} saved version options available.</p>
        </section>

        <div
          className="active-floorplan-hub__readiness"
          data-floorplan-readiness-summary-slot="true"
        >
          {readinessViewModel == null ? null : (
            <FloorplanReadinessSummary viewModel={readinessViewModel} />
          )}
        </div>
      </div>

      <details
        className="floorplan-advanced-panel active-floorplan-hub__advanced"
        data-floorplan-hub-advanced-evidence="collapsed"
      >
        <summary>Advanced/Evidence</summary>
        <div id="floorplan-advanced-panel" className="floorplan-advanced-panel__body">
          {advancedContent}
        </div>
      </details>
    </section>
  );
}
