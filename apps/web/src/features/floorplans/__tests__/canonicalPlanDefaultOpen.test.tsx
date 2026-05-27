import {
  createActiveFloorplanSummaryViewModel,
  createEmptyActiveFloorplanState
} from "../activeFloorplanState";

const state = createEmptyActiveFloorplanState();
const summary = createActiveFloorplanSummaryViewModel(state);

if (state.activeCanonicalFloorplanId !== "default-er-layout-plan-1") {
  throw new Error("active canonical floorplan ID must be Plan 1");
}
if (state.activeFloorplan?.planId !== "default-er-layout-plan-1") {
  throw new Error("Plan 1 must open by default");
}
if (!summary.hasActiveFloorplan || summary.name === "No active floorplan") {
  throw new Error("operator path must not start in a no-active-floorplan state");
}
