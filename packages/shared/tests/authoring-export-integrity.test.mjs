import { validateAuthoringExportIntegrity } from "../dist/index.js";
import { testAuthoringDraft, testPlan } from "./authoring-test-helpers.mjs";

const result = validateAuthoringExportIntegrity({
  authoringDraft: testAuthoringDraft(),
  exportedPlan: testPlan,
  expectedRoomIds: ["room-01"],
  expectedDoorIds: ["door-room-01"],
  generatedHallwayMetadataPresent: true,
  podBorderMetadataPresent: true
});
if (
  result.status !== "passed" ||
  !result.addedRoomsPresent ||
  !result.doorChangesPresent ||
  result.pathSyncStatus !== "stale_warning" ||
  result.warnings.length === 0
) {
  throw new Error("authoring export integrity must prove edited content and stale path sync warning");
}
