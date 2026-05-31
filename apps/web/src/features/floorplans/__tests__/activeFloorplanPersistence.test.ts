import {
  ACTIVE_FLOORPLAN_STORAGE_KEY,
  readPersistedActiveFloorplanSelection,
  writePersistedActiveFloorplanSelection
} from "../activeFloorplanPersistence";

const storage = createMemoryStorage();
writePersistedActiveFloorplanSelection(storage, {
  schemaVersion: "1.0.0",
  activeFloorplanId: "active-floorplan",
  activeFloorplanVersionId: "version-1"
});

const persisted = readPersistedActiveFloorplanSelection(storage);
if (persisted?.activeFloorplanVersionId !== "version-1") {
  throw new Error("active floorplan selection should round-trip through persistence");
}

storage.setItem(ACTIVE_FLOORPLAN_STORAGE_KEY, "{not-json");
const corrupted = readPersistedActiveFloorplanSelection(storage);
if (corrupted != null) {
  throw new Error("corrupted active floorplan persistence should return null");
}
if (storage.getItem(ACTIVE_FLOORPLAN_STORAGE_KEY) != null) {
  throw new Error("corrupted active floorplan persistence should be cleared");
}

function createMemoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    }
  };
}
