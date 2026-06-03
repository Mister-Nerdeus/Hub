import {
  validateManualAssignmentSetContract,
  type ManualAssignmentSetContract
} from "@nerdeus/shared";

const STORAGE_KEY = "nerdeus.manualAssignmentFoundation.assignmentSet.v1";

export type ManualAssignmentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readManualAssignmentSet(storage: ManualAssignmentStorage | null): ManualAssignmentSetContract | null {
  if (storage == null) return null;
  const text = storage.getItem(STORAGE_KEY);
  if (text == null) return null;
  try {
    return validateManualAssignmentSetContract(JSON.parse(text));
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function readManualAssignmentSetForFloorplan(
  storage: ManualAssignmentStorage | null,
  floorplanId: string
): ManualAssignmentSetContract | null {
  const assignmentSet = readManualAssignmentSet(storage);
  return assignmentSet?.floorplanId === floorplanId ? assignmentSet : null;
}

export function writeManualAssignmentSet(
  storage: ManualAssignmentStorage | null,
  assignmentSet: ManualAssignmentSetContract
): ManualAssignmentSetContract {
  const valid = validateManualAssignmentSetContract(assignmentSet);
  storage?.setItem(STORAGE_KEY, JSON.stringify(valid));
  return valid;
}
