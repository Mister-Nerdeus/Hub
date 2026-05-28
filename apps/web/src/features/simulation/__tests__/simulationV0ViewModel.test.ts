import { createSimulationV0InternalDryRunViewModel } from "../simulationV0ViewModel";

const viewModel = createSimulationV0InternalDryRunViewModel();

if (viewModel.artifactProof.reproducibilityStatus !== "stable_hash_proof_passed") {
  throw new Error("Simulation v0 artifact proof must be derived from a passing reproducibility proof");
}

if (viewModel.artifactProof.reproducibilityStatus.includes("pending")) {
  throw new Error("Simulation v0 reproducibility status must not stay pending after proof passes");
}

if (viewModel.status !== "internal_synthetic_dry_run_only") {
  throw new Error("Simulation v0 route must remain internal synthetic dry-run only");
}

if (viewModel.reviewState.activityProfileId !== "typical" || viewModel.reviewState.ratioView !== "comparison") {
  throw new Error("Simulation v0 default review state must be typical comparison");
}

if (viewModel.timeline.visibleRows.length > 25) {
  throw new Error("Simulation v0 timeline must be bounded to 25 visible rows");
}

if (!viewModel.summaryCards.cards.every((card) => card.source === "dry_run_artifact")) {
  throw new Error("Simulation v0 summary cards must derive from dry-run artifacts");
}

if (viewModel.artifactExport.jsonText.includes("credential")) {
  throw new Error("Simulation v0 export must not include an access credential");
}

for (const forbidden of [
  "recommended assignment",
  "best assignment",
  "compliant staffing"
]) {
  if (JSON.stringify(viewModel).toLowerCase().includes(forbidden)) {
    throw new Error(`Simulation v0 status must not include forbidden claim: ${forbidden}`);
  }
}
