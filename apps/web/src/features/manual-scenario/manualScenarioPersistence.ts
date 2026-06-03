import {
  validateManualScenarioContract,
  validateManualScenarioSnapshotContract,
  type ManualScenarioContract,
  type ManualScenarioSnapshotContract
} from "@nerdeus/shared";
import {
  createManualScenarioStateFromRecords,
  type ManualScenarioState
} from "./manualScenarioState";

export type ManualScenarioPersistencePayload = {
  schemaVersion: "1.0.0";
  scenarios: ManualScenarioContract[];
  snapshots: ManualScenarioSnapshotContract[];
  selectedScenarioId: string | null;
};

export function serializeManualScenarioState(state: ManualScenarioState): string {
  return JSON.stringify(validateManualScenarioPersistencePayload({
    schemaVersion: "1.0.0",
    scenarios: state.scenarios,
    snapshots: state.snapshots,
    selectedScenarioId: state.selectedScenarioId
  }));
}

export function parseManualScenarioState(text: string): ManualScenarioState {
  const payload = validateManualScenarioPersistencePayload(JSON.parse(text));
  return createManualScenarioStateFromRecords(payload);
}

export function cloneManualScenarioState(state: ManualScenarioState): ManualScenarioState {
  return parseManualScenarioState(serializeManualScenarioState(state));
}

export function validateManualScenarioPersistencePayload(value: unknown): ManualScenarioPersistencePayload {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("manualScenarioPersistencePayload must be an object");
  }
  const record = value as Record<string, unknown>;
  const allowedKeys = new Set(["schemaVersion", "scenarios", "snapshots", "selectedScenarioId"]);
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`manualScenarioPersistencePayload.${key} is not allowed`);
    }
  }
  if (record.schemaVersion !== "1.0.0") {
    throw new Error("manualScenarioPersistencePayload.schemaVersion must be 1.0.0");
  }
  if (!Array.isArray(record.scenarios)) {
    throw new Error("manualScenarioPersistencePayload.scenarios must be an array");
  }
  if (!Array.isArray(record.snapshots)) {
    throw new Error("manualScenarioPersistencePayload.snapshots must be an array");
  }
  const scenarios = record.scenarios.map(validateManualScenarioContract);
  const snapshots = record.snapshots.map(validateManualScenarioSnapshotContract);
  const selectedScenarioId = record.selectedScenarioId == null ? null : requireString(
    record.selectedScenarioId,
    "manualScenarioPersistencePayload.selectedScenarioId"
  );
  if (selectedScenarioId != null && !scenarios.some((scenario) => scenario.scenarioId === selectedScenarioId)) {
    throw new Error("manualScenarioPersistencePayload.selectedScenarioId must reference a stored scenario");
  }
  return {
    schemaVersion: "1.0.0",
    scenarios,
    snapshots,
    selectedScenarioId
  };
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}
