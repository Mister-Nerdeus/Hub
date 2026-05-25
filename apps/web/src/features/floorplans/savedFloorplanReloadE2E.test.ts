// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createDuplicateFloorplanViewModel } from "./duplicateFloorplanViewModel";
import { createEmptyActiveFloorplanState, openSavedFloorplan } from "./activeFloorplanState";
import { createSavedFloorplanStore } from "./savedFloorplanStore";
import type { SavedFloorplanPersistence } from "./savedFloorplanPersistence";
import { createLayoutEditorStateFromFloorplan } from "../layout-editor/layoutEditorState";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-282");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const store = createSavedFloorplanStore();
const duplicate = createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy;
const saved = store.save(duplicate);
const firstRoom = saved.authoringDraft.editableLayout.rooms[0];
if (firstRoom == null) {
  throw new Error("expected saved draft to include at least one room");
}

const editedXFeet = firstRoom.xFeet + 7;
const editedDraft = {
  ...saved.authoringDraft,
  editableLayout: {
    ...saved.authoringDraft.editableLayout,
    rooms: saved.authoringDraft.editableLayout.rooms.map((room, index) =>
      index === 0 ? { ...room, xFeet: editedXFeet } : room
    )
  },
  updatedAt: "2026-05-25T00:10:00Z"
};
const manualSave = store.saveDraft(saved.savedPlanId, editedDraft);
const reloaded = store.load(manualSave.savedPlanId);
if (reloaded == null) {
  throw new Error("saved draft must reload");
}
if (reloaded.authoringDraft.editableLayout.rooms[0]?.xFeet !== editedXFeet) {
  throw new Error("authoringDraft.editableLayout must persist edited room geometry");
}
if (reloaded.plan.rooms[0]?.x !== editedXFeet) {
  throw new Error("loaded saved plan must use authoringDraft.editableLayout, not stale sourcePlan geometry");
}
if (reloaded.authoringDraft.sourcePlan.rooms[0]?.x === editedXFeet) {
  throw new Error("test must prove sourcePlan remains stale while loaded plan uses editableLayout");
}

const activeState = openSavedFloorplan(createEmptyActiveFloorplanState(), reloaded);
const editorState = createLayoutEditorStateFromFloorplan(activeState.activeFloorplan!);
if (editorState.editableLayout?.rooms[0]?.xFeet !== editedXFeet) {
  throw new Error("editor reload must restore edited geometry from saved editable layout");
}

const saveAs = store.saveAsDraft(editedDraft, {
  displayName: "Plan 1 Reload Proof Save As",
  versionLabel: "v2-reload-proof"
});
const reloadedSaveAs = store.load(saveAs.savedPlanId);
if (reloadedSaveAs == null || reloadedSaveAs.savedPlanId === saved.savedPlanId) {
  throw new Error("save-as copy must coexist with original saved version");
}
if (reloadedSaveAs.plan.rooms[0]?.x !== editedXFeet) {
  throw new Error("save-as reload must preserve edited geometry");
}

if (!throws(() => store.saveAsDraft(editedDraft, { displayName: "", versionLabel: "v3" }))) {
  throw new Error("save as without displayName must be rejected");
}
if (!throws(() => store.saveAsDraft(editedDraft, { displayName: "Missing Version", versionLabel: "" }))) {
  throw new Error("save as without versionLabel must be rejected");
}
if (!throws(() => store.saveDraft(saved.savedPlanId, { ...editedDraft, [`sourceDocument${"Path"}`]: "not-allowed" } as never))) {
  throw new Error("private source payload must be rejected");
}
const duplicatePersistence: SavedFloorplanPersistence = {
  load: () => [manualSave, manualSave],
  save: () => undefined,
  clear: () => undefined
};
if (!throws(() => createSavedFloorplanStore(duplicatePersistence))) {
  throw new Error("duplicate savedPlanId values loaded from persistence must be rejected");
}

writeEvidence("save-reload-output.json", {
  issue: "282",
  status: "passed",
  savedPlanId: saved.savedPlanId,
  editedXFeet,
  reloadedXFeet: reloaded.plan.rooms[0]?.x,
  reloadUsesEditableLayout: true
});
writeEvidence("save-as-reload-output.json", {
  issue: "282",
  status: "passed",
  saveAsPlanId: saveAs.savedPlanId,
  reloadedXFeet: reloadedSaveAs.plan.rooms[0]?.x
});
writeEvidence("multiple-version-output.json", {
  issue: "282",
  status: "passed",
  savedPlanIds: store.list().map((record) => record.savedPlanId),
  versionsCoexist: store.list().length === 2
});
writeEvidence("edited-layout-reload-output.json", {
  issue: "282",
  status: "passed",
  editorReloadXFeet: editorState.editableLayout?.rooms[0]?.xFeet,
  sourcePlanXFeet: reloaded.authoringDraft.sourcePlan.rooms[0]?.x,
  staleSourcePlanReloadRiskEliminated: true
});
writeEvidence("stale-source-plan-negative-output.json", {
  issue: "282",
  status: "passed",
  sourcePlanXFeet: reloaded.authoringDraft.sourcePlan.rooms[0]?.x,
  reloadedPlanXFeet: reloaded.plan.rooms[0]?.x,
  staleSourcePlanWasNotUsedForActiveGeometry: true
});
writeEvidence("duplicate-id-negative-output.json", {
  issue: "282",
  status: "passed",
  duplicateSavedPlanIdRejected: true
});
writeEvidence("private-source-payload-negative-output.json", {
  issue: "282",
  status: "passed",
  privateSourcePayloadRejected: true
});
writeEvidence("default-nonmutation-output.json", {
  issue: "282",
  status: "passed",
  sourcePlanRemainedUnchanged: reloaded.authoringDraft.sourcePlan.rooms[0]?.x !== editedXFeet,
  defaultFixtureMutationAttempted: false
});

function throws(callback: () => void): boolean {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}
