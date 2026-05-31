export const REFERENCE_OVERLAY_SCHEMA_VERSION = "1.0.0" as const;

export type ReferenceOverlayContract = {
  schemaVersion: typeof REFERENCE_OVERLAY_SCHEMA_VERSION;
  referenceOverlayId: string;
  sourceObjectId: string;
  label: string;
  locked: true;
  toggleable: true;
  visibleByDefault: boolean;
  opacity: number;
  style: "faded" | "dashed_faded";
  editableGeometry: false;
  reasonLocked: string;
};

export function validateReferenceOverlayContract(value: unknown): ReferenceOverlayContract {
  const overlay = requireRecord(value, "referenceOverlayContract");
  const opacity = requireNumber(overlay.opacity, "opacity");
  if (opacity <= 0 || opacity > 0.65) {
    throw new Error("reference overlay opacity must be faded and less than or equal to 0.65");
  }
  return {
    schemaVersion: requireLiteral(overlay.schemaVersion, REFERENCE_OVERLAY_SCHEMA_VERSION, "schemaVersion"),
    referenceOverlayId: requireString(overlay.referenceOverlayId, "referenceOverlayId"),
    sourceObjectId: requireString(overlay.sourceObjectId, "sourceObjectId"),
    label: requireString(overlay.label, "label"),
    locked: requireLiteral(overlay.locked, true, "locked"),
    toggleable: requireLiteral(overlay.toggleable, true, "toggleable"),
    visibleByDefault: requireBoolean(overlay.visibleByDefault, "visibleByDefault"),
    opacity,
    style: requireEnum(overlay.style, ["faded", "dashed_faded"], "style"),
    editableGeometry: requireLiteral(overlay.editableGeometry, false, "editableGeometry"),
    reasonLocked: requireString(overlay.reasonLocked, "reasonLocked")
  };
}

export function createReferenceOverlayContract(input: {
  referenceOverlayId: string;
  sourceObjectId: string;
  label: string;
  visibleByDefault?: boolean;
  opacity?: number;
  style?: ReferenceOverlayContract["style"];
  reasonLocked?: string;
}): ReferenceOverlayContract {
  return validateReferenceOverlayContract({
    schemaVersion: REFERENCE_OVERLAY_SCHEMA_VERSION,
    referenceOverlayId: input.referenceOverlayId,
    sourceObjectId: input.sourceObjectId,
    label: input.label,
    locked: true,
    toggleable: true,
    visibleByDefault: input.visibleByDefault ?? true,
    opacity: input.opacity ?? 0.28,
    style: input.style ?? "dashed_faded",
    editableGeometry: false,
    reasonLocked: input.reasonLocked ?? "Reference overlay is locked background evidence, not editable geometry."
  });
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

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${String(expected)}`);
  }
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
