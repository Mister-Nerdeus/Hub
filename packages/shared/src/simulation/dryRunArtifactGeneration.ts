import { stableDryRunHash } from "./deterministicSequence.js";
import {
  DRY_RUN_ARTIFACT_SCHEMA_VERSION,
  type DryRunArtifactBundle,
  type DryRunArtifactMetadata
} from "./dryRunArtifactContract.js";
import type { InternalDryRunExecutorOutput } from "./internalDryRunExecutor.js";

export function generateDryRunArtifactBundle(run: InternalDryRunExecutorOutput): DryRunArtifactBundle {
  const metadata: DryRunArtifactMetadata = {
    canonicalScenarioSeedId: run.canonicalScenarioSeedId,
    canonicalFloorplanId: run.canonicalFloorplanId,
    ratioPresetId: run.ratioPresetId,
    activityProfileId: run.activityProfileId,
    neutralWorkloadSeedId: run.neutralWorkloadSeedId,
    ratioRuntimeSeedId: run.ratioRuntimeSeedId,
    generatedMetadataPolicy: "no_current_time_in_stable_hash",
    syntheticDataOnly: true,
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started"
  };
  const eventArtifact = {
    schemaVersion: DRY_RUN_ARTIFACT_SCHEMA_VERSION,
    artifactId: `${run.eventArtifactId}.json`,
    artifactType: "event_timeline" as const,
    runId: run.runId,
    metadata,
    timeline: run.timeline
  };
  const taskSummaryArtifact = {
    schemaVersion: DRY_RUN_ARTIFACT_SCHEMA_VERSION,
    artifactId: `${run.runId}-task-summary.json`,
    artifactType: "task_summary" as const,
    runId: run.runId,
    metadata,
    summary: {
      generatedTaskCount: run.summaryCounts.generatedTaskCount,
      taskInstanceIds: run.taskSet.instances.map((task) => task.taskInstanceId)
    }
  };
  const nurseRuntimeSummaryArtifact = {
    schemaVersion: DRY_RUN_ARTIFACT_SCHEMA_VERSION,
    artifactId: `${run.runId}-nurse-runtime-summary.json`,
    artifactType: "nurse_runtime_summary" as const,
    runId: run.runId,
    metadata,
    summary: {
      syntheticNurseSnapshotCount: run.nurseRuntimeSnapshots.length,
      snapshots: run.nurseRuntimeSnapshots
    }
  };
  const queuePlaceholderSummaryArtifact = {
    schemaVersion: DRY_RUN_ARTIFACT_SCHEMA_VERSION,
    artifactId: `${run.runId}-queue-placeholder-summary.json`,
    artifactType: "queue_placeholder_summary" as const,
    runId: run.runId,
    metadata,
    summary: run.summaryCounts
  };
  const limitationsMarkdown = [
    "# Simulation v0 Internal Dry-Run Limitations",
    "",
    ...run.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
  const stableArtifactHash = buildStableArtifactHash({
    eventArtifact,
    taskSummaryArtifact,
    nurseRuntimeSummaryArtifact,
    queuePlaceholderSummaryArtifact,
    limitationsMarkdown
  });

  return {
    schemaVersion: DRY_RUN_ARTIFACT_SCHEMA_VERSION,
    bundleId: `${run.runId}-artifact-bundle`,
    runId: run.runId,
    eventArtifact,
    taskSummaryArtifact,
    nurseRuntimeSummaryArtifact,
    queuePlaceholderSummaryArtifact,
    limitationsMarkdown,
    stableArtifactHash,
    hashExcludesNondeterministicMetadata: true,
    clinicalSafetyClaim: false,
    staffingComplianceClaim: false,
    patientOutcomePredictionClaim: false,
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    syntheticDataOnly: true
  };
}

export function buildStableArtifactHash(value: unknown): string {
  return stableDryRunHash(stableJson(value)).toString(16);
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "generatedAt" && key !== "createdAt")
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
