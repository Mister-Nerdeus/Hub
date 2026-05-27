import type { ActiveFloorplanSummaryViewModel } from "./activeFloorplanState";

type FloorplanLandingSummaryProps = {
  activeFloorplan: ActiveFloorplanSummaryViewModel;
  onOpenEditor: () => void;
  onOpenManualAssignment: () => void;
  onFocusLibrary?: () => void;
};

export function FloorplanLandingSummary({
  activeFloorplan,
  onOpenEditor,
  onOpenManualAssignment,
  onFocusLibrary
}: FloorplanLandingSummaryProps) {
  return (
    <section className="floorplan-landing-summary" aria-labelledby="floorplan-landing-summary-title">
      <div className="floorplan-landing-summary__copy">
        <p className="eyebrow">Primary path</p>
        <h3 id="floorplan-landing-summary-title">Floorplans to editor to manual assignment</h3>
        <p>
          Current floorplan: <strong>{activeFloorplan.name}</strong>
        </p>
        <p className="floorplan-landing-summary__status">
          Manual review required. Promotion blocked. Synthetic operational modeling only.
        </p>
      </div>
      <div className="floorplan-landing-summary__actions">
        <button type="button" disabled={!activeFloorplan.hasActiveFloorplan} onClick={onOpenEditor}>
          Open Editor
        </button>
        <button type="button" onClick={onOpenManualAssignment}>
          Open Manual Assignment
        </button>
        <button type="button" onClick={onFocusLibrary}>
          Floorplan Library
        </button>
      </div>
    </section>
  );
}
