import type { ActiveFloorplanSummaryViewModel } from "./activeFloorplanState";
import { PrimaryWorkflowActions } from "../workflow/PrimaryWorkflowActions";

type FloorplanLandingSummaryProps = {
  activeFloorplan: ActiveFloorplanSummaryViewModel;
  onOpenEditor: () => void;
  onOpenManualAssignment: () => void;
  onOpenScenarioComparison?: () => void;
  onFocusLibrary?: () => void;
  demoPinUnlocked?: boolean;
};

export function FloorplanLandingSummary({
  activeFloorplan,
  onOpenEditor,
  onOpenManualAssignment,
  onOpenScenarioComparison,
  onFocusLibrary,
  demoPinUnlocked = true
}: FloorplanLandingSummaryProps) {
  return (
    <section className="floorplan-landing-summary" aria-labelledby="floorplan-landing-summary-title">
      <div className="floorplan-landing-summary__copy">
        <p className="eyebrow">Primary path</p>
        <h3 id="floorplan-landing-summary-title">Canonical Plan 1 workflow</h3>
        <p>
          Current floorplan: <strong>{activeFloorplan.name}</strong>
        </p>
        <p className="floorplan-landing-summary__status">
          Manual review required. Promotion blocked. Synthetic operational modeling only.
        </p>
      </div>
      <PrimaryWorkflowActions
        actions={[
          { actionId: "review-floorplan", label: "Review Floorplan", onSelect: onFocusLibrary },
          {
            actionId: "edit-working-copy",
            label: "Edit Working Copy",
            disabled: !activeFloorplan.hasActiveFloorplan,
            onSelect: onOpenEditor
          },
          {
            actionId: "manual-assignment",
            label: "Manual Assignment",
            disabled: !demoPinUnlocked,
            onSelect: onOpenManualAssignment
          },
          { actionId: "scenario-comparison", label: "Scenario Comparison", onSelect: onOpenScenarioComparison }
        ]}
      />
    </section>
  );
}
