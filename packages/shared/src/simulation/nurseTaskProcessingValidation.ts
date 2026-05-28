import {
  NURSE_TASK_PROCESSING_LOOP_SCHEMA_VERSION,
  type NurseTaskProcessingResult
} from "./nurseTaskProcessingLoop.js";

export function validateNurseTaskProcessingResult(
  result: NurseTaskProcessingResult
): NurseTaskProcessingResult {
  if (result.schemaVersion !== NURSE_TASK_PROCESSING_LOOP_SCHEMA_VERSION) {
    throw new Error("nurse task processing loop schema version is unsupported");
  }
  if (
    result.assignmentSource !== "manual_assignment_bridge_only" ||
    result.reassignmentSearchStatus !== "not_started" ||
    result.recommendationStatus !== "not_started" ||
    result.optimizerStatus !== "not_started" ||
    result.staffingComplianceClaim !== false ||
    result.clinicalSafetyClaim !== false
  ) {
    throw new Error("nurse task processing must not recommend, optimize, reassign, or claim safety/compliance");
  }
  return result;
}
