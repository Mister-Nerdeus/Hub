import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";
import type { PlanContract } from "../contracts.js";

export const SOURCE_MAPPING_OBJECT_TYPES = [
  "room",
  "hallway",
  "door",
  "nurseStation",
  "zone",
  "pathNode",
  "pathEdge",
  "annotation"
] as const;

export const SOURCE_MAPPING_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export const SOURCE_MAPPING_GEOMETRY_APPROXIMATIONS = ["manual", "deferred"] as const;
export const SOURCE_MAPPING_NOTES_CODES = [
  "source-label-position-approximate",
  "source-visible-operational-object",
  "source-label-grouped",
  "source-label-deferred"
] as const;
export const DEFERRED_SOURCE_LABEL_REASON_CODES = [
  "needs-human-review",
  "source-label-ambiguous",
  "source-label-not-structured-yet"
] as const;

export type SourceMappingObjectType = (typeof SOURCE_MAPPING_OBJECT_TYPES)[number];
export type SourceMappingConfidence = (typeof SOURCE_MAPPING_CONFIDENCE_LEVELS)[number];
export type SourceMappingGeometryApproximation =
  (typeof SOURCE_MAPPING_GEOMETRY_APPROXIMATIONS)[number];
export type SourceMappingNotesCode = (typeof SOURCE_MAPPING_NOTES_CODES)[number];
export type DeferredSourceLabelReasonCode = (typeof DEFERRED_SOURCE_LABEL_REASON_CODES)[number];

export type SourceApproximateCoordinates = {
  x: number;
  y: number;
  widthFeet?: number | null;
  lengthFeet?: number | null;
};

export type SourceToPlanMappedObject = {
  sourceObjectId: string;
  sourceLabel: string;
  objectType: SourceMappingObjectType;
  targetObjectId: string;
  confidence: SourceMappingConfidence;
  geometryApproximation: SourceMappingGeometryApproximation;
  approximateCoordinates: SourceApproximateCoordinates | null;
  notesCode: SourceMappingNotesCode;
};

export type DeferredSourceLabel = {
  sourceLabel: string;
  reasonCode: DeferredSourceLabelReasonCode;
};

export type SourceToPlanMappingContract = {
  schemaVersion: "1.0.0";
  mappingId: string;
  sourcePlanId: string;
  targetPlanId: string;
  objects: SourceToPlanMappedObject[];
  deferredSourceLabels: DeferredSourceLabel[];
};

export function validateSourceToPlanMappingContract(
  value: unknown
): SourceToPlanMappingContract {
  const mapping = requireRecord(value, "sourceToPlanMapping");
  requireExactKeys(mapping, "sourceToPlanMapping", [
    "schemaVersion",
    "mappingId",
    "sourcePlanId",
    "targetPlanId",
    "objects",
    "deferredSourceLabels"
  ]);

  requireLiteral(mapping.schemaVersion, "1.0.0", "schemaVersion");
  requireString(mapping.mappingId, "mappingId");
  requireString(mapping.sourcePlanId, "sourcePlanId");
  requireString(mapping.targetPlanId, "targetPlanId");

  const sourceObjectIds = new Set<string>();
  const targetObjectIds = new Set<string>();
  requireArray(mapping.objects, "objects").forEach((object, index) => {
    validateMappedObject(object, index, sourceObjectIds, targetObjectIds);
  });
  requireArray(mapping.deferredSourceLabels, "deferredSourceLabels").forEach((label, index) => {
    validateDeferredSourceLabel(label, index);
  });

  return mapping as SourceToPlanMappingContract;
}

export function validateSourceMappingAgainstPlan(
  mappingValue: unknown,
  plan: PlanContract
): SourceToPlanMappingContract {
  const mapping = validateSourceToPlanMappingContract(mappingValue);
  if (mapping.targetPlanId !== plan.planId) {
    throw new Error("mapping.targetPlanId must match plan.planId");
  }

  const idsByType: Record<Exclude<SourceMappingObjectType, "annotation">, Set<string>> = {
    room: new Set(plan.rooms.map((room) => room.id)),
    hallway: new Set(plan.hallways.map((hallway) => hallway.id)),
    door: new Set(plan.doors.map((door) => door.id)),
    nurseStation: new Set(plan.nurseStations.map((station) => station.id)),
    zone: new Set(plan.zones.map((zone) => zone.id)),
    pathNode: new Set(plan.pathNodes.map((node) => node.id)),
    pathEdge: new Set(plan.pathEdges.map((edge) => edge.id))
  };

  mapping.objects.forEach((object, index) => {
    if (object.objectType === "annotation") {
      throw new Error(`objects[${index}].objectType annotation is deferred until annotation objects exist`);
    }
    if (!idsByType[object.objectType].has(object.targetObjectId)) {
      throw new Error(
        `objects[${index}].targetObjectId must reference plan.${collectionNameForObjectType(
          object.objectType
        )}`
      );
    }
  });

  return mapping;
}

function collectionNameForObjectType(objectType: Exclude<SourceMappingObjectType, "annotation">): string {
  switch (objectType) {
    case "room":
      return "rooms";
    case "hallway":
      return "hallways";
    case "door":
      return "doors";
    case "nurseStation":
      return "nurseStations";
    case "zone":
      return "zones";
    case "pathNode":
      return "pathNodes";
    case "pathEdge":
      return "pathEdges";
  }
}

function validateMappedObject(
  value: unknown,
  index: number,
  sourceObjectIds: Set<string>,
  targetObjectIds: Set<string>
): void {
  const label = `objects[${index}]`;
  const object = requireRecord(value, label);
  requireExactKeys(object, label, [
    "sourceObjectId",
    "sourceLabel",
    "objectType",
    "targetObjectId",
    "confidence",
    "geometryApproximation",
    "approximateCoordinates",
    "notesCode"
  ]);

  const sourceObjectId = requireString(object.sourceObjectId, `${label}.sourceObjectId`);
  if (sourceObjectIds.has(sourceObjectId)) {
    throw new Error("duplicate sourceObjectId values are not allowed");
  }
  sourceObjectIds.add(sourceObjectId);

  validateOperationalRuntimeText(requireString(object.sourceLabel, `${label}.sourceLabel`), `${label}.sourceLabel`);
  requireEnum(object.objectType, SOURCE_MAPPING_OBJECT_TYPES, `${label}.objectType`);

  const targetObjectId = requireString(object.targetObjectId, `${label}.targetObjectId`);
  if (targetObjectIds.has(targetObjectId)) {
    throw new Error("duplicate targetObjectId values are not allowed");
  }
  targetObjectIds.add(targetObjectId);

  requireEnum(object.confidence, SOURCE_MAPPING_CONFIDENCE_LEVELS, `${label}.confidence`);
  requireEnum(
    object.geometryApproximation,
    SOURCE_MAPPING_GEOMETRY_APPROXIMATIONS,
    `${label}.geometryApproximation`
  );
  validateApproximateCoordinates(object.approximateCoordinates, `${label}.approximateCoordinates`);
  requireEnum(object.notesCode, SOURCE_MAPPING_NOTES_CODES, `${label}.notesCode`);
}

function validateDeferredSourceLabel(value: unknown, index: number): void {
  const label = `deferredSourceLabels[${index}]`;
  const deferred = requireRecord(value, label);
  requireExactKeys(deferred, label, ["sourceLabel", "reasonCode"]);
  validateOperationalRuntimeText(
    requireString(deferred.sourceLabel, `${label}.sourceLabel`),
    `${label}.sourceLabel`
  );
  requireEnum(deferred.reasonCode, DEFERRED_SOURCE_LABEL_REASON_CODES, `${label}.reasonCode`);
}

function validateApproximateCoordinates(value: unknown, label: string): void {
  if (value == null) {
    return;
  }
  const coordinates = requireRecord(value, label);
  requireExactKeys(coordinates, label, ["x", "y", "widthFeet", "lengthFeet"]);
  requireNumber(coordinates.x, `${label}.x`);
  requireNumber(coordinates.y, `${label}.y`);
  requireOptionalNumber(coordinates.widthFeet, `${label}.widthFeet`);
  requireOptionalNumber(coordinates.lengthFeet, `${label}.lengthFeet`);
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
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requireOptionalNumber(value: unknown, label: string): number | null | undefined {
  if (value == null) {
    return value;
  }
  return requireNumber(value, label);
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}
