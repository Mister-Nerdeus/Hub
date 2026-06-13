import type { ManualScenarioContract } from "../scenarios/manualScenarioContract.js";
import type { ManualScenarioReviewSummary } from "../scenario-review/manualScenarioReviewSummary.js";

export type ManualComparisonReferenceMatrixRow = {
  scenarioId: string;
  scenarioLabel: string;
  floorplanId: string;
  staffRosterId: string;
  assignmentSetId: string;
  snapshotStatus: string;
  referenceIssues: string;
  manualNotesCount: number;
};

export function buildManualComparisonReferenceMatrix(input: {
  scenarios: readonly ManualScenarioContract[];
  summaries: readonly ManualScenarioReviewSummary[];
  notesByScenarioId?: Record<string, readonly unknown[]>;
}): ManualComparisonReferenceMatrixRow[] {
  return input.scenarios.map((scenario) => {
    const summary = input.summaries.find((entry) => entry.scenarioId === scenario.scenarioId);
    const issueCount = summary?.referenceIssues.length ?? 0;
    return {
      scenarioId: scenario.scenarioId,
      scenarioLabel: scenario.label,
      floorplanId: scenario.floorplanId,
      staffRosterId: scenario.staffRosterId,
      assignmentSetId: scenario.assignmentSetId,
      snapshotStatus: summary?.snapshotStatus ?? "missing",
      referenceIssues: issueCount === 0 ? "None" : String(issueCount),
      manualNotesCount: input.notesByScenarioId?.[scenario.scenarioId]?.length ?? 0
    };
  });
}
