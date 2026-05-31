import {
  geometryLayerContractFor,
  isGeometryLayer,
  type GeometryLayer
} from "./geometryLayerContract.js";

export const RENDERED_OBJECT_SOURCE_KINDS = [
  "editable",
  "locked",
  "reference",
  "measurement",
  "label"
] as const;

export type RenderedObjectSourceKind = (typeof RENDERED_OBJECT_SOURCE_KINDS)[number];

export type RenderedObjectContract = {
  renderId: string;
  layer: GeometryLayer;
  sourceKind: RenderedObjectSourceKind;
  sourceObjectId?: string;
  selectable: boolean;
  editable: boolean;
  removable: boolean;
  reasonLocked?: string;
};

export function validateRenderedObjectContract(value: unknown): RenderedObjectContract {
  const object = requireRecord(value, "renderedObjectContract");
  const layer = requireGeometryLayer(object.layer, "layer");
  const sourceKind = requireSourceKind(object.sourceKind, "sourceKind");
  const selectable = requireBoolean(object.selectable, "selectable");
  const editable = requireBoolean(object.editable, "editable");
  const removable = requireBoolean(object.removable, "removable");
  const sourceObjectId = object.sourceObjectId == null
    ? undefined
    : requireString(object.sourceObjectId, "sourceObjectId");
  const reasonLocked = object.reasonLocked == null
    ? undefined
    : requireString(object.reasonLocked, "reasonLocked");
  const layerContract = geometryLayerContractFor(layer);

  if (sourceKind !== layerContract.sourceKind) {
    throw new Error("rendered object sourceKind must match its geometry layer contract");
  }
  if (selectable && !layerContract.selectable) {
    throw new Error("rendered object cannot be selectable when its layer is not selectable");
  }
  if ((editable || removable) && sourceKind !== "editable") {
    throw new Error("rendered object can be editable or removable only when sourceKind is editable");
  }
  if (!editable && sourceKind !== "measurement" && sourceKind !== "label" && reasonLocked == null) {
    throw new Error("locked or reference rendered objects require reasonLocked");
  }
  if (sourceKind === "editable" && sourceObjectId == null) {
    throw new Error("editable rendered objects require sourceObjectId");
  }

  return {
    renderId: requireString(object.renderId, "renderId"),
    layer,
    sourceKind,
    ...(sourceObjectId == null ? {} : { sourceObjectId }),
    selectable,
    editable,
    removable,
    ...(reasonLocked == null ? {} : { reasonLocked })
  };
}

export function createRenderedObjectContract(
  value: RenderedObjectContract
): RenderedObjectContract {
  return validateRenderedObjectContract(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireGeometryLayer(value: unknown, label: string): GeometryLayer {
  if (!isGeometryLayer(value)) {
    throw new Error(`${label} must be a geometry layer`);
  }
  return value;
}

function requireSourceKind(value: unknown, label: string): RenderedObjectSourceKind {
  if (
    typeof value !== "string" ||
    !RENDERED_OBJECT_SOURCE_KINDS.includes(value as RenderedObjectSourceKind)
  ) {
    throw new Error(`${label} must be one of ${RENDERED_OBJECT_SOURCE_KINDS.join(", ")}`);
  }
  return value as RenderedObjectSourceKind;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}
