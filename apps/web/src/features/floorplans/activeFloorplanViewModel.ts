import type { ActiveFloorplanState } from "./activeFloorplanState";
import { createActiveFloorplanSummaryViewModel } from "./activeFloorplanState";

export function createOperationalActiveFloorplanViewModel(state: ActiveFloorplanState) {
  const summary = createActiveFloorplanSummaryViewModel(state);
  return {
    ...summary,
    routeStatusLabel: summary.hasActiveFloorplan ? "Route/export status available in review workflow" : "No active route/export status",
    manualReviewStatusLabel: summary.hasActiveFloorplan ? "Manual review required" : "No active floorplan",
    promotionStatusLabel: summary.hasActiveFloorplan ? "Promotion blocked" : "No active floorplan",
    editorLaunchLabel: summary.hasActiveFloorplan ? "Launch editor from active floorplan" : "Open a floorplan first"
  };
}
