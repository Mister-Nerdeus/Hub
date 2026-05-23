import type {
  ReportExportBundleContract,
  ReportExportBundleImportSummary
} from "../contracts.js";
import { validateReportExportBundleContract } from "../contracts.js";

export function parseReportExportBundleJson(jsonText: string): ReportExportBundleContract {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid report export bundle JSON: ${detail}`);
  }

  return validateReportExportBundleContract(parsed);
}

export function summarizeReportExportBundle(
  bundle: ReportExportBundleContract
): ReportExportBundleImportSummary {
  const validated = validateReportExportBundleContract(bundle);
  const scenarioIds = uniqueSorted(validated.reports.map((report) => report.scenarioId));
  const reportIds = uniqueSorted(validated.reports.map((report) => report.reportId));
  const limitations = uniqueSorted([
    ...validated.limitations,
    ...(validated.comparison?.limitations ?? []),
    ...validated.reports.flatMap((report) => report.limitations)
  ]);

  return {
    exportId: validated.exportId,
    reportCount: validated.reports.length,
    hasComparison: validated.comparison != null,
    comparisonId: validated.comparison?.comparisonId ?? null,
    scenarioIds,
    reportIds,
    limitations
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
