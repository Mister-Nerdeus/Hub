export const ACTIVE_FLOORPLAN_STORAGE_KEY = "nerdeus.erPod.activeFloorplan.v1";

export type PersistedActiveFloorplanSelection = {
  schemaVersion: "1.0.0";
  activeFloorplanId: string;
  activeFloorplanVersionId: string;
};

export type ActiveFloorplanSelectionStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function readPersistedActiveFloorplanSelection(
  storage: ActiveFloorplanSelectionStorage | null,
  key = ACTIVE_FLOORPLAN_STORAGE_KEY
): PersistedActiveFloorplanSelection | null {
  if (storage == null) {
    return null;
  }
  const raw = storage.getItem(key);
  if (raw == null || raw.trim().length === 0) {
    return null;
  }
  let parsed: Partial<PersistedActiveFloorplanSelection>;
  try {
    parsed = JSON.parse(raw) as Partial<PersistedActiveFloorplanSelection>;
  } catch {
    storage.removeItem(key);
    return null;
  }
  if (
    parsed.schemaVersion !== "1.0.0" ||
    typeof parsed.activeFloorplanId !== "string" ||
    typeof parsed.activeFloorplanVersionId !== "string"
  ) {
    storage.removeItem(key);
    return null;
  }
  return {
    schemaVersion: "1.0.0",
    activeFloorplanId: parsed.activeFloorplanId,
    activeFloorplanVersionId: parsed.activeFloorplanVersionId
  };
}

export function writePersistedActiveFloorplanSelection(
  storage: ActiveFloorplanSelectionStorage | null,
  selection: PersistedActiveFloorplanSelection,
  key = ACTIVE_FLOORPLAN_STORAGE_KEY
): void {
  storage?.setItem(key, JSON.stringify(selection));
}

export function clearPersistedActiveFloorplanSelection(
  storage: ActiveFloorplanSelectionStorage | null,
  key = ACTIVE_FLOORPLAN_STORAGE_KEY
): void {
  storage?.removeItem(key);
}
