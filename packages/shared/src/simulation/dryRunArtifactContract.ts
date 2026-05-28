import type { InternalDryRunExecutorOutput } from "./internalDryRunExecutor.js";

export const DRY_RUN_ARTIFACT_SCHEMA_VERSION = "1.0.0" as const;

export type DryRunEventArtifact = {
  schemaVersion: typeof DRY_RUN_ARTIFACT_SCHEMA_VERSION;
  artifactId: string;
  artifactType: "event_timeline";
  runId: string;
  metadata: DryRunArtifactMetadata;
  timeline: InternalDryRunExecutorOutput["timeline"];
};

export type DryRunSummaryArtifact = {
  schemaVersion: typeof DRY_RUN_ARTIFACT_SCHEMA_VERSION;
  artifactId: string;
  artifactType: "task_summary" | "nurse_runtime_summary" | "queue_placeholder_summary";
  runId: string;
  metadata: DryRunArtifactMetadata;
  summary: unknown;
};

export type DryRunArtifactMetadata = {
  canonicalScenarioSeedId: string;
  canonicalFloorplanId: string;
  ratioPresetId: string;
  activityProfileId: string;
  neutralWorkloadSeedId: string;
  ratioRuntimeSeedId: string;
  generatedMetadataPolicy: "no_current_time_in_stable_hash";
  syntheticDataOnly: true;
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
};

export type DryRunArtifactBundle = {
  schemaVersion: typeof DRY_RUN_ARTIFACT_SCHEMA_VERSION;
  bundleId: string;
  runId: string;
  eventArtifact: DryRunEventArtifact;
  taskSummaryArtifact: DryRunSummaryArtifact;
  nurseRuntimeSummaryArtifact: DryRunSummaryArtifact;
  queuePlaceholderSummaryArtifact: DryRunSummaryArtifact;
  limitationsMarkdown: string;
  stableArtifactHash: string;
  hashExcludesNondeterministicMetadata: true;
  clinicalSafetyClaim: false;
  staffingComplianceClaim: false;
  patientOutcomePredictionClaim: false;
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
  syntheticDataOnly: true;
};
