import {
  validateAssignmentSetContract,
  type AssignmentSetContract
} from "@nerdeus/shared";

export const ASSIGNMENT_SET_STORAGE_KEY = "nerdeus.assignmentSets.v1";

export type AssignmentSetStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function readPersistedAssignmentSets(
  storage: AssignmentSetStorage | null,
  key = ASSIGNMENT_SET_STORAGE_KEY
): AssignmentSetContract[] {
  if (storage == null) return [];
  const raw = storage.getItem(key);
  if (raw == null || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(validateAssignmentSetContract);
  } catch {
    storage.removeItem(key);
    return [];
  }
}

export function writePersistedAssignmentSets(
  storage: AssignmentSetStorage | null,
  assignmentSets: readonly AssignmentSetContract[],
  key = ASSIGNMENT_SET_STORAGE_KEY
): void {
  storage?.setItem(key, JSON.stringify(assignmentSets.map(validateAssignmentSetContract)));
}
