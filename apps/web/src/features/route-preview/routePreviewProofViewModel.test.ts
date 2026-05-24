import { createRoutePreviewProofViewModel } from "./routePreviewProofViewModel";
import { defaultPlanFixtures } from "../../fixtures/defaultPlans";

const viewModel = createRoutePreviewProofViewModel();

if (viewModel.planOptions.length !== 5) {
  throw new Error("route preview proof must load all five default plans");
}

if (viewModel.routePreview.status !== "reachable") {
  throw new Error("default route preview selection must be reachable");
}

if (viewModel.routePreview.routeNodeIds.length === 0 || viewModel.routePreview.routeEdgeIds.length === 0) {
  throw new Error("reachable route preview must expose route nodes and edges");
}

if (viewModel.limitations.length === 0) {
  throw new Error("route preview proof must expose limitations");
}

for (const fixture of defaultPlanFixtures) {
  const planViewModel = createRoutePreviewProofViewModel({ selectedPlanId: fixture.plan.planId });
  if (planViewModel.selectedPlanId !== fixture.plan.planId) {
    throw new Error(`route preview proof failed to select ${fixture.plan.planId}`);
  }
  if (planViewModel.routePreview.planId !== fixture.plan.planId) {
    throw new Error(`route preview output plan mismatch for ${fixture.plan.planId}`);
  }
  if (planViewModel.planOptions.every((plan) => plan.planId !== fixture.plan.planId)) {
    throw new Error(`route preview option missing ${fixture.plan.planId}`);
  }
}

const before = JSON.stringify(defaultPlanFixtures);
createRoutePreviewProofViewModel({
  selectedPlanId: "default-er-layout-plan-1",
  originPathNodeId: "node-entry-ems",
  destinationPathNodeId: "node-door-room-01"
});
const after = JSON.stringify(defaultPlanFixtures);
if (before !== after) {
  throw new Error("route preview proof view model must not mutate default plans");
}

const sameNodeViewModel = createRoutePreviewProofViewModel({
  selectedPlanId: "default-er-layout-plan-1",
  originPathNodeId: "node-entry-ems",
  destinationPathNodeId: "node-entry-ems"
});
if (sameNodeViewModel.routePreview.status !== "invalid") {
  throw new Error("same-node route preview proof selection must return invalid output");
}
if (
  sameNodeViewModel.routePreview.warnings.every(
    (warning) => warning.code !== "SAME_ORIGIN_DESTINATION_NODE"
  )
) {
  throw new Error("same-node route preview proof selection must expose a deterministic warning");
}

const prohibited = ["safe", "unsafe", "recommendation", "certify"];
const textOutput = JSON.stringify(viewModel).toLowerCase();
if (prohibited.some((word) => textOutput.includes(word))) {
  throw new Error("route preview proof output must avoid prohibited claim wording");
}
