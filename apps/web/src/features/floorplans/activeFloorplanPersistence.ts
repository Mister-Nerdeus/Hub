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
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (raw == null || raw.trim().length === 0) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const candidate = parsed as Partial<PersistedActiveFloorplanSelection>;
  if (
    candidate.schemaVersion !== "1.0.0" ||
    typeof candidate.activeFloorplanId !== "string" ||
    typeof candidate.activeFloorplanVersionId !== "string"
  ) {
    return null;
  }
  return {
    schemaVersion: "1.0.0",
    activeFloorplanId: candidate.activeFloorplanId,
    activeFloorplanVersionId: candidate.activeFloorplanVersionId
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
