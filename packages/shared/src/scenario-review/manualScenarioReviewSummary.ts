import type { ManualScenarioContract } from "../scenarios/manualScenarioContract.js";
import type { ManualScenarioSnapshotContract } from "../scenarios/manualScenarioSnapshotContract.js";
import {
  classifyManualScenarioReferenceIssues,
  type ManualScenarioReferenceIssue
} from "./manualScenarioReferenceIssueClassifier.js";

export type ManualScenarioReviewSummary = {
  scenarioId: string;
  floorplanId: string;
  staffRosterId: string;
  assignmentSetId: string;
  snapshotStatus: "present" | "missing" | "stale_reference";
  referenceIssues: ManualScenarioReferenceIssue[];
};

export function buildManualScenarioReviewSummary(input: {
  scenario: ManualScenarioContract;
  snapshots: readonly ManualScenarioSnapshotContract[];
  floorplanId?: string | null;
  assignmentSetId?: string | null;
  staffRosterId?: string | null;
}): ManualScenarioReviewSummary {
  const referenceIssues = classifyManualScenarioReferenceIssues({
    scenario: input.scenario,
    snapshots: input.snapshots,
    floorplanId: input.floorplanId ?? input.scenario.floorplanId,
    assignmentSetId: input.assignmentSetId ?? input.scenario.assignmentSetId,
    staffRosterId: input.staffRosterId ?? input.scenario.staffRosterId
  });
  const stale = referenceIssues.some((entry) => entry.type === "stale_snapshot_reference");
  const missing = referenceIssues.some((entry) => entry.type === "missing_snapshot");
  return {
    scenarioId: input.scenario.scenarioId,
    floorplanId: input.scenario.floorplanId,
    staffRosterId: input.scenario.staffRosterId,
    assignmentSetId: input.scenario.assignmentSetId,
    snapshotStatus: missing ? "missing" : stale ? "stale_reference" : "present",
    referenceIssues
  };
}
