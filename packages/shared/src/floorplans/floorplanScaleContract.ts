export const CANONICAL_FLOORPLAN_ID = "default-er-layout-plan-1" as const;

export const CANONICAL_BASE_ROOM_MODULE_FEET = {
  width: 10,
  height: 10
} as const;

export const CANONICAL_GEOMETRY_UNIT = "feet" as const;

export type CanonicalScaleExceptionKind = "trauma" | "support_area" | "split_bay" | "double_module";

export type CanonicalScaleException = {
  kind: CanonicalScaleExceptionKind;
  objectIds: readonly string[];
  reason: string;
};

export const CANONICAL_SCALE_EXCEPTIONS: readonly CanonicalScaleException[] = [
  {
    kind: "trauma",
    objectIds: ["room-level-1-trauma"],
    reason: "Level 1 Trauma is intentionally larger than the base 10 ft x 10 ft module."
  },
  {
    kind: "support_area",
    objectIds: ["zone-provider-pharmacy", "station-left", "station-right"],
    reason: "Support areas may use the reference footprint needed for workspace rendering."
  },
  {
    kind: "split_bay",
    objectIds: ["room-02", "room-03", "room-04", "room-05", "room-06", "room-07", "room-08", "room-09"],
    reason: "Candidate paired bed positions are modeled as 10 ft x 10 ft positions inside split bays."
  }
];

export type ScaleLike = {
  unit: string;
  pixelsPerUnit: number;
  gridSizeFeet: number;
  snapToGrid: boolean;
  origin: string;
};

export type RectLike = {
  id: string;
  widthFeet: number;
  lengthFeet: number;
};

export function isCanonicalFeetScale(scale: ScaleLike): boolean {
  return (
    scale.unit === CANONICAL_GEOMETRY_UNIT &&
    Number.isFinite(scale.pixelsPerUnit) &&
    scale.pixelsPerUnit > 0 &&
    Number.isFinite(scale.gridSizeFeet) &&
    scale.gridSizeFeet > 0 &&
    scale.origin === "top-left"
  );
}

export function isBaseTenByTenModule(rect: RectLike): boolean {
  return (
    rect.widthFeet === CANONICAL_BASE_ROOM_MODULE_FEET.width &&
    rect.lengthFeet === CANONICAL_BASE_ROOM_MODULE_FEET.height
  );
}

export function canonicalScaleExceptionForObject(objectId: string): CanonicalScaleException | null {
  return CANONICAL_SCALE_EXCEPTIONS.find((exception) => exception.objectIds.includes(objectId)) ?? null;
}

export function requiresBaseTenByTenModule(rect: RectLike): boolean {
  return canonicalScaleExceptionForObject(rect.id) == null;
}
