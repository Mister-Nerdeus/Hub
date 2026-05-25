export const PLAN_VISUAL_PARITY_SUPPORTED_OBJECT_KINDS = [
  "room",
  "zone",
  "hallway",
  "nurse_station",
  "door_or_access",
  "annotation",
  "deferred"
] as const;

export const PLAN_VISUAL_PARITY_COVERAGE_STATUSES = [
  "pending",
  "represented",
  "deferred",
  "not_modeled_with_reason"
] as const;

export type PlanVisualParityObjectKind =
  (typeof PLAN_VISUAL_PARITY_SUPPORTED_OBJECT_KINDS)[number];

export type PlanVisualParityCoverageStatus =
  (typeof PLAN_VISUAL_PARITY_COVERAGE_STATUSES)[number];

export type PlanVisualParitySourceTruthObject = {
  sourceLabel: string;
  required: boolean;
  objectKind: PlanVisualParityObjectKind;
  expectedTargetId: string | null;
  expectedRegionId: string | null;
  coverageStatus: PlanVisualParityCoverageStatus;
  notes: string;
};

export type PlanVisualParitySourceTruth = {
  schemaVersion: "1.0.0";
  planId: string;
  sourceReference: string;
  sourceUse: "manual-visual-parity-contract-only";
  visibleObjects: PlanVisualParitySourceTruthObject[];
  minimumExpectedCounts: {
    rooms: number;
    nurseStations: number;
    providerPharmacyZones: number;
    hallways: number;
    doorsOrAccessPoints: number;
  };
  legacyFixtureRejections: {
    unsupportedRoomIds: string[];
    unsupportedStationIds: string[];
    maximumOldSimplifiedRoomCount: number;
  };
  nonClaims: string[];
};

export type PlanVisualParitySourceTruthValidation = {
  status: "passed";
  planId: string;
  requiredVisibleObjects: number;
  objectKindHistogram: Record<string, number>;
  coverageStatusHistogram: Record<string, number>;
  minimumExpectedCounts: PlanVisualParitySourceTruth["minimumExpectedCounts"];
  legacyFixtureRejections: PlanVisualParitySourceTruth["legacyFixtureRejections"];
  nonClaims: string[];
};

const objectKindValues = new Set<string>(PLAN_VISUAL_PARITY_SUPPORTED_OBJECT_KINDS);
const coverageStatusValues = new Set<string>(PLAN_VISUAL_PARITY_COVERAGE_STATUSES);

export function validatePlanVisualParitySourceTruthContract(
  value: unknown
): PlanVisualParitySourceTruthValidation {
  const contract = requireRecord(value, "source truth");
  requireLiteral(contract.schemaVersion, "1.0.0", "schemaVersion");
  requireLiteral(contract.planId, "default-er-layout-plan-1", "planId");
  requireString(contract.sourceReference, "sourceReference");
  requireLiteral(contract.sourceUse, "manual-visual-parity-contract-only", "sourceUse");

  const visibleObjects = requireArray(contract.visibleObjects, "visibleObjects");
  if (visibleObjects.length === 0) {
    throw new Error("visibleObjects must not be empty");
  }

  const objectKindHistogram: Record<string, number> = {};
  const coverageStatusHistogram: Record<string, number> = {};

  for (const [index, itemValue] of visibleObjects.entries()) {
    const item = requireRecord(itemValue, `visibleObjects[${index}]`);
    requireString(item.sourceLabel, `visibleObjects[${index}].sourceLabel`);
    const required = requireBoolean(item.required, `visibleObjects[${index}].required`);
    const objectKind = requireString(item.objectKind, `visibleObjects[${index}].objectKind`);
    if (!objectKindValues.has(objectKind)) {
      throw new Error(`visibleObjects[${index}].objectKind is unsupported: ${objectKind}`);
    }
    requireOptionalString(item.expectedTargetId, `visibleObjects[${index}].expectedTargetId`);
    requireOptionalString(item.expectedRegionId, `visibleObjects[${index}].expectedRegionId`);
    const coverageStatus = requireString(item.coverageStatus, `visibleObjects[${index}].coverageStatus`);
    if (!coverageStatusValues.has(coverageStatus)) {
      throw new Error(`visibleObjects[${index}].coverageStatus is unsupported: ${coverageStatus}`);
    }
    if (
      required !== true &&
      coverageStatus !== "deferred" &&
      coverageStatus !== "not_modeled_with_reason"
    ) {
      throw new Error(
        `visibleObjects[${index}].required can be false only for explicit deferred or not-modeled entries`
      );
    }
    requireString(item.notes, `visibleObjects[${index}].notes`);
    objectKindHistogram[objectKind] = (objectKindHistogram[objectKind] ?? 0) + 1;
    coverageStatusHistogram[coverageStatus] = (coverageStatusHistogram[coverageStatus] ?? 0) + 1;
  }

  const minimumExpectedCounts = requireRecord(contract.minimumExpectedCounts, "minimumExpectedCounts");
  const minimums = {
    rooms: requirePositiveNumber(minimumExpectedCounts.rooms, "minimumExpectedCounts.rooms"),
    nurseStations: requirePositiveNumber(
      minimumExpectedCounts.nurseStations,
      "minimumExpectedCounts.nurseStations"
    ),
    providerPharmacyZones: requirePositiveNumber(
      minimumExpectedCounts.providerPharmacyZones,
      "minimumExpectedCounts.providerPharmacyZones"
    ),
    hallways: requirePositiveNumber(minimumExpectedCounts.hallways, "minimumExpectedCounts.hallways"),
    doorsOrAccessPoints: requirePositiveNumber(
      minimumExpectedCounts.doorsOrAccessPoints,
      "minimumExpectedCounts.doorsOrAccessPoints"
    )
  };

  if (minimums.rooms < 23) {
    throw new Error("minimumExpectedCounts.rooms must be at least 23");
  }
  if (minimums.nurseStations < 2) {
    throw new Error("minimumExpectedCounts.nurseStations must be at least 2");
  }
  if (minimums.providerPharmacyZones < 1) {
    throw new Error("minimumExpectedCounts.providerPharmacyZones must be at least 1");
  }
  if (minimums.hallways < 6) {
    throw new Error("minimumExpectedCounts.hallways must be at least 6");
  }
  if (minimums.doorsOrAccessPoints < 18) {
    throw new Error("minimumExpectedCounts.doorsOrAccessPoints must be at least 18");
  }

  const legacyFixtureRejections = requireRecord(
    contract.legacyFixtureRejections,
    "legacyFixtureRejections"
  );
  const unsupportedRoomIds = requireStringArray(
    legacyFixtureRejections.unsupportedRoomIds,
    "legacyFixtureRejections.unsupportedRoomIds"
  );
  const unsupportedStationIds = requireStringArray(
    legacyFixtureRejections.unsupportedStationIds,
    "legacyFixtureRejections.unsupportedStationIds"
  );
  const maximumOldSimplifiedRoomCount = requirePositiveNumber(
    legacyFixtureRejections.maximumOldSimplifiedRoomCount,
    "legacyFixtureRejections.maximumOldSimplifiedRoomCount"
  );

  if (!unsupportedRoomIds.includes("room-01") || !unsupportedRoomIds.includes("space-07")) {
    throw new Error("legacyFixtureRejections.unsupportedRoomIds must reject room-01 and space-07");
  }
  if (!unsupportedStationIds.includes("station-provider-pharmacy")) {
    throw new Error("legacyFixtureRejections.unsupportedStationIds must reject station-provider-pharmacy");
  }
  if (maximumOldSimplifiedRoomCount > 8) {
    throw new Error("legacyFixtureRejections.maximumOldSimplifiedRoomCount must be 8 or lower");
  }

  const nonClaims = requireStringArray(contract.nonClaims, "nonClaims");
  for (const requiredNonClaim of [
    "Not exact CAD geometry.",
    "Not measured walking truth.",
    "Not clinical safety certification."
  ]) {
    if (!nonClaims.includes(requiredNonClaim)) {
      throw new Error(`nonClaims must include: ${requiredNonClaim}`);
    }
  }

  return {
    status: "passed",
    planId: "default-er-layout-plan-1",
    requiredVisibleObjects: visibleObjects.length,
    objectKindHistogram,
    coverageStatusHistogram,
    minimumExpectedCounts: minimums,
    legacyFixtureRejections: {
      unsupportedRoomIds,
      unsupportedStationIds,
      maximumOldSimplifiedRoomCount
    },
    nonClaims
  };
}

function requireRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  return value;
}

function requireLiteral(value: unknown, expected: string, fieldName: string): void {
  if (value !== expected) {
    throw new Error(`${fieldName} must be ${expected}`);
  }
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value;
}

function requireOptionalString(value: unknown, fieldName: string): string | null {
  if (value == null) {
    return null;
  }
  return requireString(value, fieldName);
}

function requireBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean`);
  }
  return value;
}

function requirePositiveNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive finite number`);
  }
  return value;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    throw new Error(`${fieldName} must be a string array`);
  }
  return [...value];
}
