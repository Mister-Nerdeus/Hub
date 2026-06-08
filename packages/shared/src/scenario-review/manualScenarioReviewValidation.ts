import {
  manualScenarioReviewIdFor,
  validateManualScenarioReviewContract,
  type ManualScenarioReviewContract,
  type ManualScenarioReviewStatus
} from "./manualScenarioReviewContract.js";

export function createManualScenarioReview(input: {
  scenarioId: string;
  floorplanId: string;
  assignmentSetId: string;
  staffRosterId: string;
  createdAtIso: string;
  updatedAtIso?: string;
  status?: ManualScenarioReviewStatus;
}): ManualScenarioReviewContract {
  return validateManualScenarioReviewContract({
    reviewId: manualScenarioReviewIdFor({ scenarioId: input.scenarioId }),
    scenarioId: input.scenarioId,
    floorplanId: input.floorplanId,
    assignmentSetId: input.assignmentSetId,
    staffRosterId: input.staffRosterId,
    createdAtIso: input.createdAtIso,
    updatedAtIso: input.updatedAtIso ?? input.createdAtIso,
    status: input.status ?? "draft",
    mode: "manual_review"
  });
}
