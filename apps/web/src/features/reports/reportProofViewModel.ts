import {
  aggregateTaskTimeline,
  assignTasksByManualCoverage,
  buildNurseWorkloadReport,
  buildOperationalSummaryReport,
  buildUnassignedTaskReport,
  buildWarningReport,
  validateOperationalReportContract,
  type OperationalReportContract
} from "@nerdeus/shared";

import {
  phase6ReportProofFixture,
  type Phase6ReportProofFixture
} from "../../fixtures/phase6ReportProof";

export type ReportMetric = {
  label: string;
  value: string | number;
};

export type ReportProofViewModel = {
  label: string;
  reports: OperationalReportContract[];
  summaryMetrics: ReportMetric[];
  nurseRows: Array<{
    nurseId: string;
    assignedTaskCount: number;
    estimatedTaskMinutes: number;
    warningCount: number;
  }>;
  unassignedRows: Array<{
    taskId: string;
    roomId: string;
  }>;
  warningRows: Array<{
    code: string;
    count: number;
  }>;
  limitations: string[];
  reportOutput: {
    reports: OperationalReportContract[];
  };
};

export function createReportProofViewModel(
  fixture: Phase6ReportProofFixture = phase6ReportProofFixture
): ReportProofViewModel {
  const timelineSummary = aggregateTaskTimeline(fixture.scenario, fixture.generatedTaskSet);
  const nurseTaskAssignmentResult = assignTasksByManualCoverage({
    plan: fixture.plan,
    roomLoads: fixture.scenario.roomLoads,
    assignmentSet: fixture.manualAssignmentSet,
    generatedTaskSet: fixture.generatedTaskSet
  });

  const builderInput = {
    scenario: fixture.scenario,
    generatedTaskSet: fixture.generatedTaskSet,
    timelineSummary,
    nurseTaskAssignmentResult,
    manualAssignmentSet: fixture.manualAssignmentSet
  };
  const reports = [
    buildOperationalSummaryReport(builderInput),
    buildNurseWorkloadReport(builderInput),
    buildUnassignedTaskReport(builderInput),
    buildWarningReport(builderInput)
  ].map((report) =>
    validateOperationalReportContract(report, {
      scenario: fixture.scenario,
      generatedTaskSet: fixture.generatedTaskSet,
      nurseTaskAssignmentSet: nurseTaskAssignmentResult.assignmentSet,
      manualAssignmentSet: fixture.manualAssignmentSet,
      warnings: nurseTaskAssignmentResult.warnings
    })
  );

  const operationalSummary = reports[0];
  const unassignedReport = reports.find((report) => report.reportType === "unassigned_tasks");
  const warningReport = reports.find((report) => report.reportType === "warnings");
  if (operationalSummary == null) {
    throw new Error("operational summary report must be generated");
  }

  return {
    label: "Operational-only report proof",
    reports,
    summaryMetrics: [
      {
        label: "Generated tasks",
        value: operationalSummary.summary.totalGeneratedTasks
      },
      {
        label: "Assigned tasks",
        value: operationalSummary.summary.assignedTaskCount
      },
      {
        label: "Unassigned tasks",
        value: operationalSummary.summary.unassignedTaskCount
      },
      {
        label: "Estimated minutes",
        value: operationalSummary.summary.totalEstimatedTaskMinutes
      },
      {
        label: "Timeline buckets",
        value: operationalSummary.timelineSummary.bucketCount
      },
      {
        label: "Warnings",
        value: operationalSummary.summary.warningCount
      }
    ],
    nurseRows: operationalSummary.nurseSummaries.map((summary) => ({
      nurseId: summary.nurseId,
      assignedTaskCount: summary.assignedTaskCount,
      estimatedTaskMinutes: summary.estimatedTaskMinutes,
      warningCount: summary.warningCount
    })),
    unassignedRows: (unassignedReport?.unassignedTaskSummary.taskIds ?? []).map(
      (taskId, index) => ({
        taskId,
        roomId: unassignedReport?.unassignedTaskSummary.roomIds[index] ?? ""
      })
    ),
    warningRows: Object.entries(warningReport?.warningSummary.warningCodes ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([code, count]) => ({ code, count })),
    limitations: [...new Set(reports.flatMap((report) => report.limitations))],
    reportOutput: {
      reports
    }
  };
}
