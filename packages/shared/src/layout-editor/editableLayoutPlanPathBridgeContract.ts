export const EDITABLE_LAYOUT_PLAN_PATH_BRIDGE_MAPPING_STATUSES = [
  "mapped",
  "missing_plan_object",
  "missing_path_reference",
  "not_required"
] as const;

export type EditableLayoutPlanPathBridgeMappingStatus =
  (typeof EDITABLE_LAYOUT_PLAN_PATH_BRIDGE_MAPPING_STATUSES)[number];

export type EditableLayoutPlanPathBridgeMapping = {
  editableObjectId: string;
  planObjectId: string | null;
  pathNodeIds: string[];
  pathEdgeIds: string[];
  mappingStatus: EditableLayoutPlanPathBridgeMappingStatus;
};

export type EditableLayoutPlanPathBridgeContract = {
  editableLayoutId: string;
  planId: string;
  roomMappings: EditableLayoutPlanPathBridgeMapping[];
  doorMappings: EditableLayoutPlanPathBridgeMapping[];
  stationMappings: EditableLayoutPlanPathBridgeMapping[];
  hallwayMappings: EditableLayoutPlanPathBridgeMapping[];
  zoneMappings: EditableLayoutPlanPathBridgeMapping[];
  limitations: string[];
};

const BRIDGE_CONTRACT_KEYS = [
  "editableLayoutId",
  "planId",
  "roomMappings",
  "doorMappings",
  "stationMappings",
  "hallwayMappings",
  "zoneMappings",
  "limitations"
] as const;

const BRIDGE_MAPPING_KEYS = [
  "editableObjectId",
  "planObjectId",
  "pathNodeIds",
  "pathEdgeIds",
  "mappingStatus"
] as const;

export function validateEditableLayoutPlanPathBridgeContract(
  value: unknown
): EditableLayoutPlanPathBridgeContract {
  const contract = requireRecord(value, "editableLayoutPlanPathBridgeContract");
  requireExactKeys(contract, "editableLayoutPlanPathBridgeContract", BRIDGE_CONTRACT_KEYS);

  const validated = {
    editableLayoutId: requireString(contract.editableLayoutId, "editableLayoutId"),
    planId: requireString(contract.planId, "planId"),
    roomMappings: validateMappings(contract.roomMappings, "roomMappings"),
    doorMappings: validateMappings(contract.doorMappings, "doorMappings"),
    stationMappings: validateMappings(contract.stationMappings, "stationMappings"),
    hallwayMappings: validateMappings(contract.hallwayMappings, "hallwayMappings"),
    zoneMappings: validateMappings(contract.zoneMappings, "zoneMappings"),
    limitations: validateStringList(contract.limitations, "limitations")
  };

  if (validated.limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  return validated;
}

function validateMappings(value: unknown, label: string): EditableLayoutPlanPathBridgeMapping[] {
  return requireArray(value, label).map((mapping, index) => validateMapping(mapping, `${label}[${index}]`));
}

function validateMapping(value: unknown, label: string): EditableLayoutPlanPathBridgeMapping {
  const mapping = requireRecord(value, label);
  requireExactKeys(mapping, label, BRIDGE_MAPPING_KEYS);

  const validated = {
    editableObjectId: requireString(mapping.editableObjectId, `${label}.editableObjectId`),
    planObjectId: requireNullableString(mapping.planObjectId, `${label}.planObjectId`),
    pathNodeIds: validateStringList(mapping.pathNodeIds, `${label}.pathNodeIds`),
    pathEdgeIds: validateStringList(mapping.pathEdgeIds, `${label}.pathEdgeIds`),
    mappingStatus: requireEnum(
      mapping.mappingStatus,
      EDITABLE_LAYOUT_PLAN_PATH_BRIDGE_MAPPING_STATUSES,
      `${label}.mappingStatus`
    )
  };

  validateMappingStatusConsistency(validated, label);
  return validated;
}

function validateMappingStatusConsistency(
  mapping: EditableLayoutPlanPathBridgeMapping,
  label: string
): void {
  const hasPathReference = mapping.pathNodeIds.length > 0 || mapping.pathEdgeIds.length > 0;
  switch (mapping.mappingStatus) {
    case "mapped":
      if (mapping.planObjectId == null) {
        throw new Error(`${label}.planObjectId is required when mappingStatus is mapped`);
      }
      if (!hasPathReference) {
        throw new Error(`${label}.mappingStatus must be missing_path_reference when path references are empty`);
      }
      return;
    case "missing_plan_object":
      if (mapping.planObjectId != null) {
        throw new Error(`${label}.planObjectId must be null when mappingStatus is missing_plan_object`);
      }
      return;
    case "missing_path_reference":
      if (mapping.planObjectId == null) {
        throw new Error(`${label}.planObjectId is required when mappingStatus is missing_path_reference`);
      }
      if (hasPathReference) {
        throw new Error(`${label}.path references must be empty when mappingStatus is missing_path_reference`);
      }
      return;
    case "not_required":
      return;
  }
}

function validateStringList(value: unknown, label: string): string[] {
  return requireArray(value, label).map((item, index) => requireString(item, `${label}[${index}]`));
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  label: string,
  allowedKeys: readonly string[]
): void {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...allowedKeys].sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`${label} must use exact keys; unexpected or missing key is not allowed`);
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

function requireNullableString(value: unknown, label: string): string | null {
  if (value == null) {
    return null;
  }
  return requireString(value, label);
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
