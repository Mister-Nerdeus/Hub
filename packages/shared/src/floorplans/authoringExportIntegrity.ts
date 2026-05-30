import { validatePlanContract, type PlanContract } from "../contracts.js";
import { validateAuthoringDraftContract, type AuthoringDraftContract } from "./authoringDraftContract.js";

export type AuthoringExportIntegrityResult = {
  status: "passed" | "blocked";
  exportedPlanId: string;
  roomTypeChangesPresent: boolean;
  addedRoomsPresent: boolean;
  doorChangesPresent: boolean;
  supportAccessPointsPresent: boolean;
  splitBaysPresent: boolean;
  generatedHallwayMetadataPresent: boolean;
  podBorderMetadataPresent: boolean;
  pathSyncStatus: AuthoringDraftContract["pathSyncStatus"];
  warnings: string[];
};

export function validateAuthoringExportIntegrity(input: {
  authoringDraft: AuthoringDraftContract;
  exportedPlan: PlanContract;
  expectedRoomIds?: string[];
  expectedDoorIds?: string[];
  expectedSupportAccessPointIds?: string[];
  expectedSplitBayIds?: string[];
  generatedHallwayMetadataPresent?: boolean;
  podBorderMetadataPresent?: boolean;
}): AuthoringExportIntegrityResult {
  const draft = validateAuthoringDraftContract(input.authoringDraft);
  const plan = validatePlanContract(input.exportedPlan);
  const expectedRoomIds = input.expectedRoomIds ?? draft.editableLayout.rooms.map((room) => room.id);
  const expectedDoorIds = input.expectedDoorIds ?? draft.editableLayout.doors.map((door) => door.id);
  const expectedSupportAccessPointIds = input.expectedSupportAccessPointIds ??
    (draft.editableLayout.supportAccessPoints ?? []).map((accessPoint) => accessPoint.id);
  const expectedSplitBayIds = input.expectedSplitBayIds ??
    (draft.editableLayout.splitBays ?? []).map((splitBay) => splitBay.splitBayId);
  const warnings = [...draft.authoringWarnings];
  if (draft.pathSyncStatus === "stale_warning") {
    warnings.push("Path sync is stale; route simulation must warn or block until reviewed.");
  }
  const addedRoomsPresent = expectedRoomIds.every((roomId) =>
    plan.rooms.some((room) => room.id === roomId)
  );
  const doorChangesPresent = expectedDoorIds.every((doorId) =>
    plan.doors.some((door) => door.id === doorId)
  );
  const supportAccessPointsPresent = expectedSupportAccessPointIds.every((accessPointId) =>
    (plan.supportAccessPoints ?? []).some((accessPoint) => accessPoint.id === accessPointId)
  );
  const splitBaysPresent = expectedSplitBayIds.every((splitBayId) =>
    (plan.splitBays ?? []).some((splitBay) => splitBay.splitBayId === splitBayId)
  );
  return {
    status: draft.pathSyncStatus === "blocked" ? "blocked" : "passed",
    exportedPlanId: plan.planId,
    roomTypeChangesPresent: plan.rooms.length > 0,
    addedRoomsPresent,
    doorChangesPresent,
    supportAccessPointsPresent,
    splitBaysPresent,
    generatedHallwayMetadataPresent: input.generatedHallwayMetadataPresent === true,
    podBorderMetadataPresent: input.podBorderMetadataPresent === true,
    pathSyncStatus: draft.pathSyncStatus,
    warnings
  };
}
