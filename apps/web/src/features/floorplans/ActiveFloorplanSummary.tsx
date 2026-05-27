import type { ActiveFloorplanSummaryViewModel } from "./activeFloorplanState";

type ActiveFloorplanSummaryProps = {
  viewModel: ActiveFloorplanSummaryViewModel;
  onLaunchEditor?: () => void;
};

export function ActiveFloorplanSummary({ viewModel, onLaunchEditor }: ActiveFloorplanSummaryProps) {
  return (
    <section className="active-floorplan" aria-labelledby="active-floorplan-title">
      <div className="active-floorplan__header">
        <div>
          <p className="eyebrow">Active floorplan</p>
          <h2 id="active-floorplan-title">{viewModel.name}</h2>
        </div>
        {viewModel.hasActiveFloorplan ? (
          <span>{viewModel.readOnly ? "Read-only" : "Editable"}</span>
        ) : (
          <span>None</span>
        )}
      </div>
      <div className="active-floorplan__actions">
        <button type="button" disabled={!viewModel.hasActiveFloorplan} onClick={onLaunchEditor}>
          {viewModel.editorLaunchLabel}
        </button>
      </div>

      {viewModel.hasActiveFloorplan && viewModel.objectCounts != null ? (
        <>
          <dl className="active-floorplan__status">
            <div>
              <dt>Plan</dt>
              <dd>{viewModel.planId}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{viewModel.sourceKindLabel}</dd>
            </div>
            <div>
              <dt>Import</dt>
              <dd>{viewModel.importStatus}</dd>
            </div>
            <div>
              <dt>Mapping</dt>
              <dd>{viewModel.mappingStatus ?? viewModel.parentDefaultPlanId}</dd>
            </div>
            <div>
              <dt>Route/export</dt>
              <dd>{viewModel.routeStatusLabel}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{viewModel.manualReviewStatusLabel}</dd>
            </div>
            <div>
              <dt>Promotion</dt>
              <dd>{viewModel.promotionStatusLabel}</dd>
            </div>
          </dl>
          <dl className="active-floorplan__counts" aria-label="Active floorplan object counts">
            <div>
              <dt>Rooms</dt>
              <dd>{viewModel.objectCounts.rooms}</dd>
            </div>
            <div>
              <dt>Halls</dt>
              <dd>{viewModel.objectCounts.hallways}</dd>
            </div>
            <div>
              <dt>Doors</dt>
              <dd>{viewModel.objectCounts.doors}</dd>
            </div>
            <div>
              <dt>Stations</dt>
              <dd>{viewModel.objectCounts.nurseStations}</dd>
            </div>
            <div>
              <dt>Zones</dt>
              <dd>{viewModel.objectCounts.zones}</dd>
            </div>
            <div>
              <dt>Nodes</dt>
              <dd>{viewModel.objectCounts.pathNodes}</dd>
            </div>
            <div>
              <dt>Edges</dt>
              <dd>{viewModel.objectCounts.pathEdges}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </section>
  );
}
