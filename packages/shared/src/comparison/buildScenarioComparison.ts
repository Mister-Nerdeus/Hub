import type {
  OperationalReportContract,
  ScenarioComparisonContract,
  ScenarioComparisonItem
} from "../contracts.js";
import {
  validateOperationalReportContract,
  validateScenarioComparisonContract
} from "../contracts.js";

export type ScenarioComparisonBuilderInput = {
  comparisonId: string;
  label: string;
  baselineReportId: string;
  reports: OperationalReportContract[];
  createdAt?: string;
};

export const SCENARIO_COMPARISON_CREATED_AT = "2026-05-22T00:00:00Z";

export const SCENARIO_COMPARISON_LIMITATIONS = [
  "Operational-only comparison of deterministic synthetic report outputs.",
  "No optimizer or workload rebalancing is applied.",
  "No scenario recommendation is made.",
  "No clinical safety claim is made.",
  "No task-completion simulation, walking route calculation, or delay calculation is performed."
];

export function buildScenarioComparison(
  input: ScenarioComparisonBuilderInput
): ScenarioComparisonContract {
  if (input.reports.length === 0) {
    throw new Error("reports requires at least one operational report");
  }

  const reports = input.reports.map((report) => validateOperationalReportContract(report));
  const reportIds = reports.map((report) => report.reportId);
  if (new Set(reportIds).size !== reportIds.length) {
    throw new Error("duplicate report ids are not allowed");
  }
  const baselineReport = reports.find((report) => report.reportId === input.baselineReportId);
  if (baselineReport == null) {
    throw new Error("baselineReportId must reference an included report");
  }

  const orderedReports = [
    baselineReport,
    ...reports
      .filter((report) => report.reportId !== baselineReport.reportId)
      .sort((left, right) => left.reportId.localeCompare(right.reportId))
  ];
  const items = orderedReports.map((report) =>
    buildScenarioComparisonItem(report, report.reportId === baselineReport.reportId)
  );

  const comparison: ScenarioComparisonContract = {
    schemaVersion: "1.0.0",
    comparisonId: input.comparisonId,
    comparisonType: "manual_scenario_comparison",
    createdAt: input.createdAt ?? SCENARIO_COMPARISON_CREATED_AT,
    label: input.label,
    baselineReportId: baselineReport.reportId,
    reportIds: orderedReports.map((report) => report.reportId),
    items,
    summary: {
      reportCount: items.length,
      baselineReportId: baselineReport.reportId,
      maxGeneratedTasks: Math.max(...items.map((item) => item.totalGeneratedTasks)),
      maxAssignedTaskCount: Math.max(...items.map((item) => item.assignedTaskCount)),
      maxUnassignedTaskCount: Math.max(...items.map((item) => item.unassignedTaskCount)),
      maxEstimatedTaskMinutes: Math.max(
        ...items.map((item) => item.totalEstimatedTaskMinutes)
      ),
      maxWarningCount: Math.max(...items.map((item) => item.warningCount)),
      maxBusiestMinuteTaskCount: Math.max(
        ...items.map((item) => item.busiestMinuteTaskCount)
      )
    },
    limitations: [...SCENARIO_COMPARISON_LIMITATIONS]
  };

  return validateScenarioComparisonContract(comparison, { reports: orderedReports });
}

function buildScenarioComparisonItem(
  report: OperationalReportContract,
  isBaseline: boolean
): ScenarioComparisonItem {
  return {
    reportId: report.reportId,
    scenarioId: report.scenarioId,
    label: report.title,
    isBaseline,
    totalGeneratedTasks: report.summary.totalGeneratedTasks,
    assignedTaskCount: report.summary.assignedTaskCount,
    unassignedTaskCount: report.summary.unassignedTaskCount,
    totalEstimatedTaskMinutes: report.summary.totalEstimatedTaskMinutes,
    warningCount: report.summary.warningCount,
    busiestMinute: report.timelineSummary.busiestMinute,
    busiestMinuteTaskCount: report.timelineSummary.busiestMinuteTaskCount
  };
}
