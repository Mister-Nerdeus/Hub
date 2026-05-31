export const EDITABLE_GEOMETRY_HIT_TEST_KINDS = [
  "room",
  "door",
  "support_access",
  "station",
  "hallway",
  "zone",
  "split_bay"
] as const;

export const LOCKED_GEOMETRY_HIT_TEST_KINDS = [
  "outer_wall",
  "solid_wall",
  "partition_wall",
  "blocked_boundary"
] as const;

export type EditableGeometryHitTestKind = (typeof EDITABLE_GEOMETRY_HIT_TEST_KINDS)[number];
export type LockedGeometryHitTestKind = (typeof LOCKED_GEOMETRY_HIT_TEST_KINDS)[number];
export type GeometryHitTestKind = EditableGeometryHitTestKind | LockedGeometryHitTestKind;

export type GeometryHitTestResult = {
  objectType: GeometryHitTestKind;
  objectId: string;
  selectable: boolean;
  editable: boolean;
};

export function geometryHitTestFromElement(target: Element | null): GeometryHitTestResult | null {
  if (target == null || referenceOverlayWouldStealHit(target)) {
    return null;
  }

  const element = target.closest("[data-geometry-kind][data-geometry-source-id]");
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
    return null;
  }

  const objectType = element.getAttribute("data-geometry-kind");
  const objectId = element.getAttribute("data-geometry-source-id");
  if (!isGeometryHitTestKind(objectType) || objectId == null || objectId.length === 0) {
    return null;
  }

  return {
    objectType,
    objectId,
    selectable: element.getAttribute("data-selectable") === "true",
    editable: element.getAttribute("data-editable") === "true"
  };
}

export function referenceOverlayWouldStealHit(target: Element): boolean {
  return target.closest("[data-reference-overlay='true']") != null;
}

export function isGeometryHitTestKind(value: unknown): value is GeometryHitTestKind {
  return (
    typeof value === "string" &&
    (
      EDITABLE_GEOMETRY_HIT_TEST_KINDS.includes(value as EditableGeometryHitTestKind) ||
      LOCKED_GEOMETRY_HIT_TEST_KINDS.includes(value as LockedGeometryHitTestKind)
    )
  );
}
