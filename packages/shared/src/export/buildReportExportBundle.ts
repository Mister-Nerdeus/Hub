import type {
  OperationalReportContract,
  ReportExportBundleContract,
  ReportExportBundleMetadata,
  ScenarioComparisonContract
} from "../contracts.js";
import {
  validateOperationalReportContract,
  validateReportExportBundleContract,
  validateScenarioComparisonContract
} from "../contracts.js";

export type ReportExportBundleBuilderInput = {
  exportId: string;
  label: string;
  reports: OperationalReportContract[];
  comparison?: ScenarioComparisonContract | null;
  createdAt?: string;
};

export const REPORT_EXPORT_BUNDLE_CREATED_AT = "2026-05-22T00:00:00Z";

export const REPORT_EXPORT_BUNDLE_LIMITATIONS = [
  "Operational-only JSON evidence bundle based on deterministic synthetic report outputs.",
  "No optimizer or workload rebalancing is applied.",
  "No scenario recommendation is made.",
  "No clinical safety claim is made.",
  "No API endpoint, persistence behavior, PDF export, or file download behavior is included."
];

export const REPORT_EXPORT_BUNDLE_METADATA: ReportExportBundleMetadata = {
  appName: "ER Pod Shift Simulator",
  appVersion: "0.1.0",
  generatedBy: "local-proof",
  source: "synthetic-operational-data"
};

export function buildReportExportBundle(
  input: ReportExportBundleBuilderInput
): ReportExportBundleContract {
  if (input.reports.length === 0) {
    throw new Error("reports requires at least one operational report");
  }

  const reports = input.reports.map((report) => validateOperationalReportContract(report));
  const reportIds = reports.map((report) => report.reportId);
  if (new Set(reportIds).size !== reportIds.length) {
    throw new Error("duplicate report ids are not allowed");
  }

  const comparison =
    input.comparison == null
      ? null
      : validateScenarioComparisonContract(input.comparison, { reports });

  const bundle: ReportExportBundleContract = {
    schemaVersion: "1.0.0",
    exportId: input.exportId,
    exportType: "operational_report_bundle",
    createdAt: input.createdAt ?? REPORT_EXPORT_BUNDLE_CREATED_AT,
    label: input.label,
    reports,
    comparison,
    limitations: [...REPORT_EXPORT_BUNDLE_LIMITATIONS],
    metadata: { ...REPORT_EXPORT_BUNDLE_METADATA }
  };

  return validateReportExportBundleContract(bundle);
}
