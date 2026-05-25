import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { validatePlanContract, type PlanContract } from "../contracts.js";

export const AUTHORING_STATUSES = [
  "draft_valid",
  "draft_has_warnings",
  "simulation_ready",
  "blocked_invalid_geometry"
] as const;

export const PATH_SYNC_STATUSES = [
  "fresh",
  "stale_warning",
  "blocked",
  "not_applicable"
] as const;

export const SOURCE_KINDS = [
  "default_fixture",
  "private_docx_reference",
  "manual_authoring",
  "imported_json"
] as const;

export type AuthoringStatus = (typeof AUTHORING_STATUSES)[number];
export type PathSyncStatus = (typeof PATH_SYNC_STATUSES)[number];
export type SourceKind = (typeof SOURCE_KINDS)[number];

export type SourceProvenance = {
  sourceReferenceId: string;
  sourceKind: SourceKind;
  sourceVisibility: string;
  publicExposureAllowed: boolean;
  runtimeServedByWeb: boolean;
  runtimeServedByApi: boolean;
  notes: string[];
};

export type AuthoringDraftContract = {
  draftId: string;
  sourceDefaultPlanId: string;
  planId: string;
  displayName: string;
  versionLabel: string;
  editableLayout: EditableLayoutGeometryContract;
  sourcePlan: PlanContract;
  authoringStatus: AuthoringStatus;
  pathSyncStatus: PathSyncStatus;
  authoringWarnings: string[];
  sourceProvenance: SourceProvenance;
  createdAt: string;
  updatedAt: string;
  syntheticDataOnly: true;
};

const FORBIDDEN_SOURCE_PAYLOAD_KEYS = [
  `sourceDocument${"Path"}`,
  `docx${"Binary"}`,
  "binaryData",
  "rawFileContent",
  "base64Content",
  "embeddedDocument",
  `source${"Filename"}`,
  "privateAbsolutePath"
] as const;

export function validateAuthoringDraftContract(value: unknown): AuthoringDraftContract {
  assertNoForbiddenSourcePayload(value, "authoringDraft");
  const draft = requireRecord(value, "authoringDraft");
  requireExactKeys(draft, "authoringDraft", [
    "draftId",
    "sourceDefaultPlanId",
    "planId",
    "displayName",
    "versionLabel",
    "editableLayout",
    "sourcePlan",
    "authoringStatus",
    "pathSyncStatus",
    "authoringWarnings",
    "sourceProvenance",
    "createdAt",
    "updatedAt",
    "syntheticDataOnly"
  ]);

  const editableLayout = validateEditableLayoutGeometryContract(draft.editableLayout);
  const sourcePlan = validatePlanContract(draft.sourcePlan);
  const planId = requireString(draft.planId, "planId");
  if (sourcePlan.planId !== planId) {
    throw new Error("sourcePlan.planId must match planId");
  }

  return {
    draftId: requireString(draft.draftId, "draftId"),
    sourceDefaultPlanId: requireString(draft.sourceDefaultPlanId, "sourceDefaultPlanId"),
    planId,
    displayName: requireString(draft.displayName, "displayName"),
    versionLabel: requireString(draft.versionLabel, "versionLabel"),
    editableLayout,
    sourcePlan,
    authoringStatus: requireEnum(draft.authoringStatus, AUTHORING_STATUSES, "authoringStatus"),
    pathSyncStatus: requireEnum(draft.pathSyncStatus, PATH_SYNC_STATUSES, "pathSyncStatus"),
    authoringWarnings: requireStringArray(draft.authoringWarnings, "authoringWarnings"),
    sourceProvenance: validateSourceProvenance(draft.sourceProvenance),
    createdAt: requireIsoTimestamp(draft.createdAt, "createdAt"),
    updatedAt: requireIsoTimestamp(draft.updatedAt, "updatedAt"),
    syntheticDataOnly: requireLiteral(draft.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

export function createSafeSourceProvenance(input: {
  sourceReferenceId: string;
  sourceKind: SourceKind;
  notes?: string[];
}): SourceProvenance {
  return validateSourceProvenance({
    sourceReferenceId: input.sourceReferenceId,
    sourceKind: input.sourceKind,
    sourceVisibility:
      input.sourceKind === "private_docx_reference" ? "private-reference-only" : "runtime-safe-json",
    publicExposureAllowed: false,
    runtimeServedByWeb: false,
    runtimeServedByApi: false,
    notes: input.notes ?? ["Safe provenance only; no private source payload is stored."]
  });
}

export function assertNoForbiddenSourcePayload(value: unknown, label: string): void {
  if (value == null || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if ((FORBIDDEN_SOURCE_PAYLOAD_KEYS as readonly string[]).includes(key)) {
      throw new Error(`${label}.${key} is not allowed in authoring records`);
    }
    assertNoForbiddenSourcePayload(child, `${label}.${key}`);
  }
}

function validateSourceProvenance(value: unknown): SourceProvenance {
  const provenance = requireRecord(value, "sourceProvenance");
  requireExactKeys(provenance, "sourceProvenance", [
    "sourceReferenceId",
    "sourceKind",
    "sourceVisibility",
    "publicExposureAllowed",
    "runtimeServedByWeb",
    "runtimeServedByApi",
    "notes"
  ]);
  const publicExposureAllowed = requireBoolean(
    provenance.publicExposureAllowed,
    "sourceProvenance.publicExposureAllowed"
  );
  const runtimeServedByWeb = requireBoolean(
    provenance.runtimeServedByWeb,
    "sourceProvenance.runtimeServedByWeb"
  );
  const runtimeServedByApi = requireBoolean(
    provenance.runtimeServedByApi,
    "sourceProvenance.runtimeServedByApi"
  );
  if (publicExposureAllowed || runtimeServedByWeb || runtimeServedByApi) {
    throw new Error("sourceProvenance must not expose private source material at runtime");
  }
  return {
    sourceReferenceId: requireString(provenance.sourceReferenceId, "sourceProvenance.sourceReferenceId"),
    sourceKind: requireEnum(provenance.sourceKind, SOURCE_KINDS, "sourceProvenance.sourceKind"),
    sourceVisibility: requireString(provenance.sourceVisibility, "sourceProvenance.sourceVisibility"),
    publicExposureAllowed,
    runtimeServedByWeb,
    runtimeServedByApi,
    notes: requireStringArray(provenance.notes, "sourceProvenance.notes")
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

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value.map((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO-compatible timestamp`);
  }
  return text;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
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
