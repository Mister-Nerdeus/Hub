import { createSimulationV0RouteViewModel } from "../simulationV0ViewModel";

const viewModel = createSimulationV0RouteViewModel({
  activityProfileId: "slammed",
  ratioView: "four_to_one"
});

if (viewModel.status !== "internal_synthetic_dry_run_only") {
  throw new Error("Simulation v0 route status must be the internal synthetic dry-run literal");
}

if (
  viewModel.controlsRegion.landmarkId !== "simulation-v0-controls" ||
  viewModel.outputRegion.landmarkId !== "simulation-v0-output" ||
  viewModel.proofRegion.landmarkId !== "simulation-v0-proof"
) {
  throw new Error("Simulation v0 route contract must expose stable route regions");
}

if (viewModel.dryRunReviews.length !== 1) {
  throw new Error("Single-ratio Simulation v0 route contract must render one dry-run review");
}

if (viewModel.occupiedBedProof.profileId !== "slammed") {
  throw new Error("Simulation v0 proof panels must derive from shared review state");
}

if (
  viewModel.forbiddenClaims.optimizer ||
  viewModel.forbiddenClaims.assignmentRecommendation ||
  viewModel.forbiddenClaims.clinicalSafety ||
  viewModel.forbiddenClaims.staffingCompliance ||
  viewModel.forbiddenClaims.patientOutcome
) {
  throw new Error("Simulation v0 route contract must keep forbidden claims false");
}
