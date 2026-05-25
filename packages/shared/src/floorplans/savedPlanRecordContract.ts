import {
  assertNoForbiddenSourcePayload,
  validateAuthoringDraftContract,
  type AuthoringDraftContract,
  type SourceProvenance
} from "./authoringDraftContract.js";

export const SAVE_KINDS = [
  "default_duplicate",
  "manual_save",
  "save_as",
  "imported_json"
] as const;

export type SaveKind = (typeof SAVE_KINDS)[number];

export type SavedPlanRecordContract = {
  savedPlanId: string;
  sourceDefaultPlanId: string;
  planId: string;
  displayName: string;
  versionLabel: string;
  createdAt: string;
  updatedAt: string;
  saveKind: SaveKind;
  authoringDraft: AuthoringDraftContract;
  sourceProvenance: SourceProvenance;
  syntheticDataOnly: true;
};

export function validateSavedPlanRecordContract(value: unknown): SavedPlanRecordContract {
  assertNoForbiddenSourcePayload(value, "savedPlanRecord");
  const record = requireRecord(value, "savedPlanRecord");
  requireExactKeys(record, "savedPlanRecord", [
    "savedPlanId",
    "sourceDefaultPlanId",
    "planId",
    "displayName",
    "versionLabel",
    "createdAt",
    "updatedAt",
    "saveKind",
    "authoringDraft",
    "sourceProvenance",
    "syntheticDataOnly"
  ]);
  const authoringDraft = validateAuthoringDraftContract(record.authoringDraft);
  const savedPlanId = requireString(record.savedPlanId, "savedPlanId");
  const sourceDefaultPlanId = requireString(record.sourceDefaultPlanId, "sourceDefaultPlanId");
  const planId = requireString(record.planId, "planId");
  const displayName = requireString(record.displayName, "displayName");
  const versionLabel = requireString(record.versionLabel, "versionLabel");
  if (authoringDraft.sourceDefaultPlanId !== sourceDefaultPlanId) {
    throw new Error("authoringDraft.sourceDefaultPlanId must match sourceDefaultPlanId");
  }
  if (authoringDraft.planId !== planId) {
    throw new Error("authoringDraft.planId must match planId");
  }
  if (authoringDraft.displayName !== displayName) {
    throw new Error("authoringDraft.displayName must match displayName");
  }
  return {
    savedPlanId,
    sourceDefaultPlanId,
    planId,
    displayName,
    versionLabel,
    createdAt: requireIsoTimestamp(record.createdAt, "createdAt"),
    updatedAt: requireIsoTimestamp(record.updatedAt, "updatedAt"),
    saveKind: requireEnum(record.saveKind, SAVE_KINDS, "saveKind"),
    authoringDraft,
    sourceProvenance: authoringDraft.sourceProvenance,
    syntheticDataOnly: requireLiteral(record.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO-compatible timestamp`);
  }
  return text;
}

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
