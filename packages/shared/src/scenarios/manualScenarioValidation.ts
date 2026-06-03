import { validateAssignmentLabelNoOverclaim } from "../assignments/assignmentLabelNoOverclaim.js";
import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";
import {
  manualScenarioIdFor,
  type ManualScenarioContract
} from "./manualScenarioContract.js";

export function validateManualScenarioContract(value: unknown): ManualScenarioContract {
  const scenario = requireRecord(value, "manualScenario");
  requireAllowedKeys(scenario, "manualScenario", [
    "scenarioId",
    "label",
    "description",
    "floorplanId",
    "assignmentSetId",
    "staffRosterId",
    "createdAtIso",
    "updatedAtIso",
    "mode"
  ]);
  if (scenario.mode !== "manual") {
    throw new Error("manualScenario.mode must be manual");
  }
  const label = validateManualScenarioText(requireString(scenario.label, "manualScenario.label"), "manualScenario.label");
  const floorplanId = requireString(scenario.floorplanId, "manualScenario.floorplanId");
  const assignmentSetId = requireString(scenario.assignmentSetId, "manualScenario.assignmentSetId");
  const staffRosterId = requireString(scenario.staffRosterId, "manualScenario.staffRosterId");
  const scenarioId = requireString(scenario.scenarioId, "manualScenario.scenarioId");
  const expectedScenarioId = manualScenarioIdFor({ floorplanId, assignmentSetId, label });
  if (scenarioId !== expectedScenarioId) {
    throw new Error("manualScenario.scenarioId must be deterministic");
  }
  return {
    scenarioId,
    label,
    ...(scenario.description == null ? {} : {
      description: validateManualScenarioText(
        requireString(scenario.description, "manualScenario.description"),
        "manualScenario.description"
      )
    }),
    floorplanId,
    assignmentSetId,
    staffRosterId,
    createdAtIso: requireIso(scenario.createdAtIso, "manualScenario.createdAtIso"),
    updatedAtIso: requireIso(scenario.updatedAtIso, "manualScenario.updatedAtIso"),
    mode: "manual"
  };
}

export function validateManualScenarioText(value: string, label: string): string {
  return validateAssignmentLabelNoOverclaim(validateOperationalRuntimeText(value, label), label);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireAllowedKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireIso(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO date string`);
  }
  return text;
}
