export const GEOMETRY_LAYERS = [
  "grid",
  "reference_overlay",
  "locked_geometry",
  "editable_geometry",
  "selection_handles",
  "measurement_overlay",
  "label_overlay",
  "popover_overlay"
] as const;

export type GeometryLayer = (typeof GEOMETRY_LAYERS)[number];

export type GeometryLayerSourceKind =
  | "editable"
  | "locked"
  | "reference"
  | "measurement"
  | "label";

export type GeometryLayerContract = {
  layer: GeometryLayer;
  renderedInNormalEditorMode: boolean;
  sourceKind: GeometryLayerSourceKind;
  selectable: boolean;
  editable: boolean;
  removable: boolean;
  reasonLocked?: string;
};

export const GEOMETRY_LAYER_CONTRACTS: readonly GeometryLayerContract[] = [
  {
    layer: "grid",
    renderedInNormalEditorMode: true,
    sourceKind: "measurement",
    selectable: false,
    editable: false,
    removable: false,
    reasonLocked: "Grid is a measurement overlay, not floorplan geometry."
  },
  {
    layer: "reference_overlay",
    renderedInNormalEditorMode: true,
    sourceKind: "reference",
    selectable: true,
    editable: false,
    removable: false,
    reasonLocked: "Reference overlay is locked background evidence."
  },
  {
    layer: "locked_geometry",
    renderedInNormalEditorMode: true,
    sourceKind: "locked",
    selectable: true,
    editable: false,
    removable: false,
    reasonLocked: "Locked geometry can be inspected but not edited in normal mode."
  },
  {
    layer: "editable_geometry",
    renderedInNormalEditorMode: true,
    sourceKind: "editable",
    selectable: true,
    editable: true,
    removable: true
  },
  {
    layer: "selection_handles",
    renderedInNormalEditorMode: true,
    sourceKind: "measurement",
    selectable: false,
    editable: false,
    removable: false,
    reasonLocked: "Selection handles modify the selected geometry through the selected object."
  },
  {
    layer: "measurement_overlay",
    renderedInNormalEditorMode: true,
    sourceKind: "measurement",
    selectable: false,
    editable: false,
    removable: false,
    reasonLocked: "Measurements annotate geometry and are not saved geometry."
  },
  {
    layer: "label_overlay",
    renderedInNormalEditorMode: true,
    sourceKind: "label",
    selectable: false,
    editable: false,
    removable: false,
    reasonLocked: "Labels describe geometry and route selection to the labeled object."
  },
  {
    layer: "popover_overlay",
    renderedInNormalEditorMode: true,
    sourceKind: "measurement",
    selectable: false,
    editable: false,
    removable: false,
    reasonLocked: "Popovers are editor controls, not floorplan geometry."
  }
];

export function isGeometryLayer(value: unknown): value is GeometryLayer {
  return typeof value === "string" && GEOMETRY_LAYERS.includes(value as GeometryLayer);
}

export function geometryLayerContractFor(layer: GeometryLayer): GeometryLayerContract {
  const contract = GEOMETRY_LAYER_CONTRACTS.find((candidate) => candidate.layer === layer);
  if (contract == null) {
    throw new Error(`missing geometry layer contract for ${layer}`);
  }
  return contract;
}

export function validateGeometryLayerContract(value: unknown): GeometryLayerContract {
  const contract = requireRecord(value, "geometryLayerContract");
  const layer = requireGeometryLayer(contract.layer, "layer");
  const sourceKind = requireSourceKind(contract.sourceKind, "sourceKind");
  const selectable = requireBoolean(contract.selectable, "selectable");
  const editable = requireBoolean(contract.editable, "editable");
  const removable = requireBoolean(contract.removable, "removable");
  const reasonLocked = contract.reasonLocked == null
    ? undefined
    : requireString(contract.reasonLocked, "reasonLocked");

  if ((editable || removable) && sourceKind !== "editable") {
    throw new Error("only editable geometry layers can be editable or removable");
  }
  if (!editable && sourceKind !== "editable" && reasonLocked == null) {
    throw new Error("non-editable rendered layers require reasonLocked");
  }

  return {
    layer,
    renderedInNormalEditorMode: requireBoolean(
      contract.renderedInNormalEditorMode,
      "renderedInNormalEditorMode"
    ),
    sourceKind,
    selectable,
    editable,
    removable,
    ...(reasonLocked == null ? {} : { reasonLocked })
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireGeometryLayer(value: unknown, label: string): GeometryLayer {
  if (!isGeometryLayer(value)) {
    throw new Error(`${label} must be one of ${GEOMETRY_LAYERS.join(", ")}`);
  }
  return value;
}

function requireSourceKind(value: unknown, label: string): GeometryLayerSourceKind {
  const values = ["editable", "locked", "reference", "measurement", "label"] as const;
  if (typeof value !== "string" || !values.includes(value as GeometryLayerSourceKind)) {
    throw new Error(`${label} must be one of ${values.join(", ")}`);
  }
  return value as GeometryLayerSourceKind;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}
