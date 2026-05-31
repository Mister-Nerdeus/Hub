export const HALLWAY_GEOMETRY_KINDS = [
  "main_hallway",
  "side_hallway",
  "route_segment"
] as const;

export const HALLWAY_GEOMETRY_ORIENTATIONS = [
  "horizontal",
  "vertical",
  "custom"
] as const;

export type HallwayGeometryKind = (typeof HALLWAY_GEOMETRY_KINDS)[number];
export type HallwayGeometryOrientation = (typeof HALLWAY_GEOMETRY_ORIENTATIONS)[number];

export type HallwayGeometryContract = {
  hallwayId: string;
  label: string;
  kind: HallwayGeometryKind;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: HallwayGeometryOrientation;
  editable: boolean;
};

export function createHallwayGeometryContract(
  value: HallwayGeometryContract
): HallwayGeometryContract {
  return validateHallwayGeometryContract(value);
}

export function validateHallwayGeometryContract(value: unknown): HallwayGeometryContract {
  const object = requireRecord(value, "hallwayGeometryContract");
  return {
    hallwayId: requireString(object.hallwayId, "hallwayId"),
    label: requireString(object.label, "label"),
    kind: requireEnum(object.kind, HALLWAY_GEOMETRY_KINDS, "kind"),
    x: requireFiniteNumber(object.x, "x"),
    y: requireFiniteNumber(object.y, "y"),
    width: requirePositiveNumber(object.width, "width"),
    height: requirePositiveNumber(object.height, "height"),
    orientation: requireEnum(object.orientation, HALLWAY_GEOMETRY_ORIENTATIONS, "orientation"),
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
