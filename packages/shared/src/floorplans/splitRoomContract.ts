export type BedPositionContract = {
  bedPositionId: string;
  parentRoomId: string;
  label: string;
  assignmentTarget: true;
  relativeBounds: {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  };
};

export type SplitRoomContract = {
  splitRoomId: string;
  parentRoomId: string;
  splitMode: "two_bed";
  dividerOrientation: "horizontal" | "vertical";
  dividerRatio: number;
  bedPositions: BedPositionContract[];
};

export function createSplitRoomContract(value: SplitRoomContract): SplitRoomContract {
  return validateSplitRoomContract(value);
}

export function validateSplitRoomContract(value: unknown): SplitRoomContract {
  const object = requireRecord(value, "splitRoomContract");
  const splitMode = requireLiteral(object.splitMode, "two_bed", "splitMode");
  const bedPositions = requireArray(object.bedPositions, "bedPositions").map(validateBedPositionContract);
  if (splitMode === "two_bed" && bedPositions.length !== 2) {
    throw new Error("two_bed split rooms require exactly two bed positions");
  }
  return {
    splitRoomId: requireString(object.splitRoomId, "splitRoomId"),
    parentRoomId: requireString(object.parentRoomId, "parentRoomId"),
    splitMode,
    dividerOrientation: requireEnum(object.dividerOrientation, ["horizontal", "vertical"] as const, "dividerOrientation"),
    dividerRatio: requireRatio(object.dividerRatio, "dividerRatio"),
    bedPositions
  };
}

export function validateBedPositionContract(value: unknown): BedPositionContract {
  const object = requireRecord(value, "bedPositionContract");
  const assignmentTarget = object.assignmentTarget;
  if (assignmentTarget !== true) {
    throw new Error("bed position assignmentTarget must be true");
  }
  return {
    bedPositionId: requireString(object.bedPositionId, "bedPositionId"),
    parentRoomId: requireString(object.parentRoomId, "parentRoomId"),
    label: requireString(object.label, "label"),
    assignmentTarget: true,
    relativeBounds: validateRelativeBounds(object.relativeBounds)
  };
}

function validateRelativeBounds(value: unknown): BedPositionContract["relativeBounds"] {
  const object = requireRecord(value, "relativeBounds");
  return {
    xRatio: requireRatio(object.xRatio, "xRatio"),
    yRatio: requireRatio(object.yRatio, "yRatio"),
    widthRatio: requireRatio(object.widthRatio, "widthRatio"),
    heightRatio: requireRatio(object.heightRatio, "heightRatio")
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
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
  return value;
}

function requireRatio(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be a ratio from 0 to 1`);
  }
  return value;
}

function requireLiteral<const TValue extends string>(
  value: unknown,
  expected: TValue,
  label: string
): TValue {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
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
