import type { OperationalReportBuilderInput } from "./buildOperationalSummaryReport.js";
import type { OperationalReportContract } from "../contracts.js";
import { buildOperationalReport } from "./buildOperationalSummaryReport.js";

export function buildNurseWorkloadReport(
  input: OperationalReportBuilderInput
): OperationalReportContract {
  return buildOperationalReport(input, "nurse_workload", "Nurse Workload Report");
}
