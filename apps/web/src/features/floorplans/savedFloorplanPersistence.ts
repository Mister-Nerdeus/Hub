import {
  validateSavedPlanRecordContract,
  type SavedPlanRecordContract
} from "@nerdeus/shared";

const STORAGE_KEY = "nerdeus.floorplans.savedAuthoringRecords.v1";

export type SavedFloorplanPersistenceStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type SavedFloorplanPersistence = {
  load(): SavedPlanRecordContract[];
  save(records: SavedPlanRecordContract[]): void;
  clear(): void;
};

export function createSavedFloorplanPersistence(
  storage: SavedFloorplanPersistenceStorage,
  key = STORAGE_KEY
): SavedFloorplanPersistence {
  return {
    load() {
      const raw = storage.getItem(key);
      if (raw == null || raw.trim().length === 0) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("saved floorplan persistence payload must be an array");
      }
      return parsed.map(validateSavedPlanRecordContract);
    },
    save(records) {
      storage.setItem(
        key,
        JSON.stringify(records.map(validateSavedPlanRecordContract))
      );
    },
    clear() {
      storage.removeItem(key);
    }
  };
}
