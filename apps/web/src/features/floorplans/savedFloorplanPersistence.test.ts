import { createDuplicateFloorplanViewModel } from "./duplicateFloorplanViewModel";
import { createSavedFloorplanPersistence } from "./savedFloorplanPersistence";
import { createSavedFloorplanStore } from "./savedFloorplanStore";

const backing = new Map<string, string>();
const storage = {
  getItem: (key: string) => backing.get(key) ?? null,
  setItem: (key: string, value: string) => {
    backing.set(key, value);
  },
  removeItem: (key: string) => {
    backing.delete(key);
  }
};

const persistence = createSavedFloorplanPersistence(storage);
const store = createSavedFloorplanStore(persistence);
const duplicate = createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy;
const saved = store.save(duplicate);
const savedAs = store.saveAsDraft(saved.authoringDraft, {
  displayName: "Plan 1 Authoring Version 2",
  versionLabel: "v2"
});

if (saved.savedPlanId === savedAs.savedPlanId) {
  throw new Error("Save As must create a unique saved plan ID");
}
if (store.list().length !== 2) {
  throw new Error("multiple saved copies per default plan must be allowed");
}

const reloadedStore = createSavedFloorplanStore(createSavedFloorplanPersistence(storage));
if (reloadedStore.load(saved.savedPlanId) == null || reloadedStore.load(savedAs.savedPlanId) == null) {
  throw new Error("saved records must persist through persistence reload");
}
