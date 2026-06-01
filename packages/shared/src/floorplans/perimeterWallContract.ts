export const PERIMETER_WALL_ORIENTATIONS = ["horizontal", "vertical"] as const;

export type PerimeterWallOrientation = (typeof PERIMETER_WALL_ORIENTATIONS)[number];

export type PerimeterWallSegmentContract = {
  segmentId: string;
  label: string;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
  orientation: PerimeterWallOrientation;
  blocksTravel: true;
  locked: boolean;
};

export type PerimeterWallContract = {
  perimeterWallId: string;
  label: string;
  segments: PerimeterWallSegmentContract[];
};

export function validatePerimeterWallContract(value: unknown): PerimeterWallContract {
  const wall = requireRecord(value, "perimeterWall");
  requireExactKeys(wall, "perimeterWall", ["perimeterWallId", "label", "segments"]);
  const segments = requireArray(wall.segments, "perimeterWall.segments").map(
    validatePerimeterWallSegment
  );
  if (segments.length === 0) {
    throw new Error("perimeterWall.segments requires at least one segment");
  }
  requireUnique("perimeter wall segment ids", segments.map((segment) => segment.segmentId));
  return {
    perimeterWallId: requireString(wall.perimeterWallId, "perimeterWall.perimeterWallId"),
    label: requireString(wall.label, "perimeterWall.label"),
    segments
  };
}

function validatePerimeterWallSegment(value: unknown, index: number): PerimeterWallSegmentContract {
  const segment = requireRecord(value, `perimeterWall.segments[${index}]`);
  requireExactKeys(segment, `perimeterWall.segments[${index}]`, [
    "segmentId",
    "label",
    "xFeet",
    "yFeet",
    "widthFeet",
    "heightFeet",
    "orientation",
    "blocksTravel",
    "locked"
  ]);
  const orientation = requireEnum(
    segment.orientation,
    PERIMETER_WALL_ORIENTATIONS,
    `perimeterWall.segments[${index}].orientation`
  );
  const widthFeet = requirePositiveNumber(segment.widthFeet, `perimeterWall.segments[${index}].widthFeet`);
  const heightFeet = requirePositiveNumber(segment.heightFeet, `perimeterWall.segments[${index}].heightFeet`);
  if (orientation === "horizontal" && widthFeet < heightFeet) {
    throw new Error(`perimeterWall.segments[${index}] horizontal segments must be wider than tall`);
  }
  if (orientation === "vertical" && heightFeet < widthFeet) {
    throw new Error(`perimeterWall.segments[${index}] vertical segments must be taller than wide`);
  }
  return {
    segmentId: requireString(segment.segmentId, `perimeterWall.segments[${index}].segmentId`),
    label: requireString(segment.label, `perimeterWall.segments[${index}].label`),
    xFeet: requireNumber(segment.xFeet, `perimeterWall.segments[${index}].xFeet`),
    yFeet: requireNumber(segment.yFeet, `perimeterWall.segments[${index}].yFeet`),
    widthFeet,
    heightFeet,
    orientation,
    blocksTravel: requireLiteral(segment.blocksTravel, true, `perimeterWall.segments[${index}].blocksTravel`),
    locked: requireBoolean(segment.locked, `perimeterWall.segments[${index}].locked`)
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

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const numberValue = requireNumber(value, label);
  if (numberValue <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return numberValue;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
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

function requireUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}
