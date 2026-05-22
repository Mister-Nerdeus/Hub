import type { OperationalReportBuilderInput } from "./buildOperationalSummaryReport.js";
import type { OperationalReportContract } from "../contracts.js";
import { buildOperationalReport } from "./buildOperationalSummaryReport.js";

export function buildWarningReport(input: OperationalReportBuilderInput): OperationalReportContract {
  return buildOperationalReport(input, "warnings", "Warning Report");
}
