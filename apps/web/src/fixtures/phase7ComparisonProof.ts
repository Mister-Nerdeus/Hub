import type {
  NurseOperationalSummary,
  OperationalReportSummary,
  ReportTimelineSummary,
  ReportUnassignedTaskSummary,
  ReportWarningSummary
} from "@nerdeus/shared";

import {
  phase6ReportProofFixture,
  type Phase6ReportProofFixture
} from "./phase6ReportProof";

export type Phase7SyntheticReportOverride = {
  reportId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  nurseTaskAssignmentSetId: string;
  title: string;
  summary: OperationalReportSummary;
  nurseSummaries: NurseOperationalSummary[];
  timelineSummary: ReportTimelineSummary;
  warningSummary: ReportWarningSummary;
  unassignedTaskSummary: ReportUnassignedTaskSummary;
};

export type Phase7ComparisonProofFixture = {
  comparisonId: string;
  comparisonLabel: string;
  exportId: string;
  exportLabel: string;
  reportFixture: Phase6ReportProofFixture;
  comparisonReport: Phase7SyntheticReportOverride;
};

export const phase7ComparisonProofFixture: Phase7ComparisonProofFixture = {
  comparisonId: "scenario-comparison-basic",
  comparisonLabel: "Operational-only scenario comparison proof",
  exportId: "report-export-bundle-basic",
  exportLabel: "Operational-only report export bundle proof",
  reportFixture: phase6ReportProofFixture,
  comparisonReport: {
    reportId: "operational-summary-generated-task-set-surge",
    scenarioId: "shift-scenario-surge",
    generatedTaskSetId: "generated-task-set-surge",
    nurseTaskAssignmentSetId: "nurse-task-assignment-generated-task-set-surge",
    title: "Operational Summary Report - Surge Scenario",
    summary: {
      totalGeneratedTasks: 8,
      assignedTaskCount: 6,
      unassignedTaskCount: 2,
      totalEstimatedTaskMinutes: 96,
      nurseCount: 3,
      warningCount: 2
    },
    nurseSummaries: [
      {
        nurseId: "nurse-alpha",
        assignedTaskCount: 3,
        estimatedTaskMinutes: 31,
        warningCount: 1
      },
      {
        nurseId: "nurse-bravo",
        assignedTaskCount: 1,
        estimatedTaskMinutes: 15,
        warningCount: 0
      },
      {
        nurseId: "nurse-charlie",
        assignedTaskCount: 2,
        estimatedTaskMinutes: 30,
        warningCount: 1
      }
    ],
    timelineSummary: {
      bucketCount: 5,
      busiestMinute: 30,
      busiestMinuteTaskCount: 3,
      totalInterruptiveTasks: 3
    },
    warningSummary: {
      infoCount: 0,
      warningCount: 2,
      criticalCount: 0,
      warningCodes: {
        ROOM_WITHOUT_COVERAGE: 2
      }
    },
    unassignedTaskSummary: {
      unassignedTaskCount: 2,
      taskIds: [
        "task-basic-hall-bed-01-turnover-001",
        "task-surge-room-04-behavioral-002"
      ],
      roomIds: ["hall-bed-01", "room-04"]
    }
  }
};
