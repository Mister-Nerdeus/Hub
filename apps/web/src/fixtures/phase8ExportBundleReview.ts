import {
  aggregateTaskTimeline,
  assignTasksByManualCoverage,
  buildOperationalSummaryReport,
  buildReportExportBundle,
  buildScenarioComparison,
  validateOperationalReportContract,
  type OperationalReportContract
} from "@nerdeus/shared";

import { phase7ComparisonProofFixture } from "./phase7ComparisonProof";

const timelineSummary = aggregateTaskTimeline(
  phase7ComparisonProofFixture.reportFixture.scenario,
  phase7ComparisonProofFixture.reportFixture.generatedTaskSet
);
const nurseTaskAssignmentResult = assignTasksByManualCoverage({
  plan: phase7ComparisonProofFixture.reportFixture.plan,
  roomLoads: phase7ComparisonProofFixture.reportFixture.scenario.roomLoads,
  assignmentSet: phase7ComparisonProofFixture.reportFixture.manualAssignmentSet,
  generatedTaskSet: phase7ComparisonProofFixture.reportFixture.generatedTaskSet
});
const baselineReport = buildOperationalSummaryReport({
  scenario: phase7ComparisonProofFixture.reportFixture.scenario,
  generatedTaskSet: phase7ComparisonProofFixture.reportFixture.generatedTaskSet,
  timelineSummary,
  nurseTaskAssignmentResult,
  manualAssignmentSet: phase7ComparisonProofFixture.reportFixture.manualAssignmentSet
});
const comparisonReport = validateOperationalReportContract({
  ...baselineReport,
  ...phase7ComparisonProofFixture.comparisonReport,
  limitations: [...baselineReport.limitations]
});
const reports: OperationalReportContract[] = [baselineReport, comparisonReport];
const comparison = buildScenarioComparison({
  comparisonId: phase7ComparisonProofFixture.comparisonId,
  label: phase7ComparisonProofFixture.comparisonLabel,
  baselineReportId: baselineReport.reportId,
  reports: [comparisonReport, baselineReport]
});
const exportBundle = buildReportExportBundle({
  exportId: phase7ComparisonProofFixture.exportId,
  label: phase7ComparisonProofFixture.exportLabel,
  reports,
  comparison
});

export const phase8ExportBundleJsonText = JSON.stringify(exportBundle, null, 2);

export const invalidPhase8ExportBundleJsonText = `{
  "schemaVersion": "1.0.0",
  "exportId": "broken-phase-8-review"
`;
