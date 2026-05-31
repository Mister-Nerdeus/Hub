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
export {
  EDITABLE_GEOMETRY_KINDS,
  EDITABLE_GEOMETRY_REGISTRY,
  editableGeometryRegistryEntryFor,
  isEditableGeometryKind,
  validateEditableGeometryRegistry,
  type EditableGeometryKind,
  type EditableGeometryRegistryEntry
} from "./editableGeometryRegistry.js";
export {
  ASSIGNMENT_TARGET_KINDS,
  assignmentTargetIdForGeometry,
  createAssignmentTargetContract,
  validateAssignmentTargetContract,
  type AssignmentTargetContract,
  type AssignmentTargetKind
} from "./assignmentTargetContract.js";
export {
  HALLWAY_GEOMETRY_KINDS,
  HALLWAY_GEOMETRY_ORIENTATIONS,
  createHallwayGeometryContract,
  validateHallwayGeometryContract,
  type HallwayGeometryContract,
  type HallwayGeometryKind,
  type HallwayGeometryOrientation
} from "./hallwayGeometryContract.js";
export {
  WALL_GEOMETRY_KINDS,
  createWallGeometryContract,
  validateWallGeometryContract,
  type WallGeometryContract,
  type WallGeometryKind
} from "./wallGeometryContract.js";
export {
  SUPPORT_STORAGE_AREA_KINDS,
  createSupportStorageAreaContract,
  validateSupportStorageAreaContract,
  type SupportStorageAreaContract,
  type SupportStorageAreaKind
} from "./supportAreaContract.js";

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
