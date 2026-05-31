export {
  GEOMETRY_LAYER_CONTRACTS,
  GEOMETRY_LAYERS,
  geometryLayerContractFor,
  isGeometryLayer,
  validateGeometryLayerContract,
  type GeometryLayer,
  type GeometryLayerContract,
  type GeometryLayerSourceKind
} from "./geometryLayerContract.js";
export {
  RENDERED_OBJECT_SOURCE_KINDS,
  createRenderedObjectContract,
  validateRenderedObjectContract,
  type RenderedObjectContract,
  type RenderedObjectSourceKind
} from "./renderedObjectContract.js";

export const FLOORPLAN_GEOMETRY_CONTRACT_SCHEMA_VERSION = "1.0.0" as const;

export type FloorplanGeometryContractStatus = {
  schemaVersion: typeof FLOORPLAN_GEOMETRY_CONTRACT_SCHEMA_VERSION;
  allRenderedObjectsHaveLayer: true;
  normalEditorRenderingRule:
    "editable_selectable_locked_reference_measurement_grid_label_or_popover";
};

export const floorplanGeometryContractStatus: FloorplanGeometryContractStatus = {
  schemaVersion: FLOORPLAN_GEOMETRY_CONTRACT_SCHEMA_VERSION,
  allRenderedObjectsHaveLayer: true,
  normalEditorRenderingRule:
    "editable_selectable_locked_reference_measurement_grid_label_or_popover"
};
