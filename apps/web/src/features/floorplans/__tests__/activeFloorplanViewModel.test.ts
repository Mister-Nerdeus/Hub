import {
  createEmptyActiveFloorplanState,
  openDefaultFloorplan,
  openReviewCandidateFloorplan
} from "../activeFloorplanState";
import { createOperationalActiveFloorplanViewModel } from "../activeFloorplanViewModel";

const empty = createOperationalActiveFloorplanViewModel(createEmptyActiveFloorplanState());
if (!empty.hasActiveFloorplan || empty.planId !== "default-er-layout-plan-1") {
  throw new Error("empty active floorplan state should default to canonical Plan 1");
}

const activeState = openDefaultFloorplan(createEmptyActiveFloorplanState(), "default-er-layout-plan-1");
const active = createOperationalActiveFloorplanViewModel(activeState);
if (!active.hasActiveFloorplan || active.promotionStatusLabel !== "Promotion blocked") {
  throw new Error("active floorplan summary must preserve promotion block");
}

const reviewCandidateState = openReviewCandidateFloorplan(createEmptyActiveFloorplanState(), "plan-2");
const reviewCandidate = createOperationalActiveFloorplanViewModel(reviewCandidateState);
if (
  !reviewCandidate.hasActiveFloorplan ||
  reviewCandidate.sourceKindLabel !== "Route-repaired review candidate" ||
  reviewCandidate.routeStatusLabel !== "Route/export ready" ||
  reviewCandidate.manualReviewStatusLabel !== "Manual review required" ||
  reviewCandidate.promotionStatusLabel !== "Promotion blocked"
) {
  throw new Error("review candidates must open as active without implying approval or promotion");
}
