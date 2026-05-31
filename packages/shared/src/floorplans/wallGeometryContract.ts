export const WALL_GEOMETRY_KINDS = [
  "outer_wall",
  "solid_wall",
  "partition_wall",
  "blocked_boundary"
] as const;

export type WallGeometryKind = (typeof WALL_GEOMETRY_KINDS)[number];

export type WallGeometryContract = {
  wallId: string;
  kind: WallGeometryKind;
  x: number;
  y: number;
  width: number;
  height: number;
  editable: boolean;
  blocksTravel: boolean;
};

export function createWallGeometryContract(value: WallGeometryContract): WallGeometryContract {
  return validateWallGeometryContract(value);
}

export function validateWallGeometryContract(value: unknown): WallGeometryContract {
  const object = requireRecord(value, "wallGeometryContract");
  return {
    wallId: requireString(object.wallId, "wallId"),
    kind: requireEnum(object.kind, WALL_GEOMETRY_KINDS, "kind"),
    x: requireFiniteNumber(object.x, "x"),
    y: requireFiniteNumber(object.y, "y"),
    width: requirePositiveNumber(object.width, "width"),
    height: requirePositiveNumber(object.height, "height"),
    editable: requireBoolean(object.editable, "editable"),
    blocksTravel: requireBoolean(object.blocksTravel, "blocksTravel")
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
