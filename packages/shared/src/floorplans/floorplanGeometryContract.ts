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
  PERIMETER_WALL_ORIENTATIONS,
  validatePerimeterWallContract,
  type PerimeterWallContract,
  type PerimeterWallOrientation,
  type PerimeterWallSegmentContract
} from "./perimeterWallContract.js";
export {
  ENTRY_EXIT_DESTINATION_KINDS,
  ENTRY_EXIT_KINDS,
  validateEntryExitContract,
  type EntryExitContract,
  type EntryExitDestinationContract,
  type EntryExitDestinationKind,
  type EntryExitKind
} from "./entryExitContract.js";
export {
  DOOR_DESTINATION_LEADS_TO_KINDS,
  DOOR_DESTINATION_OWNER_KINDS,
  DOOR_DESTINATION_TRAVEL_ROLES,
  createUnknownDoorDestination,
  validateDoorDestinationContract,
  type DoorDestinationContract,
  type DoorDestinationLeadsToKind,
  type DoorDestinationOwnerKind,
  type DoorDestinationTravelRole
} from "./doorDestinationContract.js";
export {
  validateDoorDestinationsForLayout,
  type DoorDestinationValidationIssue,
  type DoorDestinationValidationResult,
  type DoorDestinationValidationSeverity
} from "./doorDestinationValidation.js";
export {
  canonicalErPodGeometryFixture
} from "./canonicalErPodGeometryFixture.js";
export {
  ROUTE_NODE_SOURCE_KINDS,
  routeNodeIdFor,
  validateRouteNodeContract,
  type RouteNodeContract,
  type RouteNodeSourceKind
} from "./routeNodeContract.js";
export {
  ROUTE_EDGE_SOURCE_KINDS,
  routeEdgeIdFor,
  validateRouteEdgeContract,
  type RouteEdgeContract,
  type RouteEdgeSourceKind
} from "./routeEdgeContract.js";
export {
  validateRouteGraphContract,
  validateRouteGraphWarning,
  type RouteGraphContract,
  type RouteGraphWarningContract,
  type RouteGraphWarningSeverity
} from "./routeGraphContract.js";
export {
  deriveRouteGraphFromGeometry
} from "./deriveRouteGraphFromGeometry.js";
export {
  validateRouteGraphConnectivity,
  type RouteGraphValidationResult
} from "./routeGraphValidation.js";
export {
  SUPPORT_STORAGE_AREA_KINDS,
  createSupportStorageAreaContract,
  validateSupportStorageAreaContract,
  type SupportStorageAreaContract,
  type SupportStorageAreaKind
} from "./supportAreaContract.js";
export {
  assignmentTargetIdForSplitBedPosition,
  deriveSplitRoomAssignmentTargets
} from "./assignmentTargetDerivation.js";
export {
  splitRoomValidationBlocksAssignments,
  validateSplitRoomGeometry,
  type SplitRoomValidationIssue,
  type SplitRoomValidationIssueCode
} from "./splitRoomValidation.js";
export {
  migrateLegacySplitBayToParentBed,
  type LegacySplitRoomMigrationResult
} from "./legacySplitRoomMigration.js";
export {
  createSplitRoomContract,
  validateBedPositionContract,
  validateSplitRoomContract,
  stableSplitRoomBedPositionId,
  type BedPositionContract,
  type SplitRoomContract
} from "./splitRoomContract.js";

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
