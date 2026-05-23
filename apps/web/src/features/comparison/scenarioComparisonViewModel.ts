import {
  aggregateTaskTimeline,
  assignTasksByManualCoverage,
  buildOperationalSummaryReport,
  buildReportExportBundle,
  buildScenarioComparison,
  validateOperationalReportContract,
  validateReportExportBundleContract,
  validateScenarioComparisonContract,
  type OperationalReportContract,
  type ReportExportBundleContract,
  type ScenarioComparisonContract,
  type ScenarioComparisonItem
} from "@nerdeus/shared";

import {
  phase7ComparisonProofFixture,
  type Phase7ComparisonProofFixture
} from "../../fixtures/phase7ComparisonProof";

export type ComparisonMetric = {
  label: string;
  value: string | number;
};

export type ScenarioComparisonProofViewModel = {
  label: string;
  operationalOnlyLabel: string;
  comparison: ScenarioComparisonContract;
  baseline: ScenarioComparisonItem;
  comparisonRows: ScenarioComparisonItem[];
  summaryMetrics: ComparisonMetric[];
  exportBundle: ReportExportBundleContract;
  exportPreview: {
    exportId: string;
    exportType: string;
    reportCount: number;
    comparisonId: string;
    generatedBy: string;
    source: string;
  };
  limitations: string[];
  exportJsonPreview: string;
  proofOutput: {
    comparison: ScenarioComparisonContract;
    exportBundle: ReportExportBundleContract;
  };
};

export function createScenarioComparisonProofViewModel(
  fixture: Phase7ComparisonProofFixture = phase7ComparisonProofFixture
): ScenarioComparisonProofViewModel {
  const timelineSummary = aggregateTaskTimeline(
    fixture.reportFixture.scenario,
    fixture.reportFixture.generatedTaskSet
  );
  const nurseTaskAssignmentResult = assignTasksByManualCoverage({
    plan: fixture.reportFixture.plan,
    roomLoads: fixture.reportFixture.scenario.roomLoads,
    assignmentSet: fixture.reportFixture.manualAssignmentSet,
    generatedTaskSet: fixture.reportFixture.generatedTaskSet
  });
  const baselineReport = buildOperationalSummaryReport({
    scenario: fixture.reportFixture.scenario,
    generatedTaskSet: fixture.reportFixture.generatedTaskSet,
    timelineSummary,
    nurseTaskAssignmentResult,
    manualAssignmentSet: fixture.reportFixture.manualAssignmentSet
  });
  const comparisonReport = validateOperationalReportContract({
    ...baselineReport,
    ...fixture.comparisonReport,
    limitations: [...baselineReport.limitations]
  });
  const reports: OperationalReportContract[] = [baselineReport, comparisonReport];
  const comparison = validateScenarioComparisonContract(
    buildScenarioComparison({
      comparisonId: fixture.comparisonId,
      label: fixture.comparisonLabel,
      baselineReportId: baselineReport.reportId,
      reports: [comparisonReport, baselineReport]
    }),
    { reports }
  );
  const exportBundle = validateReportExportBundleContract(
    buildReportExportBundle({
      exportId: fixture.exportId,
      label: fixture.exportLabel,
      reports,
      comparison
    })
  );
  const baseline = comparison.items.find((item) => item.isBaseline);
  if (baseline == null) {
    throw new Error("comparison baseline item missing");
  }

  return {
    label: fixture.comparisonLabel,
    operationalOnlyLabel: "Operational-only comparison and JSON bundle preview",
    comparison,
    baseline,
    comparisonRows: comparison.items,
    summaryMetrics: [
      { label: "Reports", value: comparison.summary.reportCount },
      { label: "Max generated tasks", value: comparison.summary.maxGeneratedTasks },
      { label: "Max assigned tasks", value: comparison.summary.maxAssignedTaskCount },
      { label: "Max unassigned tasks", value: comparison.summary.maxUnassignedTaskCount },
      { label: "Max estimated minutes", value: comparison.summary.maxEstimatedTaskMinutes },
      { label: "Max warnings", value: comparison.summary.maxWarningCount }
    ],
    exportBundle,
    exportPreview: {
      exportId: exportBundle.exportId,
      exportType: exportBundle.exportType,
      reportCount: exportBundle.reports.length,
      comparisonId: exportBundle.comparison?.comparisonId ?? "",
      generatedBy: exportBundle.metadata.generatedBy,
      source: exportBundle.metadata.source
    },
    limitations: [
      ...new Set([
        ...comparison.limitations,
        ...exportBundle.limitations,
        ...exportBundle.reports.flatMap((report) => report.limitations)
      ])
    ],
    exportJsonPreview: JSON.stringify(exportBundle, null, 2),
    proofOutput: {
      comparison,
      exportBundle
    }
  };
}
