export type WorkspaceAccessSessionRecord = {
  unlocked: boolean;
  unlockedAtMs: number;
};

export const WORKSPACE_ACCESS_SESSION_STORAGE_KEY =
  "nerdeus.workspaceAccess.sessionUnlock.v1";
export const LEGACY_DEMO_PIN_SESSION_STORAGE_KEY =
  "nerdeus.demoPin.sessionUnlock.v1";

const CREDENTIAL_LIKE_FIELDS = [
  "pin",
  "pinInput",
  "accessCode",
  "credential",
  "input",
  "token",
  "authToken"
] as const;

export function readWorkspaceAccessSessionUnlock(
  storage: Storage | null | undefined
): WorkspaceAccessSessionRecord | null {
  if (storage == null) {
    return null;
  }
  const current = readValidRecord(storage.getItem(WORKSPACE_ACCESS_SESSION_STORAGE_KEY));
  if (current != null) {
    storage.removeItem(LEGACY_DEMO_PIN_SESSION_STORAGE_KEY);
    return current;
  }
  const legacyRaw = storage.getItem(LEGACY_DEMO_PIN_SESSION_STORAGE_KEY);
  if (legacyRaw == null) {
    return null;
  }
  const legacy = readValidRecord(legacyRaw);
  storage.removeItem(LEGACY_DEMO_PIN_SESSION_STORAGE_KEY);
  if (legacy == null) {
    return null;
  }
  storage.setItem(WORKSPACE_ACCESS_SESSION_STORAGE_KEY, JSON.stringify(legacy));
  return legacy;
}

export function writeWorkspaceAccessSessionUnlock(
  storage: Storage | null | undefined,
  unlockedAtMs: number
): void {
  if (storage == null) {
    return;
  }
  const record: WorkspaceAccessSessionRecord = {
    unlocked: true,
    unlockedAtMs
  };
  storage.setItem(WORKSPACE_ACCESS_SESSION_STORAGE_KEY, JSON.stringify(record));
  storage.removeItem(LEGACY_DEMO_PIN_SESSION_STORAGE_KEY);
}

export function clearWorkspaceAccessSessionUnlock(storage: Storage | null | undefined): void {
  storage?.removeItem(WORKSPACE_ACCESS_SESSION_STORAGE_KEY);
  storage?.removeItem(LEGACY_DEMO_PIN_SESSION_STORAGE_KEY);
}

export function getWorkspaceAccessSessionStorageKey(): string {
  return WORKSPACE_ACCESS_SESSION_STORAGE_KEY;
}

function readValidRecord(raw: string | null): WorkspaceAccessSessionRecord | null {
  if (raw == null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceAccessSessionRecord> & Record<string, unknown>;
    if (CREDENTIAL_LIKE_FIELDS.some((field) => field in parsed)) {
      return null;
    }
    if (parsed.unlocked !== true || typeof parsed.unlockedAtMs !== "number") {
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
