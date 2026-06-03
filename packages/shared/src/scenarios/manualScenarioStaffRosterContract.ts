import { validateManualStaffMembers, type ManualStaffMemberContract } from "../assignments/manualStaffMemberContract.js";
import { validateAssignmentLabelNoOverclaim } from "../assignments/assignmentLabelNoOverclaim.js";
import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";

export type ManualScenarioStaffRosterContract = {
  staffRosterId: string;
  label: string;
  createdAtIso: string;
  updatedAtIso: string;
  staffMembers: ManualStaffMemberContract[];
  mode: "manual_roster";
};

export function manualScenarioStaffRosterIdFor(input: { label: string }): string {
  return ["manual-staff-roster", stableIdPart(input.label)].join(":");
}

export function validateManualScenarioStaffRosterContract(value: unknown): ManualScenarioStaffRosterContract {
  const roster = requireRecord(value, "manualScenarioStaffRoster");
  requireAllowedKeys(roster, "manualScenarioStaffRoster", [
    "staffRosterId",
    "label",
    "createdAtIso",
    "updatedAtIso",
    "staffMembers",
    "mode"
  ]);
  if (roster.mode !== "manual_roster") {
    throw new Error("manualScenarioStaffRoster.mode must be manual_roster");
  }
  const label = validateRosterText(requireString(roster.label, "manualScenarioStaffRoster.label"), "manualScenarioStaffRoster.label");
  const staffRosterId = requireString(roster.staffRosterId, "manualScenarioStaffRoster.staffRosterId");
  const expectedRosterId = manualScenarioStaffRosterIdFor({ label });
  if (staffRosterId !== expectedRosterId) {
    throw new Error("manualScenarioStaffRoster.staffRosterId must be deterministic");
  }
  return {
    staffRosterId,
    label,
    createdAtIso: requireIso(roster.createdAtIso, "manualScenarioStaffRoster.createdAtIso"),
    updatedAtIso: requireIso(roster.updatedAtIso, "manualScenarioStaffRoster.updatedAtIso"),
    staffMembers: validateManualStaffMembers(roster.staffMembers),
    mode: "manual_roster"
  };
}

function validateRosterText(value: string, label: string): string {
  return validateAssignmentLabelNoOverclaim(validateOperationalRuntimeText(value, label), label);
}

function stableIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return normalized.length === 0 ? "unnamed" : normalized;
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
