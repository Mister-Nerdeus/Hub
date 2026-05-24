import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  buildLayoutLocalDraftRecord,
  loadLayoutLocalDraft,
  resetLayoutLocalDraft,
  saveLayoutLocalDraft,
  LAYOUT_LOCAL_DRAFT_STORAGE_KEY,
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
  editableLayout: layoutEditorProofFixture,
  snapMode: "fine",
  viewport: { pixelsPerFoot: 12, zoom: 1.25, panXFeet: 2, panYFeet: 3 },
  auditTrail: [],
  isDirty: true
});
saveLayoutLocalDraft(storage, draft);
const loaded = loadLayoutLocalDraft(storage);
assert.equal(loaded.status, "loaded");
if (loaded.status !== "loaded") {
  throw new Error("valid local draft should load");
}
assert.equal(loaded.draft.schemaVersion, "1.0.0");
assert.equal(loaded.draft.editableLayout.layoutId, layoutEditorProofFixture.layoutId);
assert.equal(loaded.draft.snapMode, "fine");
assert.deepEqual(loaded.draft.dirtyState, { isDirty: true });

storage.setItem(LAYOUT_LOCAL_DRAFT_STORAGE_KEY, "{not-json");
assert.equal(loadLayoutLocalDraft(storage).status, "invalid");

storage.setItem(
  LAYOUT_LOCAL_DRAFT_STORAGE_KEY,
  JSON.stringify({ ...draft, schemaVersion: "0.0.0" })
);
assert.equal(loadLayoutLocalDraft(storage).status, "schema_mismatch");

storage.setItem(
  LAYOUT_LOCAL_DRAFT_STORAGE_KEY,
  JSON.stringify({ ...draft, editableLayout: { bad: "layout" } })
);
assert.equal(loadLayoutLocalDraft(storage).status, "invalid");

storage.setItem(
  LAYOUT_LOCAL_DRAFT_STORAGE_KEY,
  JSON.stringify({ ...draft, history: { past: [], future: [] } })
);
assert.equal(loadLayoutLocalDraft(storage).status, "invalid");

storage.setItem(
  LAYOUT_LOCAL_DRAFT_STORAGE_KEY,
  JSON.stringify({
    ...draft,
    layoutBoundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 64, heightFeet: 40 }
  })
);
const loadedOldDraft = loadLayoutLocalDraft(storage);
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
resetLayoutLocalDraft(storage);
assert.equal(loadLayoutLocalDraft(storage).status, "empty");
