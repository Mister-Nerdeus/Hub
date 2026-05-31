import type { ReactNode } from "react";
import type { FloorplanReadinessContract } from "@nerdeus/shared";
import { ActiveFloorplanSelector } from "./ActiveFloorplanSelector";
import type { ActiveFloorplanSelectorViewModel } from "./activeFloorplanSelectorViewModel";
import { FloorplanReadinessChecklist } from "./FloorplanReadinessChecklist";

type ActiveFloorplanHubProps = {
  selectorViewModel: ActiveFloorplanSelectorViewModel;
  readinessViewModel: FloorplanReadinessContract | null;
  statusMessage: string | null;
  advancedContent: ReactNode;
  onEditFloorplan: () => void;
  onUseForAssignment: () => void;
  onUseForSimulation: () => void;
  onChangeFloorplan: (versionId: string) => void;
};

export function ActiveFloorplanHub({
  selectorViewModel,
  readinessViewModel,
  statusMessage,
  advancedContent,
  onEditFloorplan,
  onUseForAssignment,
  onUseForSimulation,
  onChangeFloorplan
}: ActiveFloorplanHubProps) {
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
            onUseForSimulation={onUseForSimulation}
            onChangeFloorplan={onChangeFloorplan}
            onOpenAdvanced={() => document.getElementById("floorplan-advanced-panel")?.scrollIntoView()}
          />
        </div>

        <section
          className="active-floorplan-hub__thumbnail"
          aria-labelledby="active-floorplan-thumbnail-title"
          data-floorplan-thumbnail-slot="true"
        >
          <p className="eyebrow">Preview</p>
          <h3 id="active-floorplan-thumbnail-title">Thumbnail</h3>
          <p>{selectorViewModel.displayName}</p>
        </section>

        <section
          className="active-floorplan-hub__next-step"
          aria-labelledby="active-floorplan-next-step-title"
          data-floorplan-next-step-slot="true"
        >
          <p className="eyebrow">What do I do next?</p>
          <h3 id="active-floorplan-next-step-title">Prepare assignment setup</h3>
          <p>Review this floorplan, then open Assignments when the floorplan is ready.</p>
        </section>

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
            <FloorplanReadinessChecklist viewModel={readinessViewModel} />
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
