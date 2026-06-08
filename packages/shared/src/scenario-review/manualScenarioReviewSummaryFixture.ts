import { manualScenarioIdFor } from "../scenarios/manualScenarioContract.js";
import { manualScenarioSnapshotIdFor } from "../scenarios/manualScenarioSnapshotContract.js";
import { buildManualScenarioReviewSummary } from "./manualScenarioReviewSummary.js";

const scenarioId = manualScenarioIdFor({ stableSeed: "manual-review-fixture" });

export const manualScenarioReviewSummaryFixture = buildManualScenarioReviewSummary({
  scenario: {
    scenarioId,
    label: "Manual Review Fixture",
    floorplanId: "floorplan-review-fixture",
    assignmentSetId: "assignment-set-review-fixture",
    staffRosterId: "staff-roster-review-fixture",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    mode: "manual"
  },
  snapshots: [
    {
      scenarioSnapshotId: manualScenarioSnapshotIdFor({
        scenarioId,
        floorplanId: "floorplan-review-fixture",
        assignmentSetId: "assignment-set-review-fixture",
        staffRosterId: "staff-roster-review-fixture"
      }),
      scenarioId,
      floorplanId: "floorplan-review-fixture",
      assignmentSetId: "assignment-set-review-fixture",
      staffRosterId: "staff-roster-review-fixture",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual_snapshot"
    }
  ]
});
