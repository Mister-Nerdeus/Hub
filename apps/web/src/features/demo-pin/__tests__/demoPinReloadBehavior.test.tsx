import {
  clearDemoPinUnlock,
  createInitialDemoPinUiState,
  submitDemoPin,
  updateDemoPinInput
} from "../demoPinState";

const storage = createMemoryStorage();
const unlocked = submitDemoPin(updateDemoPinInput(createInitialDemoPinUiState(storage, 1_000), "2026"), storage, 1_000);
if (!unlocked.unlocked) {
  throw new Error("PIN 2026 must unlock");
}
const restored = createInitialDemoPinUiState(storage, 2_000);
if (!restored.unlocked) {
  throw new Error("reload-like session restore must keep unlocked state");
}
const relocked = clearDemoPinUnlock(storage, 3_000);
if (relocked.unlocked || createInitialDemoPinUiState(storage, 4_000).unlocked) {
  throw new Error("relock must clear restored session state");
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
