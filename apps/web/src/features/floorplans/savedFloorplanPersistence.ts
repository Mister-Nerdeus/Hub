import {
  validateSavedPlanRecordContract,
  type SavedPlanRecordContract
} from "@nerdeus/shared";
import { recordSavedRecordTraceStage } from "../layout-editor/layoutSaveTrace";

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
      const validatedRecords = records.map(validateSavedPlanRecordContract);
      storage.setItem(
        key,
        JSON.stringify(validatedRecords)
      );
      const lastRecord = validatedRecords[validatedRecords.length - 1];
      if (lastRecord != null) {
        recordSavedRecordTraceStage("persistedLocalStoragePayload", lastRecord);
      }
    },
    clear() {
      storage.removeItem(key);
    }
  };
}
