import {
  RATIO_AWARE_QUEUE_PLACEHOLDER_SCHEMA_VERSION,
  type RatioAwareQueuePlaceholderSummary
} from "./ratioAwareQueuePlaceholder.js";

export function validateRatioAwareQueuePlaceholderSummary(
  summary: RatioAwareQueuePlaceholderSummary
): RatioAwareQueuePlaceholderSummary {
  if (summary.schemaVersion !== RATIO_AWARE_QUEUE_PLACEHOLDER_SCHEMA_VERSION) {
    throw new Error("ratio-aware queue placeholder schema version is unsupported");
  }
  if (
    summary.outcomeClaim !== false ||
    summary.clinicalSafetyClaim !== false ||
    summary.staffingComplianceClaim !== false ||
    summary.recommendationStatus !== "not_started" ||
    summary.optimizerStatus !== "not_started"
  ) {
    throw new Error("ratio-aware queue placeholder must not claim outcomes, safety, compliance, recommendations, or optimization");
  }
  return summary;
}
