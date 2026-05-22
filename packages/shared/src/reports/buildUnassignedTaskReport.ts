import type { OperationalReportBuilderInput } from "./buildOperationalSummaryReport.js";
import type { OperationalReportContract } from "../contracts.js";
import { buildOperationalReport } from "./buildOperationalSummaryReport.js";

export function buildUnassignedTaskReport(
  input: OperationalReportBuilderInput
): OperationalReportContract {
  return buildOperationalReport(input, "unassigned_tasks", "Unassigned Task Report");
}
