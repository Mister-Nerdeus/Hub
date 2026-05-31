import {
  GEOMETRY_LAYER_CONTRACTS,
  type GeometryLayer
} from "./geometryLayerContract.js";

export type GeometryMigrationQuarantinedVisual = {
  sourceObjectId: string;
  reason: "unknown_visual_kind" | "missing_geometry_layer";
  layer: "reference_overlay";
  editable: false;
  removable: false;
};

export type GeometryMigrationResult<TLayout> = {
  status: "migrated";
  layout: TLayout;
  schemaVersion: "1.0.0";
  defaultedLayerCount: number;
  quarantinedVisuals: GeometryMigrationQuarantinedVisual[];
  ignoredVisualIds: string[];
  destructiveMigration: false;
};

type MigratableRenderedObject = {
  id?: unknown;
  renderId?: unknown;
  kind?: unknown;
  objectType?: unknown;
  layer?: unknown;
  editable?: unknown;
  removable?: unknown;
};

export function migrateGeometryLayout<TLayout extends Record<string, unknown>>(
  layout: TLayout
): GeometryMigrationResult<TLayout> {
  const cloned = clone(layout);
  const renderedObjects = Array.isArray(cloned.renderedObjects)
    ? cloned.renderedObjects as MigratableRenderedObject[]
    : [];
  let defaultedLayerCount = 0;
  const quarantinedVisuals: GeometryMigrationQuarantinedVisual[] = [];
  const ignoredVisualIds: string[] = [];

  const migratedRenderedObjects = renderedObjects.flatMap((object) => {
    const sourceObjectId = renderObjectId(object);
    const layer = object.layer;
    if (typeof layer === "string" && isSupportedLayer(layer)) {
      return [object];
    }
    if (isKnownGeometryKind(object.kind ?? object.objectType)) {
      defaultedLayerCount += 1;
      return [{ ...object, layer: "editable_geometry" satisfies GeometryLayer }];
    }
    if (sourceObjectId == null) {
      ignoredVisualIds.push("unknown-rendered-object");
      return [];
    }
    quarantinedVisuals.push({
      sourceObjectId,
      reason: typeof layer === "string" ? "unknown_visual_kind" : "missing_geometry_layer",
      layer: "reference_overlay",
      editable: false,
      removable: false
    });
    return [{
      ...object,
      layer: "reference_overlay" satisfies GeometryLayer,
      editable: false,
      removable: false
    }];
  });

  return {
    status: "migrated",
    layout: {
      ...cloned,
      renderedObjects: migratedRenderedObjects
    },
    schemaVersion: "1.0.0",
    defaultedLayerCount,
    quarantinedVisuals,
    ignoredVisualIds,
    destructiveMigration: false
  };
}

export function geometryMigrationDefaultsMissingLayers(input: {
  layer?: unknown;
  kind?: unknown;
}): GeometryLayer {
  if (typeof input.layer === "string" && isSupportedLayer(input.layer)) {
    return input.layer;
  }
  if (isKnownGeometryKind(input.kind)) {
    return "editable_geometry";
  }
  return "reference_overlay";
}

function isSupportedLayer(value: string): value is GeometryLayer {
  return GEOMETRY_LAYER_CONTRACTS.some((contract) => contract.layer === value);
}

function isKnownGeometryKind(value: unknown): boolean {
  return typeof value === "string" && [
    "room",
    "split_room_parent",
    "bed_position",
    "door",
    "nurse_station",
    "hallway",
    "outer_wall",
    "solid_wall",
    "support_area",
    "storage_area",
    "provider_pharmacy"
  ].includes(value);
}

function renderObjectId(object: MigratableRenderedObject): string | null {
  if (typeof object.renderId === "string" && object.renderId.length > 0) {
    return object.renderId;
  }
  if (typeof object.id === "string" && object.id.length > 0) {
    return object.id;
  }
  return null;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
