import {
  createManualComparisonPersistencePayload,
  MANUAL_COMPARISON_STORAGE_KEY,
  readManualComparisonState,
  validateManualComparisonPersistencePayload,
  validateManualComparisonState,
  writeManualComparisonState
} from "../manualComparisonStorage";

const validSet = {
  comparisonSetId: "manual-comparison-set:storage",
  label: "Manual comparison set",
  scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  mode: "manual_comparison" as const
};

const memoryStorage = createMemoryStorage();
const writtenState = writeManualComparisonState(memoryStorage, {
  comparisonSets: [validSet],
  selectedComparisonSetId: validSet.comparisonSetId
});

const storedRaw = memoryStorage.getItem(MANUAL_COMPARISON_STORAGE_KEY);
if (storedRaw == null) {
  throw new Error("manual comparison persistence must use the required storage key");
}
const storedPayload = JSON.parse(storedRaw) as unknown;
const validatedPayload = validateManualComparisonPersistencePayload(storedPayload);
if (validatedPayload.schemaVersion !== "1.0.0") {
  throw new Error("manual comparison persistence payload must be versioned");
}
if (writtenState.selectedComparisonSetId !== validSet.comparisonSetId) {
  throw new Error("manual comparison write must preserve selected comparison set");
}

const readState = readManualComparisonState(memoryStorage);
if (readState.selectedComparisonSetId !== validSet.comparisonSetId) {
  throw new Error("manual comparison read must restore selected comparison set");
}

let duplicateSetRejected = false;
try {
  validateManualComparisonState({
    comparisonSets: [validSet, validSet],
    selectedComparisonSetId: validSet.comparisonSetId
  });
} catch {
  duplicateSetRejected = true;
}
if (!duplicateSetRejected) {
  throw new Error("manual comparison persistence must reject duplicate comparison set ids");
}

let unresolvedSelectedRejected = false;
try {
  validateManualComparisonPersistencePayload({
    schemaVersion: "1.0.0",
    comparisonSets: [validSet],
    selectedComparisonSetId: "manual-comparison-set:missing"
  });
} catch {
  unresolvedSelectedRejected = true;
}
if (!unresolvedSelectedRejected) {
  throw new Error("manual comparison persistence must reject unresolved selected ids");
}

let forbiddenFieldRejected = false;
try {
  validateManualComparisonPersistencePayload({
    schemaVersion: "1.0.0",
    comparisonSets: [{ ...validSet, score: 1 }],
    selectedComparisonSetId: validSet.comparisonSetId
  });
} catch {
  forbiddenFieldRejected = true;
}
if (!forbiddenFieldRejected) {
  throw new Error("manual comparison persistence must reject scoring fields");
}

const invalidStorage = createMemoryStorage();
invalidStorage.setItem(MANUAL_COMPARISON_STORAGE_KEY, JSON.stringify({
  schemaVersion: "1.0.0",
  comparisonSets: [{ ...validSet, scenarioIds: ["manual-scenario:a"] }],
  selectedComparisonSetId: validSet.comparisonSetId
}));
const clearedState = readManualComparisonState(invalidStorage);
if (clearedState.comparisonSets.length !== 0) {
  throw new Error("manual comparison persistence must clear invalid payloads safely");
}
if (invalidStorage.getItem(MANUAL_COMPARISON_STORAGE_KEY) != null) {
  throw new Error("manual comparison persistence must remove invalid stored payloads");
}

const payload = createManualComparisonPersistencePayload({
  comparisonSets: [validSet],
  selectedComparisonSetId: validSet.comparisonSetId
});
if (payload.comparisonSets.length !== 1 || payload.selectedComparisonSetId !== validSet.comparisonSetId) {
  throw new Error("manual comparison persistence payload factory must preserve valid state");
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
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    }
  };
}
