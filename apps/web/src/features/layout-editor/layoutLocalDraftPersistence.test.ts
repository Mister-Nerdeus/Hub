import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  buildLayoutLocalDraftRecord,
  loadLayoutLocalDraft,
  resetLayoutLocalDraft,
  saveLayoutLocalDraft,
  inspectLegacyLayoutLocalDraft,
  layoutLocalDraftStorageKey,
  LAYOUT_LOCAL_DRAFT_LEGACY_STORAGE_KEY,
  type LayoutLocalDraftStorage
} from "./layoutLocalDraftPersistence";
import { DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET } from "./layoutWorkspaceConfig";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

function createMemoryStorage(): LayoutLocalDraftStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    }
  };
}

const storage = createMemoryStorage();
const draft = buildLayoutLocalDraftRecord({
  recordId: "saved-plan-1",
  planId: "default-er-layout-plan-1",
  sourceKind: "saved-json",
  parentDefaultPlanId: "default-er-layout-plan-1",
  displayName: "Plan 1 Working Copy",
  updatedAt: "2026-05-29T00:00:00Z",
  editableLayout: layoutEditorProofFixture,
  snapMode: "fine",
  viewport: { pixelsPerFoot: 12, zoom: 1.25, panXFeet: 2, panYFeet: 3 },
  auditTrail: [],
  isDirty: true
});
saveLayoutLocalDraft(storage, draft);
const loaded = loadLayoutLocalDraft(storage, "saved-plan-1");
assert.equal(loaded.status, "loaded");
if (loaded.status !== "loaded") {
  throw new Error("valid local draft should load");
}
assert.equal(loaded.draft.schemaVersion, "2.0.0");
assert.equal(loaded.draft.recordId, "saved-plan-1");
assert.equal(loaded.draft.planId, "default-er-layout-plan-1");
assert.equal(loaded.draft.sourceKind, "saved-json");
assert.equal(loaded.draft.editableLayout.layoutId, layoutEditorProofFixture.layoutId);
assert.equal(loaded.draft.snapMode, "fine");
assert.deepEqual(loaded.draft.dirtyState, { isDirty: true });

assert.equal(
  storage.getItem(layoutLocalDraftStorageKey("saved-plan-1")) != null,
  true
);
assert.equal(loadLayoutLocalDraft(storage, "other-copy").status, "empty");

storage.setItem(layoutLocalDraftStorageKey("saved-plan-1"), "{not-json");
assert.equal(loadLayoutLocalDraft(storage, "saved-plan-1").status, "invalid");

storage.setItem(
  layoutLocalDraftStorageKey("saved-plan-1"),
  JSON.stringify({ ...draft, schemaVersion: "0.0.0" })
);
assert.equal(loadLayoutLocalDraft(storage, "saved-plan-1").status, "schema_mismatch");

storage.setItem(
  layoutLocalDraftStorageKey("saved-plan-1"),
  JSON.stringify({ ...draft, editableLayout: { bad: "layout" } })
);
assert.equal(loadLayoutLocalDraft(storage, "saved-plan-1").status, "invalid");

storage.setItem(
  layoutLocalDraftStorageKey("saved-plan-1"),
  JSON.stringify({ ...draft, history: { past: [], future: [] } })
);
assert.equal(loadLayoutLocalDraft(storage, "saved-plan-1").status, "invalid");

storage.setItem(
  layoutLocalDraftStorageKey("saved-plan-1"),
  JSON.stringify({
    ...draft,
    layoutBoundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 64, heightFeet: 40 }
  })
);
const loadedOldDraft = loadLayoutLocalDraft(storage, "saved-plan-1");
assert.equal(loadedOldDraft.status, "loaded");
if (loadedOldDraft.status !== "loaded") {
  throw new Error("old local draft should load without workspace bounds");
}
assert.equal("layoutBoundsFeet" in loadedOldDraft.draft, false);
assert.deepEqual(DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET, {
  xFeet: 0,
  yFeet: 0,
  widthFeet: 180,
  heightFeet: 120
});

saveLayoutLocalDraft(storage, draft);
resetLayoutLocalDraft(storage, "saved-plan-1");
assert.equal(loadLayoutLocalDraft(storage, "saved-plan-1").status, "empty");

storage.setItem(LAYOUT_LOCAL_DRAFT_LEGACY_STORAGE_KEY, JSON.stringify({ schemaVersion: "1.0.0" }));
assert.equal(inspectLegacyLayoutLocalDraft(storage).status, "legacy_available");
assert.equal(loadLayoutLocalDraft(storage, "saved-plan-1").status, "empty");
