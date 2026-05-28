import { neutralWorkloadSeedContract } from "./deterministicSeedContract.js";
import { generateDryRunArtifactBundle } from "./dryRunArtifactGeneration.js";
import { executeInternalDryRun } from "./internalDryRunExecutor.js";

export const DRY_RUN_REPRODUCIBILITY_PROOF_SCHEMA_VERSION = "1.0.0" as const;

export type DryRunReproducibilityProof = {
  schemaVersion: typeof DRY_RUN_REPRODUCIBILITY_PROOF_SCHEMA_VERSION;
  proofId: "simulation-v0-dry-run-reproducibility-proof";
  firstArtifactHash: string;
  secondArtifactHash: string;
  repeatedRunMatches: true;
  taskTimelineEqual: true;
  queuePlaceholderEqual: true;
  changedSeedArtifactHash: string;
  changedSeedChangesHash: true;
  nondeterministicMetadataExcludedFromHash: true;
  hiddenTimeInputStatus: "forbidden";
  hiddenRandomnessStatus: "forbidden";
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
  clinicalSafetyClaim: false;
  staffingComplianceClaim: false;
  patientOutcomePredictionClaim: false;
  syntheticDataOnly: true;
};

export type DryRunReproducibilityStatus = {
  status: "stable_hash_proof_passed";
  label: "stable hash proof passed";
  proofId: DryRunReproducibilityProof["proofId"];
  firstArtifactHash: string;
  secondArtifactHash: string;
  repeatedRunMatches: true;
};

export function buildDryRunReproducibilityProof(): DryRunReproducibilityProof {
  const firstRun = executeInternalDryRun();
  const secondRun = executeInternalDryRun();
  const firstBundle = generateDryRunArtifactBundle(firstRun);
  const secondBundle = generateDryRunArtifactBundle(secondRun);
  const changedSeedBundle = generateDryRunArtifactBundle(
    executeInternalDryRun({
      neutralWorkloadSeed: {
        ...neutralWorkloadSeedContract,
        seedValue: "simulation-v0-neutral-workload-canonical-plan-1-changed"
      }
    })
  );
  if (firstBundle.stableArtifactHash !== secondBundle.stableArtifactHash) {
    throw new Error("same dry-run inputs must produce the same artifact hash");
  }
  if (JSON.stringify(firstRun.timeline) !== JSON.stringify(secondRun.timeline)) {
    throw new Error("same dry-run inputs must produce equal task timelines");
  }
  if (JSON.stringify(firstRun.queueSnapshots) !== JSON.stringify(secondRun.queueSnapshots)) {
    throw new Error("same dry-run inputs must produce equal queue placeholders");
  }
  if (firstBundle.stableArtifactHash === changedSeedBundle.stableArtifactHash) {
    throw new Error("changed neutral workload seed must change artifact hash");
  }
  return {
    schemaVersion: DRY_RUN_REPRODUCIBILITY_PROOF_SCHEMA_VERSION,
    proofId: "simulation-v0-dry-run-reproducibility-proof",
    firstArtifactHash: firstBundle.stableArtifactHash,
    secondArtifactHash: secondBundle.stableArtifactHash,
    repeatedRunMatches: true,
    taskTimelineEqual: true,
    queuePlaceholderEqual: true,
    changedSeedArtifactHash: changedSeedBundle.stableArtifactHash,
    changedSeedChangesHash: true,
    nondeterministicMetadataExcludedFromHash: true,
    hiddenTimeInputStatus: "forbidden",
    hiddenRandomnessStatus: "forbidden",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyClaim: false,
    staffingComplianceClaim: false,
    patientOutcomePredictionClaim: false,
    syntheticDataOnly: true
  };
}

export function buildDryRunReproducibilityStatus(
  proof: DryRunReproducibilityProof = buildDryRunReproducibilityProof()
): DryRunReproducibilityStatus {
  if (!proof.repeatedRunMatches || proof.firstArtifactHash !== proof.secondArtifactHash) {
    throw new Error("dry-run reproducibility proof must pass before UI status can be passed");
  }
  return {
    status: "stable_hash_proof_passed",
    label: "stable hash proof passed",
    proofId: proof.proofId,
    firstArtifactHash: proof.firstArtifactHash,
    secondArtifactHash: proof.secondArtifactHash,
    repeatedRunMatches: true
  };
}
