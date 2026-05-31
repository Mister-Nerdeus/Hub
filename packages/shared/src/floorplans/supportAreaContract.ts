export const SUPPORT_AREA_TYPES = ["nurse_station", "provider_pharmacy", "storage", "ems_entry"] as const;
export const SUPPORT_STORAGE_AREA_KINDS = [
  "provider_pharmacy",
  "storage",
  "nurse_station_core",
  "staff_only",
  "blocked_area"
] as const;

export type SupportAreaType = (typeof SUPPORT_AREA_TYPES)[number];
export type SupportStorageAreaKind = (typeof SUPPORT_STORAGE_AREA_KINDS)[number];

export type SupportStorageAreaContract = {
  supportAreaId: string;
  label: string;
  kind: SupportStorageAreaKind;
  x: number;
  y: number;
  width: number;
  height: number;
  patientAssignable: false;
  editable: boolean;
};

export type CanonicalSupportArea = {
  objectId: string;
  supportAreaType: SupportAreaType;
  patientCareEligible: false;
  ratioEligible: false;
  assignmentEligible: false;
  routeReadinessEligible: boolean;
};

export const CANONICAL_SUPPORT_AREAS: readonly CanonicalSupportArea[] = [
  { objectId: "station-left", supportAreaType: "nurse_station", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true },
  { objectId: "station-right", supportAreaType: "nurse_station", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true },
  { objectId: "zone-provider-pharmacy", supportAreaType: "provider_pharmacy", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true },
  { objectId: "room-14", supportAreaType: "storage", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: false },
  { objectId: "zone-ems-entry", supportAreaType: "ems_entry", patientCareEligible: false, ratioEligible: false, assignmentEligible: false, routeReadinessEligible: true }
];

export function canonicalSupportArea(objectId: string): CanonicalSupportArea | null {
  return CANONICAL_SUPPORT_AREAS.find((area) => area.objectId === objectId) ?? null;
}

export function createSupportStorageAreaContract(
  value: SupportStorageAreaContract
): SupportStorageAreaContract {
  return validateSupportStorageAreaContract(value);
}

export function validateSupportStorageAreaContract(value: unknown): SupportStorageAreaContract {
  const object = requireRecord(value, "supportStorageAreaContract");
  const patientAssignable = object.patientAssignable;
  if (patientAssignable !== false) {
    throw new Error("support area patientAssignable must be false");
  }
  return {
    supportAreaId: requireString(object.supportAreaId, "supportAreaId"),
    label: requireString(object.label, "label"),
    kind: requireEnum(object.kind, SUPPORT_STORAGE_AREA_KINDS, "kind"),
    x: requireFiniteNumber(object.x, "x"),
    y: requireFiniteNumber(object.y, "y"),
    width: requirePositiveNumber(object.width, "width"),
    height: requirePositiveNumber(object.height, "height"),
    patientAssignable: false,
    editable: requireBoolean(object.editable, "editable")
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const number = requireFiniteNumber(value, label);
  if (number <= 0) {
    throw new Error(`${label} must be greater than zero`);
  }
  return number;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireEnum<const TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  label: string
): TValue {
  if (typeof value !== "string" || !allowed.includes(value as TValue)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as TValue;
}
