import {
  SIMULATION_V0_COMPARISON_ARTIFACT_SCHEMA_VERSION,
  type SimulationV0ComparisonArtifact
} from "./simulationV0ComparisonArtifact.js";

export function validateSimulationV0ComparisonArtifact(
  artifact: SimulationV0ComparisonArtifact
): SimulationV0ComparisonArtifact {
  if (artifact.schemaVersion !== SIMULATION_V0_COMPARISON_ARTIFACT_SCHEMA_VERSION) {
    throw new Error("Simulation v0 comparison artifact schema version is unsupported");
  }
  if (!artifact.sharedWorkload.sameWorkloadForRatios) {
    throw new Error("Simulation v0 comparison must use the same neutral workload for both ratios");
  }
  if (artifact.runs.length !== 2 || new Set(artifact.runs.map((run) => run.ratioPresetId)).size !== 2) {
    throw new Error("Simulation v0 comparison must include one 4:1 and one 3:1 run");
  }
  if (
    artifact.optimizerStatus !== "not_started" ||
    artifact.assignmentRecommendationStatus !== "not_started" ||
    artifact.clinicalSafetyClaim !== false ||
    artifact.staffingComplianceClaim !== false ||
    artifact.patientOutcomePredictionClaim !== false
  ) {
    throw new Error("Simulation v0 comparison must not optimize, recommend, or claim safety/compliance/outcomes");
  }
  return artifact;
}
