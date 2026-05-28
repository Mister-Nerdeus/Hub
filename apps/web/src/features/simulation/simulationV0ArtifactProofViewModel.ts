import type { DryRunArtifactBundle, InternalDryRunExecutorOutput } from "@nerdeus/shared";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0ArtifactProofViewModel = {
  artifactId: string;
  runId: string;
  stableArtifactHash: string;
  reproducibilityStatus: "stable_hash_proof_passed";
  neutralWorkloadSeed: string;
  ratioRuntimeSeed: string;
  hashExcludesNondeterministicMetadata: true;
  syntheticDataOnly: true;
  profileId: SimulationV0ReviewState["activityProfileId"];
  ratioView: SimulationV0ReviewState["ratioView"];
};

export function buildSimulationV0ArtifactProofViewModel(input: {
  reviewState: SimulationV0ReviewState;
  run: InternalDryRunExecutorOutput;
  bundle: DryRunArtifactBundle;
  repeatedBundle: DryRunArtifactBundle;
}): SimulationV0ArtifactProofViewModel {
  if (input.bundle.stableArtifactHash !== input.repeatedBundle.stableArtifactHash) {
    throw new Error("same Simulation v0 review inputs must produce the same artifact hash");
  }
  return {
    artifactId: input.bundle.bundleId,
    runId: input.run.runId,
    stableArtifactHash: input.bundle.stableArtifactHash,
    reproducibilityStatus: "stable_hash_proof_passed",
    neutralWorkloadSeed: input.run.neutralWorkloadSeedId,
    ratioRuntimeSeed: input.run.ratioRuntimeSeedId,
    hashExcludesNondeterministicMetadata: input.bundle.hashExcludesNondeterministicMetadata,
    syntheticDataOnly: input.bundle.syntheticDataOnly,
    profileId: input.reviewState.activityProfileId,
    ratioView: input.reviewState.ratioView
  };
}
