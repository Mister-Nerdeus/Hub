export type DemoPinSessionRecord = {
  unlocked: boolean;
  unlockedAtMs: number;
};

const DEMO_PIN_SESSION_STORAGE_KEY = "nerdeus.demoPin.sessionUnlock.v1";

export function readDemoPinSessionUnlock(storage: Storage | null | undefined): DemoPinSessionRecord | null {
  if (storage == null) {
    return null;
  }
  const raw = storage.getItem(DEMO_PIN_SESSION_STORAGE_KEY);
  if (raw == null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DemoPinSessionRecord> & Record<string, unknown>;
    if (parsed.unlocked !== true || typeof parsed.unlockedAtMs !== "number") {
      return null;
    }
    if ("pin" in parsed || "pinInput" in parsed || "authToken" in parsed) {
      return null;
    }
    return {
      unlocked: true,
      unlockedAtMs: parsed.unlockedAtMs
    };
  } catch {
    return null;
  }
}

export function writeDemoPinSessionUnlock(
  storage: Storage | null | undefined,
  unlockedAtMs: number
): void {
  if (storage == null) {
    return;
  }
  const record: DemoPinSessionRecord = {
    unlocked: true,
    unlockedAtMs
  };
  storage.setItem(DEMO_PIN_SESSION_STORAGE_KEY, JSON.stringify(record));
}

export function clearDemoPinSessionUnlock(storage: Storage | null | undefined): void {
  storage?.removeItem(DEMO_PIN_SESSION_STORAGE_KEY);
}

export function getDemoPinSessionStorageKey(): string {
  return DEMO_PIN_SESSION_STORAGE_KEY;
}
