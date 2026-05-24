import type { LayoutSelectionObjectType } from "./layoutSelectionModel";

export const LAYOUT_VALIDATION_WARNING_SEVERITIES = ["info", "warning", "blocking"] as const;

export const LAYOUT_VALIDATION_WARNING_SOURCES = [
  "bounds",
  "collision",
  "path_sync",
  "door_sync",
  "resize",
  "inspector_edit",
  "audit",
  "delta_preview",
  "unknown"
] as const;

export type LayoutValidationWarningSeverity =
  (typeof LAYOUT_VALIDATION_WARNING_SEVERITIES)[number];

export type LayoutValidationWarningSource = (typeof LAYOUT_VALIDATION_WARNING_SOURCES)[number];

export type LayoutEditorValidationWarning = {
  code: string;
  severity: LayoutValidationWarningSeverity;
  source: LayoutValidationWarningSource;
  message: string;
  objectType: LayoutSelectionObjectType | null;
  objectId: string | null;
  relatedObjectType: LayoutSelectionObjectType | null;
  relatedObjectId: string | null;
  isGenerated: boolean;
};

export type BuildLayoutValidationWarningInput = {
  code: string;
  severity: LayoutValidationWarningSeverity;
  source: LayoutValidationWarningSource;
  message: string;
  objectType?: LayoutSelectionObjectType | null;
  objectId?: string | null;
  relatedObjectType?: LayoutSelectionObjectType | null;
  relatedObjectId?: string | null;
  isGenerated: boolean;
};

const LAYOUT_VALIDATION_WARNING_KEYS = [
  "code",
  "severity",
  "source",
  "message",
  "objectType",
  "objectId",
  "relatedObjectType",
  "relatedObjectId",
  "isGenerated"
] as const;

const FORBIDDEN_WARNING_MESSAGE_PATTERN =
  /\b(?:safe|unsafe|safety|clinical|diagnosis|satisfaction|recommend\w*|best-layout)\b/i;

export function buildLayoutValidationWarning(
  input: BuildLayoutValidationWarningInput
): LayoutEditorValidationWarning {
  return validateLayoutValidationWarning({
    code: input.code,
    severity: input.severity,
    source: input.source,
    message: input.message,
    objectType: input.objectType ?? null,
    objectId: input.objectId ?? null,
    relatedObjectType: input.relatedObjectType ?? null,
    relatedObjectId: input.relatedObjectId ?? null,
    isGenerated: input.isGenerated
  });
}

export function validateLayoutValidationWarning(
  warning: unknown
): LayoutEditorValidationWarning {
  if (warning == null || typeof warning !== "object" || Array.isArray(warning)) {
    throw new Error("layout validation warning must be an object");
  }

  const keys = Object.keys(warning).sort();
  const expectedKeys = [...LAYOUT_VALIDATION_WARNING_KEYS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw new Error(
      "layout validation warning must include exactly code, severity, source, message, objectType, objectId, relatedObjectType, relatedObjectId, and isGenerated"
    );
  }

  const candidate = warning as Record<string, unknown>;
  const code = requireNonEmptyString(candidate.code, "code");
  const severity = requireSeverity(candidate.severity);
  const source = requireSource(candidate.source);
  const message = requireNonEmptyString(candidate.message, "message");
  if (FORBIDDEN_WARNING_MESSAGE_PATTERN.test(message)) {
    throw new Error("layout validation warning message uses forbidden wording");
  }

  return {
    code,
    severity,
    source,
    message,
    objectType: requireNullableObjectType(candidate.objectType, "objectType"),
    objectId: requireNullableString(candidate.objectId, "objectId"),
    relatedObjectType: requireNullableObjectType(candidate.relatedObjectType, "relatedObjectType"),
    relatedObjectId: requireNullableString(candidate.relatedObjectId, "relatedObjectId"),
    isGenerated: requireBoolean(candidate.isGenerated, "isGenerated")
  };
}

export function compareLayoutValidationWarnings(
  left: LayoutEditorValidationWarning,
  right: LayoutEditorValidationWarning
): number {
  return (
    left.source.localeCompare(right.source) ||
    left.code.localeCompare(right.code) ||
    left.severity.localeCompare(right.severity) ||
    (left.objectType ?? "").localeCompare(right.objectType ?? "") ||
    (left.objectId ?? "").localeCompare(right.objectId ?? "") ||
    (left.relatedObjectType ?? "").localeCompare(right.relatedObjectType ?? "") ||
    (left.relatedObjectId ?? "").localeCompare(right.relatedObjectId ?? "") ||
    Number(left.isGenerated) - Number(right.isGenerated) ||
    left.message.localeCompare(right.message)
  );
}

export function isGeneratedLayoutWarning(warning: LayoutEditorValidationWarning): boolean {
  return warning.isGenerated;
}

export function filterGeneratedWarningsBySource(
  warnings: readonly LayoutEditorValidationWarning[],
  sources: readonly LayoutValidationWarningSource[]
): LayoutEditorValidationWarning[] {
  const sourceSet = new Set(sources);
  return warnings
    .filter((warning) => warning.isGenerated && sourceSet.has(warning.source))
    .map((warning) => ({ ...warning }))
    .sort(compareLayoutValidationWarnings);
}

function requireSeverity(value: unknown): LayoutValidationWarningSeverity {
  if (
    typeof value !== "string" ||
    !LAYOUT_VALIDATION_WARNING_SEVERITIES.includes(value as LayoutValidationWarningSeverity)
  ) {
    throw new Error("layout validation warning severity must be info, warning, or blocking");
  }
  return value as LayoutValidationWarningSeverity;
}

function requireSource(value: unknown): LayoutValidationWarningSource {
  if (
    typeof value !== "string" ||
    !LAYOUT_VALIDATION_WARNING_SOURCES.includes(value as LayoutValidationWarningSource)
  ) {
    throw new Error("layout validation warning source must be a supported validation source");
  }
  return value as LayoutValidationWarningSource;
}

function requireNullableObjectType(
  value: unknown,
  label: string
): LayoutSelectionObjectType | null {
  if (value == null) {
    return null;
  }
  if (
    value === "room" ||
    value === "door" ||
    value === "station" ||
    value === "hallway" ||
    value === "zone"
  ) {
    return value;
  }
  throw new Error(`${label} must be room, door, station, hallway, zone, or null`);
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value == null) {
    return null;
  }
  return requireNonEmptyString(value, label);
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`layout validation warning ${label} must be a non-empty string`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`layout validation warning ${label} must be boolean`);
  }
  return value;
}
