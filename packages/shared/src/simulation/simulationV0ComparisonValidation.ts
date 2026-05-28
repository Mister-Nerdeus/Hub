import {
  SIMULATION_V0_COMPARISON_ARTIFACT_SCHEMA_VERSION,
  type SimulationV0ComparisonArtifact
} from "./simulationV0ComparisonArtifact.js";
import {
  FOUR_TO_ONE_RUNTIME_SEED_ID,
  THREE_TO_ONE_RUNTIME_SEED_ID
} from "./deterministicSeedContract.js";

export function validateSimulationV0ComparisonArtifact(
  artifact: SimulationV0ComparisonArtifact
): SimulationV0ComparisonArtifact {
  if (artifact.schemaVersion !== SIMULATION_V0_COMPARISON_ARTIFACT_SCHEMA_VERSION) {
    throw new Error("Simulation v0 comparison artifact schema version is unsupported");
  }
  if (!artifact.sharedWorkload.sameWorkloadForRatios) {
    throw new Error("Simulation v0 comparison must use the same neutral workload for both ratios");
  }
  if (artifact.runs.length !== 2) {
    throw new Error("Simulation v0 comparison must include exactly two ratio runs");
  }
  const fourToOneRuns = artifact.runs.filter((run) => run.ratioPresetId === "four_to_one");
  const threeToOneRuns = artifact.runs.filter((run) => run.ratioPresetId === "three_to_one");
  if (fourToOneRuns.length !== 1 || threeToOneRuns.length !== 1) {
    throw new Error("Simulation v0 comparison must include exactly one 4:1 run and one 3:1 run");
  }
  const fourToOneRun = fourToOneRuns[0];
  const threeToOneRun = threeToOneRuns[0];
  if (fourToOneRun == null || threeToOneRun == null) {
    throw new Error("Simulation v0 comparison ratio runs are missing");
  }
  if (fourToOneRun.ratioRuntimeSeedId !== FOUR_TO_ONE_RUNTIME_SEED_ID) {
    throw new Error("Simulation v0 4:1 run must use the 4:1 runtime seed");
  }
  if (threeToOneRun.ratioRuntimeSeedId !== THREE_TO_ONE_RUNTIME_SEED_ID) {
    throw new Error("Simulation v0 3:1 run must use the 3:1 runtime seed");
  }
  if (artifact.ratioRuntime.fourToOneRuntimeSeedId !== FOUR_TO_ONE_RUNTIME_SEED_ID) {
    throw new Error("Simulation v0 comparison ratio runtime summary must include the 4:1 runtime seed");
  }
  if (artifact.ratioRuntime.threeToOneRuntimeSeedId !== THREE_TO_ONE_RUNTIME_SEED_ID) {
    throw new Error("Simulation v0 comparison ratio runtime summary must include the 3:1 runtime seed");
  }
  if (artifact.sharedWorkload.generatedTaskCount !== artifact.sharedWorkload.taskInstanceIds.length) {
    throw new Error("Simulation v0 shared workload task id count must match generated task count");
  }
  if (new Set(artifact.sharedWorkload.taskInstanceIds).size !== artifact.sharedWorkload.taskInstanceIds.length) {
    throw new Error("Simulation v0 shared workload task ids must be unique");
  }
  for (const run of artifact.runs) {
    if (run.generatedTaskCount !== artifact.sharedWorkload.generatedTaskCount) {
      throw new Error("Simulation v0 run generated task count must match shared workload");
    }
  }
  const limitationText = artifact.limitationCopy.join(" ").toLowerCase();
  for (const required of [
    "internal synthetic dry-run",
    "same neutral synthetic workload",
    "no optimizer",
    "assignment recommendation",
    "clinical safety",
    "staffing compliance",
    "patient outcome prediction"
  ]) {
    if (!limitationText.includes(required)) {
      throw new Error(`Simulation v0 comparison limitation copy must include ${required}`);
    }
  }
  if (artifact.internalOnlyStatus !== "internal_dry_run_only") {
    throw new Error("Simulation v0 comparison must remain internal dry-run only");
  }
  if (artifact.syntheticDataOnly !== true) {
    throw new Error("Simulation v0 comparison must use synthetic data only");
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
