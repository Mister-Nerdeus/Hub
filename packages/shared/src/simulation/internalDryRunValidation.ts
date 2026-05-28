import {
  INTERNAL_DRY_RUN_EVENT_LABELS,
  INTERNAL_DRY_RUN_EXECUTOR_SCHEMA_VERSION,
  type InternalDryRunExecutorOutput
} from "./internalDryRunExecutor.js";

export function validateInternalDryRunExecutorOutput(
  value: InternalDryRunExecutorOutput
): InternalDryRunExecutorOutput {
  if (value.schemaVersion !== INTERNAL_DRY_RUN_EXECUTOR_SCHEMA_VERSION) {
    throw new Error("internal dry-run executor schema version is unsupported");
  }
  if (
    value.dormantFullEventContractStatus !== "dormant" ||
    value.optimizerStatus !== "not_started" ||
    value.assignmentRecommendationStatus !== "not_started" ||
    value.clinicalSafetyClaim !== false ||
    value.staffingComplianceClaim !== false ||
    value.patientOutcomePredictionClaim !== false
  ) {
    throw new Error("internal dry-run executor must remain internal-only with no optimizer or claims");
  }
  for (const event of value.timeline) {
    if (!INTERNAL_DRY_RUN_EVENT_LABELS.includes(event.eventLabel)) {
      throw new Error("internal dry-run timeline event label is unsupported");
    }
    if (event.syntheticDataOnly !== true || event.dryRunStatus !== "internal_dry_run_only") {
      throw new Error("internal dry-run timeline events must stay synthetic and internal");
    }
  }
  if (value.summaryCounts.generatedTaskCount !== value.taskSet.instances.length) {
    throw new Error("internal dry-run summary must match generated task count");
  }
  return value;
}
