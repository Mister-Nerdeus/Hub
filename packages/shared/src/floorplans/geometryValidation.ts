export const GEOMETRY_TRUTH_WARNING_CODES = [
  "UNCLASSIFIED_VISIBLE_ARTIFACT",
  "REFERENCE_OVERLAY_EDITABLE",
  "HALLWAY_MISSING_SOURCE",
  "WALL_MISSING_SOURCE",
  "SPLIT_ROOM_INVALID_BED_TARGET"
] as const;

export type GeometryTruthWarningCode = (typeof GEOMETRY_TRUTH_WARNING_CODES)[number];

export function isGeometryTruthWarningCode(value: unknown): value is GeometryTruthWarningCode {
  return typeof value === "string" && GEOMETRY_TRUTH_WARNING_CODES.includes(value as GeometryTruthWarningCode);
}

export function summarizeGeometryTruthWarnings(warnings: readonly { code: string }[]): {
  geometryTruthWarningCount: number;
  hasGeometryTruthWarnings: boolean;
} {
  const geometryTruthWarningCount = warnings.filter((warning) => isGeometryTruthWarningCode(warning.code)).length;
  return {
    geometryTruthWarningCount,
    hasGeometryTruthWarnings: geometryTruthWarningCount > 0
  };
}
