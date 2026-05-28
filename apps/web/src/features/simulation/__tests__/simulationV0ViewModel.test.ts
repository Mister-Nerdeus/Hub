import { createSimulationV0InternalDryRunViewModel } from "../simulationV0ViewModel";

const viewModel = createSimulationV0InternalDryRunViewModel();

if (viewModel.reproducibilityStatus !== "stable hash proof passed") {
  throw new Error("Simulation v0 reproducibility status must be derived from a passing proof");
}

if (viewModel.reproducibilityStatus.includes("pending")) {
  throw new Error("Simulation v0 reproducibility status must not stay pending after proof passes");
}

if (viewModel.status !== "internal synthetic dry-run only") {
  throw new Error("Simulation v0 route must remain internal synthetic dry-run only");
}

for (const forbidden of [
  "recommended assignment",
  "best assignment",
  "clinical safety score",
  "staffing compliance",
  "patient outcome prediction"
]) {
  if (viewModel.reproducibilityStatus.toLowerCase().includes(forbidden)) {
    throw new Error(`Simulation v0 status must not include forbidden claim: ${forbidden}`);
  }
}
