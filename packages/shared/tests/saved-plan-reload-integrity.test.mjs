import { validateSavedPlanRecordContract } from "../dist/index.js";
import { testAuthoringDraft } from "./authoring-test-helpers.mjs";

const draft = testAuthoringDraft({
  editableLayout: {
    ...testAuthoringDraft().editableLayout,
    rooms: testAuthoringDraft().editableLayout.rooms.map((room, index) =>
      index === 0 ? { ...room, xFeet: room.xFeet + 5 } : room
    )
  },
  updatedAt: "2026-05-25T00:15:00Z"
});
const record = validateSavedPlanRecordContract({
  savedPlanId: "saved-reload-proof",
  sourceDefaultPlanId: draft.sourceDefaultPlanId,
  planId: draft.planId,
  displayName: draft.displayName,
  versionLabel: draft.versionLabel,
  createdAt: draft.createdAt,
  updatedAt: draft.updatedAt,
  saveKind: "manual_save",
  authoringDraft: draft,
  sourceProvenance: draft.sourceProvenance,
  syntheticDataOnly: true
});

if (record.authoringDraft.editableLayout.rooms[0].xFeet === record.authoringDraft.sourcePlan.rooms[0].x) {
  throw new Error("saved record test must represent edited geometry distinct from stale source geometry");
}
if (record.authoringDraft.editableLayout.rooms[0].xFeet !== draft.editableLayout.rooms[0].xFeet) {
  throw new Error("saved records must persist edited editableLayout geometry");
}
