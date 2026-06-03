import {
  parseManualScenarioState,
  serializeManualScenarioState
} from "./manualScenarioPersistence";
import { createManualScenarioState, type ManualScenarioState } from "./manualScenarioState";

const STORAGE_KEY = "nerdeus.manualScenarioFoundation.scenarios.v1";

export type ManualScenarioStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readManualScenarioState(storage: ManualScenarioStorage | null): ManualScenarioState {
  if (storage == null) return createManualScenarioState();
  const text = storage.getItem(STORAGE_KEY);
  if (text == null) return createManualScenarioState();
  try {
    return parseManualScenarioState(text);
  } catch {
    storage.removeItem(STORAGE_KEY);
    return createManualScenarioState();
  }
}

export function writeManualScenarioState(
  storage: ManualScenarioStorage | null,
  state: ManualScenarioState
): ManualScenarioState {
  const text = serializeManualScenarioState(state);
  storage?.setItem(STORAGE_KEY, text);
  return parseManualScenarioState(text);
}
