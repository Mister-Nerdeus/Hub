export const AUTHORING_WARNING_CODES = [
  "ROOM_MISSING_DOOR",
  "ROOM_MISSING_PATH_NODE",
  "PATH_SYNC_STALE",
  "ROOM_OUTSIDE_BOUNDS",
  "ROOM_TYPE_INVALID",
  "READONLY_AUTHORING_BLOCKED",
  "PATH_GRAPH_UNREACHABLE_ROOM",
  "SIMULATION_READY_EXPORT_BLOCKED",
  "NO_NEARBY_HALLWAY_NODE",
  "PATH_EDGE_GENERATION_SKIPPED",
  "MANUAL_PATH_REVIEW_REQUIRED",
  "GENERATED_PATH_NODE_APPROXIMATE"
] as const;

export type AuthoringWarningCode = (typeof AUTHORING_WARNING_CODES)[number];

export type AuthoringWarningContract = {
  code: AuthoringWarningCode;
  severity: "info" | "warning" | "blocking";
  message: string;
  objectType: "room" | "door" | "path_node" | "path_edge" | "layout" | null;
  objectId: string | null;
};

export function validateAuthoringWarningCode(value: unknown): AuthoringWarningCode {
  if (typeof value !== "string" || !AUTHORING_WARNING_CODES.includes(value as AuthoringWarningCode)) {
    throw new Error(`authoring warning code must be one of ${AUTHORING_WARNING_CODES.join(", ")}`);
  }
  return value as AuthoringWarningCode;
}

export function buildAuthoringWarning(input: AuthoringWarningContract): AuthoringWarningContract {
  return {
    code: validateAuthoringWarningCode(input.code),
    severity: input.severity,
    message: requireString(input.message, "message"),
    objectType: input.objectType,
    objectId: input.objectId
  };
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}
