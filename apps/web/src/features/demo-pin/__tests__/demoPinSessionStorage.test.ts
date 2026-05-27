import {
  clearDemoPinSessionUnlock,
  getDemoPinSessionStorageKey,
  readDemoPinSessionUnlock,
  writeDemoPinSessionUnlock
} from "../demoPinSessionStorage";

const storage = createMemoryStorage();
writeDemoPinSessionUnlock(storage, 1234);
const record = readDemoPinSessionUnlock(storage);
if (record?.unlocked !== true || record.unlockedAtMs !== 1234) {
  throw new Error("session unlock must persist unlocked boolean and timestamp");
}
if (storage.getItem(getDemoPinSessionStorageKey())?.includes("2026")) {
  throw new Error("session unlock must not store the PIN");
}
clearDemoPinSessionUnlock(storage);
if (readDemoPinSessionUnlock(storage) != null) {
  throw new Error("relock must clear session unlock");
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };
}
