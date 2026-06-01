import { useEffect, useReducer, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  auditPathSyncStatus,
  applyDoorWidthPreset,
  canonicalErPodGeometryFixture,
  editableRoomTypeToAuthoringRoomType,
  centerDoorOnWall,
  decreaseDoorWidth,
  deriveRouteGraphFromGeometry,
  generateDoorPathNodes,
  increaseDoorWidth,
  isProviderPharmacySupportZone,
  manualStaffFixture,
  moveToOppositeWall,
  moveToWall,
  nudgeDoor,
  resolveAssignmentTargetsFromFloorplan,
  validateDoorDestinationsForLayout,
  validateRouteGraphConnectivity,
  validateSimulationReadyExport,
  type AuthoringDraftContract,
  type ActiveFloorplanContract,
  type AuthoringRoomType,
  type DoorAuthoringWarning,
  type DoorPathNodeGenerationResult,
  type EditableDoorWall,
  type ManualAssignmentSetContract,
  type PathSyncAuditResult,
  type SimulationReadyExportResult,
  type SplitRoomContract
} from "@nerdeus/shared";

import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  exportFloorplanJson,
  importFloorplanJson
} from "../floorplans/floorplanJsonImportExport";
import { editableLayoutToPlanContract } from "./editableLayoutToPlanContract";
import { DoorShape } from "./DoorShape";
import { buildDoorShapeViewModel } from "./doorShapeViewModel";
import { SupportAccessPointShape } from "./SupportAccessPointShape";
import { buildSupportAccessPointViewModel } from "./supportAccessPointViewModel";
import {
  SupportAccessQuickEditPopover,
  buildSupportAccessQuickEdit
} from "./SupportAccessQuickEditPopover";
import { BED_POSITION_RENDERER_CONTRACT } from "./BedPositionShape";
import { SplitRoomShape, SPLIT_ROOM_RENDERER_CONTRACT } from "./SplitRoomShape";
import { SplitRoomInspectorPanel } from "./SplitRoomInspectorPanel";
import { SplitRoomPreviewPanel } from "./SplitRoomPreviewPanel";
import { layoutEditorReducer, panViewportAction, type LayoutEditorAction } from "./layoutEditorReducer";
import { LayoutToolPalette, type LayoutToolMode } from "./LayoutToolPalette";
import { buildAddRoomAction } from "./addRoomTool";
import { buildAddDoorAction } from "./addDoorTool";
import { RoomTypeEditor } from "./RoomTypeEditor";
import { DoorEditor } from "./DoorEditor";
import { DoorPathNodeSyncControls } from "./DoorPathNodeSyncControls";
import { AutoHallwayControls } from "./AutoHallwayControls";
import { PodBorderShape } from "./PodBorderShape";
import { buildPodBorderViewModel } from "./podBorderViewModel";
import { LayoutDeltaPreviewPanel } from "./LayoutDeltaPreviewPanel";
import { buildLayoutDeltaPreviewViewModel } from "./layoutDeltaPreviewViewModel";
import { HallwayShape } from "./HallwayShape";
import { WallShape } from "./WallShape";
import { PerimeterWallShape } from "./PerimeterWallShape";
import { buildPerimeterWallViewModel } from "./perimeterWallViewModel";
import { EntryExitShape } from "./EntryExitShape";
import { DoorDestinationLabel } from "./DoorDestinationLabel";
import { buildDoorDestinationViewModel } from "./doorDestinationViewModel";
import {
  buildHallwayShapeViewModel,
  buildZoneShapeViewModel
} from "./hallwayZoneShapeViewModel";
import { LayoutInspectorPanel } from "./LayoutInspectorPanel";
import { buildLayoutInspectorViewModel } from "./layoutInspectorViewModel";
import {
  cancelRoomInspectorDimensionDraftField,
  commitRoomInspectorDimensionDraftField,
  createRoomInspectorDimensionDraft,
  updateRoomInspectorDimensionDraft
} from "./roomInspectorDimensionDraft";
import {
  buildLayoutLocalDraftRecord,
  loadLayoutLocalDraft,
  resetLayoutLocalDraft,
  saveLayoutLocalDraft,
  type LayoutLocalDraftStorage
} from "./layoutLocalDraftPersistence";
import { LayoutDraftRecoveryBanner } from "./LayoutDraftRecoveryBanner";
import {
  buildDraftRecoveryState,
  type DraftRecoveryState
} from "./layoutDraftRecoveryViewModel";
import { buildLayoutGridViewModel } from "./layoutGridViewModel";
import { buildLayoutObjectRenderPipeline } from "./layoutObjectRenderPipeline";
import { isLayoutObjectSelected } from "./layoutSelectionHighlight";
import { selectionFromShapeClick } from "./layoutStageSelectionEvents";
import {
  createLayoutEditorState,
  type LayoutEditorFloorplanInput,
  type LayoutEditorState
} from "./layoutEditorState";
import { LayoutValidationPanel } from "./LayoutValidationPanel";
import { buildLayoutValidationPanelViewModel } from "./layoutValidationPanelViewModel";
import { buildLayoutValidationWarning } from "./layoutValidationWarningContract";
import { EditorValidationSummaryRow } from "./EditorValidationSummaryRow";
import { ValidationDrawer } from "./ValidationDrawer";
import { buildValidationDrawerViewModel } from "./validationDrawerViewModel";
import { PathSyncStatusPanel } from "./PathSyncStatusPanel";
import { SimulationReadyExportPanel } from "./SimulationReadyExportPanel";
import { LayoutViewportToolbar } from "./LayoutViewportToolbar";
import { LayoutEditorModeToolbar } from "./LayoutEditorModeToolbar";
import { DEFAULT_LAYOUT_EDITOR_MODE, type LayoutEditorMode } from "./layoutEditorMode";
import {
  DEFAULT_LAYOUT_MAJOR_GRID_FEET,
  DEFAULT_LAYOUT_MINOR_GRID_FEET,
  DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT,
  DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS,
  DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET
} from "./layoutWorkspaceConfig";
import { RoomResizeHandles } from "./RoomResizeHandles";
import {
  buildSelectedRoomResizeHandlesViewModel,
  type RoomResizeHandle
} from "./roomResizeHandlesViewModel";
import { StationResizeHandles } from "./StationResizeHandles";
import {
  buildSelectedStationResizeHandlesViewModel,
  type StationResizeHandle
} from "./stationResizeHandlesViewModel";
import { RoomShape } from "./RoomShape";
import { buildRoomShapeViewModel } from "./roomShapeViewModel";
import {
  createLayoutAssignmentOverlay,
  type LayoutAssignmentOverlaySource
} from "./layoutAssignmentOverlayViewModel";
import { createRoomMoveSnapAccumulator } from "./roomDragMove";
import {
  accumulateRoomDragDelta,
  type RoomDragSnapAccumulator
} from "./roomDragSnapAccumulator";
import { StationShape } from "./StationShape";
import { buildStationShapeViewModel } from "./stationShapeViewModel";
import { HallwayArrowOverlay } from "./HallwayArrowOverlay";
import { buildHallwayArrowViewModels } from "./hallwayArrowViewModel";
import { DoorWallGuideOverlay } from "./DoorWallGuideOverlay";
import { buildDoorWallGuideViewModel } from "./doorWallGuideViewModel";
import { RoomAlignmentControls } from "./RoomAlignmentControls";
import { buildRoomAlignmentViewModel, type RoomAlignmentActionId } from "./roomAlignmentViewModel";
import { HallwayInspectorPanel } from "./HallwayInspectorPanel";
import { HallwayArrowEditor } from "./HallwayArrowEditor";
import { buildHallwayArrowEditorViewModel } from "./hallwayArrowEditorViewModel";
import { SupportMarkerEditor } from "./SupportMarkerEditor";
import { buildSupportMarkerEditorViewModel, validateSupportMarkerLabel } from "./supportMarkerEditorViewModel";
import { LayoutInspectorTabs } from "./LayoutInspectorTabs";
import { SupportAreaShape } from "./SupportAreaShape";
import { EditorCommandBar } from "./EditorCommandBar";
import { EditorDetailsPanel } from "./EditorDetailsPanel";
import { EditorNormalToolbar } from "./EditorNormalToolbar";
import { EditorSaveStatusPanel } from "./EditorSaveStatusPanel";
import { ReferenceOverlayRenderer } from "./ReferenceOverlayRenderer";
import { defaultReferenceOverlayViewModel } from "./referenceOverlayViewModel";
import { artifactQuarantinePolicy } from "./artifactQuarantine";
import { LAYOUT_EDITOR_RENDER_LAYER_ORDER } from "./renderLayerOrder";
import { requiresRoomMergeForSplitConversion, type SplitRoomDividerOrientation } from "./splitRoomActions";
import { buildEditorViewportLayoutViewModel } from "./editorViewportLayoutViewModel";
import { EditorNextStepPanel } from "./EditorNextStepPanel";
import { buildEditorNextStep } from "./editorNextStepViewModel";
import {
  hasCanvasPanPassedMovementThreshold,
  canvasPointerDeltaToPanFeet,
  isCanvasPanBackgroundTarget
} from "./layoutCanvasPan";
import { applyCanvasWheelNavigation } from "./layoutCanvasWheelNavigation";
import { CanvasObjectPopover } from "./CanvasObjectPopover";
import { buildCanvasObjectPopover } from "./canvasObjectPopoverViewModel";
import { CanvasViewportControls } from "./CanvasViewportControls";
import { EditorPopupModeControl, type EditorPopupMode } from "./EditorPopupModeControl";
import { useEditorWorkspaceMeasurements } from "./useEditorWorkspaceMeasurements";
import { RoomQuickEditPopover } from "./RoomQuickEditPopover";
import { buildRoomQuickEdit } from "./roomQuickEditViewModel";
import { DoorQuickEditPopover } from "./DoorQuickEditPopover";
import { buildDoorQuickEdit } from "./doorQuickEditViewModel";
import { DoorDestinationInspectorPanel } from "./DoorDestinationInspectorPanel";
import { EntryExitInspectorPanel } from "./EntryExitInspectorPanel";
import { LockedGeometryInspectorPanel } from "./LockedGeometryInspectorPanel";
import { RouteGraphOverlay } from "./RouteGraphOverlay";
import { AssignmentOverlay } from "../manual-assignment/AssignmentOverlay";
import { StationQuickEditPopover } from "./StationQuickEditPopover";
import { buildStationQuickEdit } from "./stationQuickEditViewModel";
import { HallwayZoneQuickEditPopover } from "./HallwayZoneQuickEditPopover";
import { buildHallwayZoneQuickEdit } from "./hallwayZoneQuickEditViewModel";
import { InspectorAdvancedDetails } from "./InspectorAdvancedDetails";
import {
  recordDraftTraceStage,
  recordEditableLayoutTraceStage,
  recordPlanTraceStage
} from "./layoutSaveTrace";
import { AddObjectMenu } from "./AddObjectMenu";
import {
  buildAddObjectMenuViewModel,
  isRoomPlacementMenuItem,
  roomTypeForPlacementMenuItem,
  type AddObjectMenuItemId
} from "./addObjectMenuViewModel";
import {
  buildObjectPlacementPreview,
  getDefaultPlacementSizeForObject,
  placeObjectOnCanvas
} from "./clickToPlaceObject";
import { ObjectPlacementPreview } from "./ObjectPlacementPreview";
import { PresentationLegend } from "./PresentationLegend";
import {
  createDoorRecoverySnapshot,
  saveDoorRecoverySnapshot
} from "./layoutDoorRecoverySnapshots";
import { LayoutEditorWorkspace } from "./LayoutEditorWorkspace";
import "./LayoutEditorStage.css";

const STAGE_PIXELS_PER_FOOT = DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT;
const STAGE_WIDTH_PIXELS = DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS.widthPixels;
const STAGE_HEIGHT_PIXELS = DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS.heightPixels;
const STAGE_VIEW_BOX = `0 0 ${STAGE_WIDTH_PIXELS} ${STAGE_HEIGHT_PIXELS}`;
const DETAILS_PANEL_COLLAPSED_SESSION_KEY = "nerdeus.layoutEditor.detailsPanelCollapsed.v1";

type RoomDragState = {
  roomId: string;
  lastClientX: number;
  lastClientY: number;
  accumulator: RoomDragSnapAccumulator;
};

type StationDragState = {
  stationId: string;
  lastClientX: number;
  lastClientY: number;
  accumulator: RoomDragSnapAccumulator;
};

type RoomResizeState = {
  roomId: string;
  handle: RoomResizeHandle;
  lastClientX: number;
  lastClientY: number;
};

type StationResizeState = {
  stationId: string;
  handle: StationResizeHandle;
  lastClientX: number;
  lastClientY: number;
};

type CanvasPanState = {
  startClientX: number;
  startClientY: number;
  lastClientX: number;
  lastClientY: number;
  active: boolean;
};

const baseInitialStageState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  viewport: {
    pixelsPerFoot: STAGE_PIXELS_PER_FOOT,
    zoom: 1,
    panXFeet: 0,
    panYFeet: 0
  },
  layoutBoundsFeet: DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET,
  selectedObjectId: "room-01",
  selectedObjectType: "room",
  snapMode: "default"
});

type LayoutEditorStageProps = {
  activeFloorplan?: LayoutEditorFloorplanInput | null;
  activeFloorplanContract?: ActiveFloorplanContract | null;
  assignmentOverlaySource?: LayoutAssignmentOverlaySource | null;
  manualAssignmentSet?: ManualAssignmentSetContract | null;
  onCreateWorkingCopy?: () => void;
  onSaveWorkingCopy?: (draft: AuthoringDraftContract) => SaveWorkingCopyResult;
  onSaveAsNewCopy?: (draft: AuthoringDraftContract) => SaveWorkingCopyResult;
  onDoneEditing?: () => void;
  onEditableLayoutChange?: (layout: LayoutEditorState["editableLayout"]) => void;
};

export type SaveWorkingCopyResult =
  | { status: "saved"; recordId: string; displayName: string; savedAt: string }
  | { status: "created_copy"; recordId: string; displayName: string; savedAt: string }
  | { status: "failed"; message: string };

export function LayoutEditorStage({
  activeFloorplan = null,
  activeFloorplanContract = null,
  assignmentOverlaySource = null,
  manualAssignmentSet = null,
  onCreateWorkingCopy,
  onSaveWorkingCopy,
  onSaveAsNewCopy,
  onDoneEditing,
  onEditableLayoutChange
}: LayoutEditorStageProps) {
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("forceLayoutEditorCrash") === "1"
  ) {
    throw new Error("Forced layout editor crash for local recovery verification.");
  }
  const localDraftStorage = getBrowserLocalDraftStorage();
  const [stageState, dispatchStage] = useReducer(
    layoutEditorReducer,
    undefined,
    createInitialStageState
  );
  const [roomDimensionDraft, setRoomDimensionDraft] = useState(() =>
    createRoomInspectorDimensionDraft(findSelectedRoom(stageState))
  );
  const [floorplanJsonText, setFloorplanJsonText] = useState("");
  const [floorplanJsonStatus, setFloorplanJsonStatus] = useState("Ready");
  const [saveStatus, setSaveStatus] = useState("Floorplan not saved this session");
  const [lastNamedCopySaveLabel, setLastNamedCopySaveLabel] = useState("Not saved this session");
  const [reloadProofLabel, setReloadProofLabel] = useState("Not verified this session");
  const [draftRecoveryState, setDraftRecoveryState] = useState<DraftRecoveryState>({ status: "none" });
  const [availableRecoveryDraft, setAvailableRecoveryDraft] = useState<ReturnType<typeof loadLayoutLocalDraft>["draft"]>(null);
  const [toolMode, setToolMode] = useState<LayoutToolMode>("select");
  const [editorMode, setEditorMode] = useState<LayoutEditorMode>(DEFAULT_LAYOUT_EDITOR_MODE);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(true);
  const [detailsPanelCollapsed, setDetailsPanelCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(DETAILS_PANEL_COLLAPSED_SESSION_KEY) !== "open";
  });
  const [canvasPanActive, setCanvasPanActive] = useState(false);
  const [canvasPopoverOpen, setCanvasPopoverOpen] = useState(false);
  const [popupMode, setPopupMode] = useState<EditorPopupMode>("auto");
  const [addObjectMenuOpen, setAddObjectMenuOpen] = useState(false);
  const [pendingAddObjectId, setPendingAddObjectId] = useState<AddObjectMenuItemId | null>(null);
  const [pendingAddObjectLabel, setPendingAddObjectLabel] = useState<string | null>(null);
  const [hallwayArrowState, setHallwayArrowState] = useState<Record<string, { visible?: boolean; reversed?: boolean }>>({});
  const [referenceOverlayVisible, setReferenceOverlayVisible] = useState(defaultReferenceOverlayViewModel.visible);
  const [routeGraphVisible, setRouteGraphVisible] = useState(false);
  const [placementPreviewPoint, setPlacementPreviewPoint] = useState<{
    xFeet: number;
    yFeet: number;
  } | null>(null);
  const [splitRoomPreviewOpen, setSplitRoomPreviewOpen] = useState(false);
  const [splitRoomStatusMessage, setSplitRoomStatusMessage] = useState<string | null>(null);
  const [selectedNewRoomType, setSelectedNewRoomType] =
    useState<AuthoringRoomType>("patient_room");
  const [authoringSequence, setAuthoringSequence] = useState(1);
  const [doorPathNodeGenerationResult, setDoorPathNodeGenerationResult] =
    useState<DoorPathNodeGenerationResult | null>(null);
  const [simulationReadyExportResult, setSimulationReadyExportResult] =
    useState<SimulationReadyExportResult | null>(null);
  const roomDragRef = useRef<RoomDragState | null>(null);
  const stationDragRef = useRef<StationDragState | null>(null);
  const roomResizeRef = useRef<RoomResizeState | null>(null);
  const stationResizeRef = useRef<StationResizeState | null>(null);
  const canvasPanRef = useRef<CanvasPanState | null>(null);
  const lastAppliedSaveRecordIdRef = useRef<string | null>(null);
  const selectedRoom = findSelectedRoom(stageState);
  const selectedStation = findSelectedStation(stageState);
  const selectedHallway = findSelectedHallway(stageState);
  const selectedZone = findSelectedZone(stageState);
  const selectedSupportAccessPoint = findSelectedSupportAccessPoint(stageState);
  const selectedSplitRoom = findSelectedSplitRoom(stageState);
  const selectedSplitRoomParentRoom = findSplitRoomParentRoom(stageState, selectedSplitRoom);
  const selectedBedPosition = findSelectedBedPosition(stageState);
  const selectedBedSplitRoom = findSplitRoomForBedPosition(stageState, selectedBedPosition?.bedPositionId ?? null);
  useEffect(() => {
    if (selectedSplitRoom != null || selectedBedPosition != null) {
      setSplitRoomStatusMessage(null);
    }
  }, [selectedSplitRoom?.splitRoomId, selectedBedPosition?.bedPositionId]);
  const dispatchDoorStageAction = (action: LayoutEditorAction) => {
    const snapshotContext = doorRecoverySnapshotContextFromAction(action);
    if (
      snapshotContext != null &&
      localDraftStorage != null &&
      stageState.editableLayout != null &&
      stageState.loadedFloorplan != null
    ) {
      saveDoorRecoverySnapshot(
        localDraftStorage,
        createDoorRecoverySnapshot({
          recordId: stageState.loadedFloorplan.recordId,
          editableLayout: stageState.editableLayout,
          selectedObjectId: stageState.selectedObjectId,
          selectedObjectType: stageState.selectedObjectType,
          ...snapshotContext
        })
      );
    }
    dispatchStage(action);
  };
  useEffect(() => {
    if (activeFloorplan == null) {
      return;
    }
    dispatchStage({ type: "loadActiveFloorplan", floorplan: activeFloorplan });
    if (lastAppliedSaveRecordIdRef.current === activeFloorplan.recordId) {
      lastAppliedSaveRecordIdRef.current = null;
    } else {
      setSaveStatus("Floorplan not saved this session");
      setLastNamedCopySaveLabel("Not saved this session");
      setReloadProofLabel("Not verified this session");
    }
    if (localDraftStorage != null) {
      const loadedDraft = loadLayoutLocalDraft(localDraftStorage, activeFloorplan.recordId);
      if (loadedDraft.status === "loaded") {
        setAvailableRecoveryDraft(loadedDraft.draft);
        setDraftRecoveryState(buildDraftRecoveryState(loadedDraft.draft));
      } else {
        setAvailableRecoveryDraft(null);
        setDraftRecoveryState({ status: "none" });
      }
    }
  }, [
    activeFloorplan?.recordId,
    activeFloorplan?.planId,
    activeFloorplan?.sourceKind,
    activeFloorplan?.readOnly
  ]);
  const selectedInspectorRect = selectedRoom ?? selectedStation;
  useEffect(() => {
    setRoomDimensionDraft(createRoomInspectorDimensionDraft(selectedInspectorRect));
  }, [
    selectedInspectorRect?.id,
    selectedInspectorRect?.xFeet,
    selectedInspectorRect?.yFeet,
    selectedInspectorRect?.widthFeet,
    selectedInspectorRect?.heightFeet
  ]);
  useEffect(() => {
    setDoorPathNodeGenerationResult(null);
    setSimulationReadyExportResult(null);
  }, [stageState.editableLayout, stageState.sourcePlan]);
  useEffect(() => {
    if (pendingAddObjectId == null) {
      return;
    }
    const cancelPlacement = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      setPendingAddObjectId(null);
      setPendingAddObjectLabel(null);
      setPlacementPreviewPoint(null);
      setToolMode("select");
    };
    document.addEventListener("keydown", cancelPlacement);
    return () => document.removeEventListener("keydown", cancelPlacement);
  }, [pendingAddObjectId]);
  useEffect(() => {
    const deleteSelectedDoor = (event: KeyboardEvent) => {
      if (
        stageState.readOnly ||
        editorMode !== "edit" ||
        stageState.selectedObjectType !== "door" ||
        stageState.selectedObjectId == null ||
        (event.key !== "Delete" && event.key !== "Backspace") ||
        isEditableKeyboardTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      dispatchDoorStageAction({ type: "deleteDoor", doorId: stageState.selectedObjectId });
      setCanvasPopoverOpen(false);
    };
    document.addEventListener("keydown", deleteSelectedDoor);
    return () => document.removeEventListener("keydown", deleteSelectedDoor);
  }, [
    editorMode,
    stageState.editableLayout,
    stageState.loadedFloorplan,
    stageState.readOnly,
    stageState.selectedObjectType,
    stageState.selectedObjectId
  ]);
  useEffect(() => {
    if (
      localDraftStorage == null ||
      stageState.editableLayout == null ||
      stageState.loadedFloorplan == null ||
      stageState.readOnly
    ) {
      return;
    }
    try {
      saveLayoutLocalDraft(
        localDraftStorage,
        buildLayoutLocalDraftRecord({
          recordId: stageState.loadedFloorplan.recordId,
          planId: stageState.loadedFloorplan.planId,
          sourceKind: stageState.loadedFloorplan.sourceKind,
          parentDefaultPlanId: stageState.loadedFloorplan.parentDefaultPlanId,
          displayName: stageState.loadedFloorplan.name,
          updatedAt: new Date().toISOString(),
          editableLayout: stageState.editableLayout,
          snapMode: stageState.snapMode,
          viewport: stageState.viewport,
          auditTrail: stageState.editAuditTrail,
          isDirty: stageState.isDirty
        })
      );
    } catch {
      // Live editor geometry may temporarily violate strict export validation while the user repairs doors.
    }
  }, [
    localDraftStorage,
    stageState.editableLayout,
    stageState.loadedFloorplan,
    stageState.readOnly,
    stageState.snapMode,
    stageState.viewport,
    stageState.editAuditTrail,
    stageState.isDirty
  ]);
  useEffect(() => {
    onEditableLayoutChange?.(stageState.editableLayout);
  }, [stageState.editableLayout, onEditableLayoutChange]);
  const grid = buildLayoutGridViewModel({
    workspaceBoundsFeet: stageState.layoutBoundsFeet,
    viewportSizePixels: DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS,
    viewport: stageState.viewport,
    gridSpacingFeet: DEFAULT_LAYOUT_MINOR_GRID_FEET,
    majorEveryFeet: DEFAULT_LAYOUT_MAJOR_GRID_FEET
  });
  const inspectorViewModel = buildLayoutInspectorViewModel({
    layout: stageState.editableLayout,
    selectedObjectId: stageState.selectedObjectId,
    selectedObjectType: stageState.selectedObjectType
  });
  const routeGraph = stageState.editableLayout == null
    ? null
    : deriveRouteGraphFromGeometry(stageState.editableLayout);
  const routeGraphWarnings = stageState.editableLayout == null || routeGraph == null
    ? []
    : validateRouteGraphConnectivity(stageState.editableLayout, routeGraph).warnings.map((issue) =>
        buildLayoutValidationWarning({
          code: issue.code,
          severity: issue.severity === "error" ? "blocking" : "warning",
          source: "route_graph",
          message: issue.message,
          objectType: issue.sourceObjectType,
          objectId: issue.sourceObjectId,
          isGenerated: true
        })
      );
  const doorDestinationWarnings = stageState.editableLayout == null
    ? []
    : validateDoorDestinationsForLayout(stageState.editableLayout).issues.map((issue) =>
        buildLayoutValidationWarning({
          code: issue.code,
          severity: issue.severity === "blocking" ? "blocking" : "warning",
          source: "door_destination",
          message: issue.message,
          objectType: issue.objectType,
          objectId: issue.objectId,
          isGenerated: true
        })
      );
  const validationPanelViewModel = buildLayoutValidationPanelViewModel({
    warnings: [...stageState.validationWarnings, ...doorDestinationWarnings, ...routeGraphWarnings]
  });
  const validationDrawerViewModel = buildValidationDrawerViewModel(validationPanelViewModel);
  const nextStepViewModel = buildEditorNextStep({
    hasActiveFloorplan: activeFloorplan != null,
    selectedObjectType: stageState.selectedObjectType,
    editorMode,
    validationWarningCount: stageState.validationWarnings.length
  });
  const viewportLayoutViewModel = buildEditorViewportLayoutViewModel({
    inspectorCollapsed,
    validationWarningCount: stageState.validationWarnings.length
  });
  const workspaceMeasurements = useEditorWorkspaceMeasurements(inspectorCollapsed);
  const toggleDetailsPanelCollapsed = () => {
    setDetailsPanelCollapsed((value) => {
      const nextValue = !value;
      window.sessionStorage.setItem(DETAILS_PANEL_COLLAPSED_SESSION_KEY, nextValue ? "collapsed" : "open");
      return nextValue;
    });
  };
  const validationDisabled = stageState.readOnly || stageState.sourcePlan == null || stageState.editableLayout == null;
  const deltaPreviewViewModel = buildLayoutDeltaPreviewViewModel({
    isDirty: stageState.isDirty,
    editAuditTrail: stageState.editAuditTrail
  });
  const pathSyncAudit = buildStagePathSyncAudit(stageState);
  const renderItems = stageState.editableLayout == null
    ? []
    : buildLayoutObjectRenderPipeline({
        layout: stageState.editableLayout,
        viewport: stageState.viewport
      });
  const hallwayItems = renderItems.filter((item) => item.objectType === "hallway");
  const perimeterWallItems = renderItems.filter((item) => item.objectType === "perimeter_wall");
  const outerWallViewModel = {
    wallId: "workspace-outer-boundary",
    kind: "outer_wall" as const,
    xPixels: grid.workspaceBoundary.xPixels,
    yPixels: grid.workspaceBoundary.yPixels,
    widthPixels: grid.workspaceBoundary.widthPixels,
    heightPixels: grid.workspaceBoundary.heightPixels,
    editable: false,
    blocksTravel: true,
    ariaLabel: "Outer wall boundary"
  };
  const zoneItems = renderItems.filter((item) => item.objectType === "zone");
  const splitRoomItems = renderItems.filter((item) => item.objectType === "split_room_parent");
  const splitParentRoomIds = new Set(
    stageState.editableLayout?.splitRooms?.map((splitRoom) => splitRoom.parentRoomId) ?? []
  );
  const roomItems = renderItems.filter(
    (item) => item.objectType === "room" && !splitParentRoomIds.has(item.objectId)
  );
  const doorItems = renderItems.filter((item) => item.objectType === "door");
  const entryExitItems = renderItems.filter((item) => item.objectType === "entry_exit");
  const supportAccessItems = renderItems.filter((item) => item.objectType === "support_access");
  const stationItems = renderItems.filter((item) => item.objectType === "station");
  const hallwayArrows = buildHallwayArrowViewModels(renderItems, hallwayArrowState);
  const selectedDoor =
    stageState.selectedObjectType === "door" && stageState.selectedObjectId != null
      ? stageState.editableLayout?.doors.find((door) => door.id === stageState.selectedObjectId) ?? null
      : null;
  const selectedDoorDestinationAccessPoint = selectedDoor ?? selectedSupportAccessPoint;
  const selectedEntryExit =
    stageState.selectedObjectType === "entry_exit" && stageState.selectedObjectId != null
      ? stageState.editableLayout?.entryExits?.find((entryExit) => entryExit.entryExitId === stageState.selectedObjectId) ?? null
      : null;
  const supportAccessQuickEditViewModel = buildSupportAccessQuickEdit({
    accessPoint: selectedSupportAccessPoint,
    readOnly: stageState.readOnly
  });
  const podBorderViewModel = buildPodBorderViewModel({
    layout: stageState.editableLayout,
    sourcePlanId: stageState.loadedFloorplan?.planId ?? stageState.editableLayout?.layoutId ?? "layout",
    viewport: stageState.viewport
  });
  const providerPharmacyZoneItems = zoneItems.filter(
    (item) => item.objectId === "zone-provider-pharmacy"
  );
  const assignmentOverlay = createLayoutAssignmentOverlay(stageState.editableLayout, assignmentOverlaySource);
  const manualAssignmentOverlayLayout =
    manualAssignmentSet != null &&
    stageState.editableLayout != null &&
    manualAssignmentSet.floorplanId !== stageState.editableLayout.layoutId
      ? canonicalErPodGeometryFixture
      : stageState.editableLayout;
  const manualAssignmentOverlayRouteGraph = manualAssignmentOverlayLayout == null
    ? null
    : deriveRouteGraphFromGeometry(manualAssignmentOverlayLayout);
  const manualAssignmentTargets = manualAssignmentOverlayLayout == null || manualAssignmentOverlayRouteGraph == null
    ? []
    : resolveAssignmentTargetsFromFloorplan(manualAssignmentOverlayLayout, { routeGraph: manualAssignmentOverlayRouteGraph });
  const referenceOverlayViewModel = {
    ...defaultReferenceOverlayViewModel,
    visible: referenceOverlayVisible
  };
  const roomResizeHandlesViewModel = buildSelectedRoomResizeHandlesViewModel({
    renderItems,
    selectedObjectType: stageState.selectedObjectType,
    selectedObjectId: stageState.selectedObjectId
  });
  const stationResizeHandlesViewModel = buildSelectedStationResizeHandlesViewModel({
    renderItems,
    selectedObjectType: stageState.selectedObjectType,
    selectedObjectId: stageState.selectedObjectId
  });
  const canvasObjectPopoverViewModel = canvasPopoverOpen
    ? buildCanvasObjectPopover({
        selectedObjectType: stageState.selectedObjectType,
        selectedObjectId: stageState.selectedObjectId,
        renderItems,
        popupMode,
        canvasWidthPixels: STAGE_WIDTH_PIXELS,
        canvasHeightPixels: STAGE_HEIGHT_PIXELS
      })
    : null;
  const roomQuickEditViewModel = buildRoomQuickEdit({
    room: selectedRoom,
    layout: stageState.editableLayout,
    readOnly: stageState.readOnly
  });
  const selectedRoomAttachedDoorCount = selectedRoom == null
    ? 0
    : stageState.editableLayout?.doors.filter((door) => door.ownerKind === "room" && door.ownerId === selectedRoom.id).length ?? 0;
  const doorQuickEditViewModel = buildDoorQuickEdit({
    door: selectedDoor,
    rooms: stageState.editableLayout?.rooms ?? [],
    hallways: stageState.editableLayout?.hallways ?? [],
    readOnly: stageState.readOnly
  });
  const selectedDoorOwnerRoomForControls = selectedDoor == null || stageState.editableLayout == null
    ? null
    : selectedDoor.ownerKind === "room"
      ? stageState.editableLayout.rooms.find((room) => room.id === selectedDoor.ownerId) ?? null
      : null;
  const doorWallGuideViewModel = buildDoorWallGuideViewModel({
    door: selectedDoor,
    ownerRoom: selectedDoorOwnerRoomForControls
  });
  const roomAlignmentViewModel = buildRoomAlignmentViewModel({
    selectedRoom,
    rooms: stageState.editableLayout?.rooms ?? [],
    readOnly: stageState.readOnly
  });
  const stationQuickEditViewModel = buildStationQuickEdit({
    station: selectedStation,
    readOnly: stageState.readOnly,
    presentation: editorMode === "presentation"
  });
  const hallwayZoneQuickEditViewModel = buildHallwayZoneQuickEdit({
    hallway: selectedHallway,
    zone: selectedZone,
    readOnly: stageState.readOnly,
    validationWarningCount: stageState.validationWarnings.length
  });
  const hallwayArrowEditorViewModel = buildHallwayArrowEditorViewModel({
    hallway: selectedHallway,
    readOnly: stageState.readOnly
  });
  const supportMarkerEditorViewModel = buildSupportMarkerEditorViewModel({
    zone: selectedZone,
    readOnly: stageState.readOnly
  });
  const addObjectMenuViewModel = buildAddObjectMenuViewModel();
  const objectPlacementPreviewViewModel = buildObjectPlacementPreview({
    objectType: stageState.readOnly ? null : pendingAddObjectId,
    pointFeet: placementPreviewPoint
  });
  const selectStageObject = (
    objectType: Parameters<typeof selectionFromShapeClick>[0],
    objectId: string
  ) => {
    dispatchStage({
      type: "selectObject",
      ...selectionFromShapeClick(objectType, objectId)
    });
    setCanvasPopoverOpen(true);
  };
  const startRoomMove = (roomId: string, event: PointerEvent<SVGGElement>) => {
    selectStageObject("room", roomId);
    if (stageState.readOnly) {
      return;
    }
    roomDragRef.current = {
      roomId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      accumulator: createRoomMoveSnapAccumulator(stageState.snapMode)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const startSplitRoomParentMove = (splitRoomId: string, event: PointerEvent<SVGGElement>) => {
    selectStageObject("split_room_parent", splitRoomId);
    if (stageState.readOnly) {
      return;
    }
    roomDragRef.current = {
      roomId: splitRoomId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      accumulator: createRoomMoveSnapAccumulator(stageState.snapMode)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const startStationMove = (stationId: string, event: PointerEvent<SVGGElement>) => {
    selectStageObject("station", stationId);
    if (stageState.readOnly || editorMode !== "edit") {
      return;
    }
    stationDragRef.current = {
      stationId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      accumulator: createRoomMoveSnapAccumulator(stageState.snapMode)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const exportActiveFloorplanJson = () => {
    if (stageState.sourcePlan == null || stageState.editableLayout == null) {
      setFloorplanJsonStatus("No active JSON floorplan");
      return;
    }
    try {
      const exportResult = editableLayoutToPlanContract({
        sourcePlan: stageState.sourcePlan,
        editableLayout: stageState.editableLayout
      });
      const exported = exportFloorplanJson(exportResult.plan);
      if (stageState.loadedFloorplan != null) {
        recordPlanTraceStage("exportedJsonAfterReload", {
          recordId: stageState.loadedFloorplan.recordId,
          plan: exportResult.plan
        });
      }
      setFloorplanJsonText(exported);
      setFloorplanJsonStatus(`Exported ${exportResult.plan.planId}; door/path sync deferred`);
    } catch (error) {
      setFloorplanJsonStatus(errorMessage(error));
    }
  };
  const saveWorkingCopy = () => {
    if (onSaveWorkingCopy == null) {
      setSaveStatus("Save failed: no save handler is available");
      return;
    }
    const draft = buildStageAuthoringDraft(stageState);
    if (draft == null) {
      setSaveStatus("Save failed: no active floorplan is loaded");
      return;
    }
    if (stageState.loadedFloorplan != null && stageState.editableLayout != null) {
      recordEditableLayoutTraceStage("afterEditEditableLayout", {
        recordId: stageState.loadedFloorplan.recordId,
        planId: stageState.loadedFloorplan.planId,
        editableLayout: stageState.editableLayout
      });
      recordDraftTraceStage("draftBeforeSave", {
        recordId: stageState.loadedFloorplan.recordId,
        draft
      });
    }
    const result = onSaveWorkingCopy(draft);
    applySaveResult(result);
  };
  const saveAsNewCopy = () => {
    if (onSaveAsNewCopy == null) {
      setSaveStatus("Save failed: no save handler is available");
      return;
    }
    const draft = buildStageAuthoringDraft(stageState);
    if (draft == null) {
      setSaveStatus("Save failed: no active floorplan is loaded");
      return;
    }
    if (stageState.loadedFloorplan != null && stageState.editableLayout != null) {
      recordEditableLayoutTraceStage("afterEditEditableLayout", {
        recordId: stageState.loadedFloorplan.recordId,
        planId: stageState.loadedFloorplan.planId,
        editableLayout: stageState.editableLayout
      });
      recordDraftTraceStage("draftBeforeSave", {
        recordId: stageState.loadedFloorplan.recordId,
        draft
      });
    }
    const result = onSaveAsNewCopy(draft);
    applySaveResult(result);
  };
  const restoreRecoveryDraft = () => {
    if (availableRecoveryDraft == null) {
      return;
    }
    dispatchStage({ type: "restoreLocalDraft", draft: availableRecoveryDraft });
    setDraftRecoveryState({ status: "restored", updatedAt: availableRecoveryDraft.updatedAt });
  };
  const discardRecoveryDraft = () => {
    if (localDraftStorage != null && stageState.loadedFloorplan != null) {
      resetLayoutLocalDraft(localDraftStorage, stageState.loadedFloorplan.recordId);
    }
    setAvailableRecoveryDraft(null);
    setDraftRecoveryState({ status: "discarded" });
  };
  const exportRecoveryDraftJson = () => {
    if (availableRecoveryDraft == null) {
      setFloorplanJsonStatus("No recovery draft available");
      return;
    }
    setFloorplanJsonText(JSON.stringify(availableRecoveryDraft, null, 2));
    setFloorplanJsonStatus("Recovery draft JSON exported");
  };
  const applySaveResult = (result: SaveWorkingCopyResult) => {
    if (result.status === "failed") {
      setSaveStatus(`Save failed: ${result.message}`);
      return;
    }
    const time = formatSaveTime(result.savedAt);
    const namedCopySaveLabel = `${time}`;
    lastAppliedSaveRecordIdRef.current = result.recordId;
    setSaveStatus(
      result.status === "saved"
        ? `Saved. This floorplan is active for assignments and scenarios.`
        : `Saved new version at ${time}. This floorplan is active for assignments and scenarios.`
    );
    setLastNamedCopySaveLabel(namedCopySaveLabel);
    setReloadProofLabel("Not verified after latest named-copy save");
    dispatchStage({ type: "markClean" });
  };
  const addRoomFromStageClick = (event: PointerEvent<SVGSVGElement>) => {
    const placementAction = placeObjectOnCanvas({
      objectType: pendingAddObjectId,
      readOnly: stageState.readOnly,
      target: event.target
    });
    if (placementAction === "blocked") {
      if (isCanvasPanBackgroundTarget(event.target)) {
        setCanvasPopoverOpen(false);
      }
      return;
    }
    if (placementAction === "future-object") {
      setPlacementPreviewPoint(stagePointerToFeet(event, stageState.viewport));
      return;
    }
    if (toolMode !== "add_room") {
      return;
    }
    if (pendingAddObjectId == null) {
      return;
    }
    const pointFeet = stagePointerToFeet(event, stageState.viewport);
    const defaultPlacementSize = getDefaultPlacementSizeForObject(pendingAddObjectId);
    dispatchStage(
      buildAddRoomAction({
        sequence: authoringSequence,
        draft: {
          selectedRoomType: selectedNewRoomType,
          defaultWidthFeet: defaultPlacementSize.widthFeet,
          defaultHeightFeet: defaultPlacementSize.heightFeet
        },
        xFeet: pointFeet.xFeet,
        yFeet: pointFeet.yFeet
      })
    );
    setAuthoringSequence((value) => value + 1);
    setPendingAddObjectId(null);
    setPendingAddObjectLabel(null);
    setPlacementPreviewPoint(null);
    setToolMode("select");
  };
  const addDoorToSelectedRoom = () => {
    if (stageState.readOnly) {
      dispatchStage({
        type: "recordDoorAuthoringWarning",
        warning: buildAddDoorBlockedWarning({
          reason: "Read-only plans cannot be edited.",
          roomId: stageState.selectedObjectType === "room" ? stageState.selectedObjectId : null
        })
      });
      return;
    }
    if (stageState.selectedObjectType !== "room" || stageState.selectedObjectId == null) {
      dispatchStage({
        type: "recordDoorAuthoringWarning",
        warning: buildAddDoorBlockedWarning({
          reason: "Select a patient room before adding a door.",
          roomId: null
        })
      });
      return;
    }
    const result = buildAddDoorAction({
      layout: stageState.editableLayout,
      sequence: authoringSequence,
      roomId: stageState.selectedObjectId
    });
    if (result.status === "blocked") {
      dispatchStage({
        type: "recordDoorAuthoringWarning",
        warning: buildAddDoorBlockedWarning({
          reason: result.reason,
          roomId: stageState.selectedObjectId
        })
      });
      return;
    }
    dispatchDoorStageAction(result.action);
    setAuthoringSequence((value) => value + 1);
    setToolMode("select");
  };
  const addSupportAccessToSelectedZone = () => {
    if (
      stageState.readOnly ||
      selectedZone == null ||
      !isProviderPharmacySupportZone(selectedZone)
    ) {
      return;
    }
    dispatchDoorStageAction({
      type: "addSupportAccessPoint",
      accessPointId: `support-access-${String(authoringSequence).padStart(3, "0")}`,
      zoneId: selectedZone.id,
      wall: "south",
      offsetFeet: 1,
      widthFeet: 4
    });
    setAuthoringSequence((value) => value + 1);
    setToolMode("select");
  };
  const convertSelectedRoomToSplitRoom = () => {
    if (
      stageState.readOnly ||
      stageState.selectedObjectType !== "room" ||
      stageState.selectedObjectId == null
    ) {
      return;
    }
    dispatchStage({
      type: "convertSelectedRoomToSplitRoom",
      roomId: stageState.selectedObjectId
    });
    setSplitRoomPreviewOpen(false);
  };
  const selectAddObjectMenuItem = (itemId: AddObjectMenuItemId) => {
    if (stageState.readOnly) {
      return;
    }
    const item = addObjectMenuViewModel.items.find((candidate) => candidate.id === itemId);
    setPendingAddObjectId(itemId);
    setPendingAddObjectLabel(item?.placementModeLabel ?? null);
    setPlacementPreviewPoint(null);
    setAddObjectMenuOpen(false);
    if (isRoomPlacementMenuItem(itemId)) {
      const nextRoomType = roomTypeForPlacementMenuItem(itemId);
      if (nextRoomType != null) {
        setSelectedNewRoomType(nextRoomType);
      }
      setToolMode("add_room");
      return;
    }
    if (itemId === "door") {
      setToolMode("add_door");
      return;
    }
    setToolMode("select");
  };
  const generateDoorPathNodesFromStage = () => {
    if (stageState.sourcePlan == null || stageState.editableLayout == null || stageState.readOnly) {
      return;
    }
    setDoorPathNodeGenerationResult(generateDoorPathNodes({
      sourcePlan: stageState.sourcePlan,
      editableLayout: stageState.editableLayout,
      replaceGenerated: true
    }));
  };
  const validateSimulationReadyExportFromStage = () => {
    if (stageState.readOnly) {
      return;
    }
    const draft = buildStageAuthoringDraft(stageState);
    if (draft == null) {
      return;
    }
    setSimulationReadyExportResult(validateSimulationReadyExport({ authoringDraft: draft }));
  };
  const selectedDoorOwnerRoom = () => {
    if (selectedDoor == null || stageState.editableLayout == null) {
      return null;
    }
    if (selectedDoor.ownerKind !== "room") {
      return null;
    }
    return stageState.editableLayout.rooms.find((room) => room.id === selectedDoor.ownerId) ?? null;
  };
  const computeDoorWallMove = (wall: EditableDoorWall) => {
    const ownerRoom = selectedDoorOwnerRoom();
    return selectedDoor == null || ownerRoom == null ? null : moveToWall({ door: selectedDoor, room: ownerRoom, wall });
  };
  const computeDoorNudge = (deltaFeet: number) => {
    const ownerRoom = selectedDoorOwnerRoom();
    return selectedDoor == null || ownerRoom == null ? null : nudgeDoor({ door: selectedDoor, room: ownerRoom, deltaFeet });
  };
  const computeDoorCenter = () => {
    const ownerRoom = selectedDoorOwnerRoom();
    return selectedDoor == null || ownerRoom == null ? null : centerDoorOnWall({ door: selectedDoor, room: ownerRoom });
  };
  const computeDoorOpposite = () => {
    const ownerRoom = selectedDoorOwnerRoom();
    return selectedDoor == null || ownerRoom == null ? null : moveToOppositeWall({ door: selectedDoor, room: ownerRoom });
  };
  const computeDoorWidthUpdate = (direction: "increase" | "decrease" | number) => {
    const ownerRoom = selectedDoorOwnerRoom();
    if (selectedDoor == null || ownerRoom == null) {
      return null;
    }
    if (direction === "increase") {
      return increaseDoorWidth({ door: selectedDoor, room: ownerRoom });
    }
    if (direction === "decrease") {
      return decreaseDoorWidth({ door: selectedDoor, room: ownerRoom });
    }
    return applyDoorWidthPreset({ door: selectedDoor, room: ownerRoom, widthFeet: direction });
  };
  const updateSelectedDoorWidth = (direction: "increase" | "decrease" | number) => {
    const next = computeDoorWidthUpdate(direction);
    if (next != null && doorQuickEditViewModel.doorId != null && selectedDoor != null) {
      dispatchDoorStageAction({
        type: "updateDoorWidth",
        doorId: doorQuickEditViewModel.doorId,
        wall: selectedDoor.wall,
        offsetFeet: next.offsetFeet,
        widthFeet: next.widthFeet
      });
    }
  };
  const moveSelectedSupportAccess = (wall: EditableDoorWall, offsetFeet: number) => {
    if (selectedSupportAccessPoint == null) {
      return;
    }
    dispatchDoorStageAction({
      type: "moveSupportAccessPoint",
      accessPointId: selectedSupportAccessPoint.id,
      wall,
      offsetFeet
    });
  };
  const updateSelectedSupportAccessWidth = (deltaFeet: number) => {
    if (selectedSupportAccessPoint == null) {
      return;
    }
    dispatchDoorStageAction({
      type: "updateSupportAccessPointWidth",
      accessPointId: selectedSupportAccessPoint.id,
      wall: selectedSupportAccessPoint.wall,
      offsetFeet: selectedSupportAccessPoint.offsetFeet,
      widthFeet: selectedSupportAccessPoint.widthFeet + deltaFeet
    });
  };
  const updateSelectedSplitRoomDividerOrientation = (dividerOrientation: SplitRoomDividerOrientation) => {
    if (selectedSplitRoom == null) {
      return;
    }
    dispatchStage({
      type: "editSplitRoomDividerOrientation",
      splitRoomId: selectedSplitRoom.splitRoomId,
      dividerOrientation
    });
  };
  const updateSelectedSplitRoomDividerRatio = (dividerRatio: number) => {
    if (selectedSplitRoom == null) {
      return;
    }
    dispatchStage({
      type: "editSplitRoomDividerRatio",
      splitRoomId: selectedSplitRoom.splitRoomId,
      dividerRatio
    });
  };
  const resetSelectedSplitRoomDivider = () => {
    if (selectedSplitRoom == null) {
      return;
    }
    dispatchStage({
      type: "resetSplitRoomDivider",
      splitRoomId: selectedSplitRoom.splitRoomId
    });
  };
  const unsplitSelectedSplitRoom = () => {
    if (selectedSplitRoom == null) {
      return;
    }
    setSplitRoomStatusMessage("Split Room removed. Parent room footprint remains available.");
    dispatchStage({
      type: "unsplitSplitRoom",
      splitRoomId: selectedSplitRoom.splitRoomId
    });
  };
  const applyRoomAlignment = (actionId: RoomAlignmentActionId) => {
    dispatchStage({
      type: "alignSelectedRoom",
      operation: actionId,
      referenceRoomId: roomAlignmentViewModel.referenceRoomId
    });
  };
  const reverseSelectedHallwayArrow = () => {
    if (selectedHallway == null) return;
    setHallwayArrowState((state) => ({
      ...state,
      [selectedHallway.id]: {
        ...state[selectedHallway.id],
        reversed: state[selectedHallway.id]?.reversed !== true
      }
    }));
  };
  const setSelectedHallwayArrowVisible = (visible: boolean) => {
    if (selectedHallway == null) return;
    setHallwayArrowState((state) => ({
      ...state,
      [selectedHallway.id]: {
        ...state[selectedHallway.id],
        visible
      }
    }));
  };
  const importEditableFloorplanJson = () => {
    try {
      const plan = importFloorplanJson(floorplanJsonText);
      dispatchStage({
        type: "loadActiveFloorplan",
        floorplan: {
          recordId: `imported-${plan.planId}`,
          planId: plan.planId,
          name: plan.name,
          sourceKind: "saved-json",
          readOnly: false,
          parentDefaultPlanId: null,
          plan
        }
      });
      setFloorplanJsonStatus(`Imported ${plan.planId}`);
    } catch (error) {
      setFloorplanJsonStatus(errorMessage(error));
    }
  };
  const moveRoom = (roomId: string, event: PointerEvent<SVGGElement>) => {
    const drag = roomDragRef.current;
    if (drag == null || drag.roomId !== roomId) {
      return;
    }

    const deltaXFeet = pixelsDeltaToFeet(event.clientX - drag.lastClientX, stageState.viewport);
    const deltaYFeet = pixelsDeltaToFeet(event.clientY - drag.lastClientY, stageState.viewport);
    const accumulation = accumulateRoomDragDelta(drag.accumulator, { deltaXFeet, deltaYFeet });

    roomDragRef.current = {
      roomId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      accumulator: accumulation.accumulator
    };

    if (accumulation.emittedDelta.deltaXFeet === 0 && accumulation.emittedDelta.deltaYFeet === 0) {
      return;
    }

    dispatchStage({
      type: "moveRoom",
      roomId,
      ...accumulation.emittedDelta
    });
  };
  const endRoomMove = (roomId: string, event: PointerEvent<SVGGElement>) => {
    if (roomDragRef.current?.roomId === roomId) {
      roomDragRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const moveSplitRoomParentFromStage = (splitRoomId: string, event: PointerEvent<SVGGElement>) => {
    const drag = roomDragRef.current;
    if (drag == null || drag.roomId !== splitRoomId) {
      return;
    }

    const deltaXFeet = pixelsDeltaToFeet(event.clientX - drag.lastClientX, stageState.viewport);
    const deltaYFeet = pixelsDeltaToFeet(event.clientY - drag.lastClientY, stageState.viewport);
    const accumulation = accumulateRoomDragDelta(drag.accumulator, { deltaXFeet, deltaYFeet });

    roomDragRef.current = {
      roomId: splitRoomId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      accumulator: accumulation.accumulator
    };

    if (accumulation.emittedDelta.deltaXFeet === 0 && accumulation.emittedDelta.deltaYFeet === 0) {
      return;
    }

    dispatchStage({
      type: "moveSplitRoomParent",
      splitRoomId,
      ...accumulation.emittedDelta
    });
  };
  const endSplitRoomParentMove = (splitRoomId: string, event: PointerEvent<SVGGElement>) => {
    if (roomDragRef.current?.roomId === splitRoomId) {
      roomDragRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const moveStation = (stationId: string, event: PointerEvent<SVGGElement>) => {
    const drag = stationDragRef.current;
    if (drag == null || drag.stationId !== stationId) {
      return;
    }

    const deltaXFeet = pixelsDeltaToFeet(event.clientX - drag.lastClientX, stageState.viewport);
    const deltaYFeet = pixelsDeltaToFeet(event.clientY - drag.lastClientY, stageState.viewport);
    const accumulation = accumulateRoomDragDelta(drag.accumulator, { deltaXFeet, deltaYFeet });

    stationDragRef.current = {
      stationId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      accumulator: accumulation.accumulator
    };

    if (accumulation.emittedDelta.deltaXFeet === 0 && accumulation.emittedDelta.deltaYFeet === 0) {
      return;
    }

    dispatchStage({
      type: "moveStation",
      stationId,
      ...accumulation.emittedDelta
    });
  };
  const endStationMove = (stationId: string, event: PointerEvent<SVGGElement>) => {
    if (stationDragRef.current?.stationId === stationId) {
      stationDragRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const startStationResize = (
    stationId: string,
    handle: StationResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (stageState.readOnly) {
      return;
    }
    if (stageState.selectedObjectType !== "station" || stageState.selectedObjectId !== stationId) {
      return;
    }
    stationResizeRef.current = {
      stationId,
      handle,
      lastClientX: event.clientX,
      lastClientY: event.clientY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const resizeStation = (
    stationId: string,
    handle: StationResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => {
    const resize = stationResizeRef.current;
    if (resize == null || resize.stationId !== stationId || resize.handle !== handle) {
      return;
    }
    const deltaXFeet = pixelsDeltaToFeet(event.clientX - resize.lastClientX, stageState.viewport);
    const deltaYFeet = pixelsDeltaToFeet(event.clientY - resize.lastClientY, stageState.viewport);
    stationResizeRef.current = {
      stationId,
      handle,
      lastClientX: event.clientX,
      lastClientY: event.clientY
    };
    if (deltaXFeet === 0 && deltaYFeet === 0) {
      return;
    }
    dispatchStage({
      type: "resizeStation",
      stationId,
      handle,
      deltaXFeet,
      deltaYFeet
    });
  };
  const endStationResize = (
    stationId: string,
    handle: StationResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => {
    if (stationResizeRef.current?.stationId === stationId && stationResizeRef.current.handle === handle) {
      stationResizeRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const startRoomResize = (
    roomId: string,
    handle: RoomResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (stageState.readOnly) {
      return;
    }
    if (
      stageState.selectedObjectId !== roomId ||
      (stageState.selectedObjectType !== "room" && stageState.selectedObjectType !== "split_room_parent")
    ) {
      return;
    }
    roomResizeRef.current = {
      roomId,
      handle,
      lastClientX: event.clientX,
      lastClientY: event.clientY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const resizeRoom = (
    roomId: string,
    handle: RoomResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => {
    const resize = roomResizeRef.current;
    if (resize == null || resize.roomId !== roomId || resize.handle !== handle) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const deltaXFeet = pixelsDeltaToFeet(event.clientX - resize.lastClientX, stageState.viewport);
    const deltaYFeet = pixelsDeltaToFeet(event.clientY - resize.lastClientY, stageState.viewport);
    roomResizeRef.current = {
      roomId,
      handle,
      lastClientX: event.clientX,
      lastClientY: event.clientY
    };
    if (deltaXFeet === 0 && deltaYFeet === 0) {
      return;
    }

    dispatchStage(
      stageState.selectedObjectType === "split_room_parent"
        ? {
            type: "resizeSplitRoomParent",
            splitRoomId: roomId,
            handle,
            deltaXFeet,
            deltaYFeet
          }
        : {
            type: "resizeRoom",
            roomId,
            handle,
            deltaXFeet,
            deltaYFeet
          }
    );
  };
  const endRoomResize = (
    roomId: string,
    handle: RoomResizeHandle,
    event: PointerEvent<SVGRectElement>
  ) => {
    if (roomResizeRef.current?.roomId === roomId && roomResizeRef.current.handle === handle) {
      roomResizeRef.current = null;
    }
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const startCanvasPan = (event: PointerEvent<SVGSVGElement>) => {
    if (toolMode !== "select" || !isCanvasPanBackgroundTarget(event.target)) {
      return;
    }
    event.preventDefault();
    canvasPanRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      active: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveCanvasPan = (event: PointerEvent<SVGSVGElement>) => {
    if (pendingAddObjectId != null && !stageState.readOnly) {
      setPlacementPreviewPoint(stagePointerToFeet(event, stageState.viewport));
    }
    const pan = canvasPanRef.current;
    if (pan == null) {
      return;
    }
    event.preventDefault();
    if (!pan.active) {
      const passedThreshold = hasCanvasPanPassedMovementThreshold(
        event.clientX - pan.startClientX,
        event.clientY - pan.startClientY
      );
      if (!passedThreshold) {
        return;
      }
      canvasPanRef.current = {
        ...pan,
        active: true
      };
      setCanvasPanActive(true);
    }
    const delta = canvasPointerDeltaToPanFeet({
      deltaClientX: event.clientX - pan.lastClientX,
      deltaClientY: event.clientY - pan.lastClientY,
      pixelsPerFoot: stageState.viewport.pixelsPerFoot,
      zoom: stageState.viewport.zoom
    });
    canvasPanRef.current = {
      startClientX: pan.startClientX,
      startClientY: pan.startClientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      active: true
    };
    if (delta.deltaXFeet !== 0 || delta.deltaYFeet !== 0) {
      dispatchStage({ type: "panViewport", ...delta });
    }
  };
  const endCanvasPan = (event: PointerEvent<SVGSVGElement>) => {
    if (canvasPanRef.current != null) {
      canvasPanRef.current = null;
      setCanvasPanActive(false);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleCanvasWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const navigation = applyCanvasWheelNavigation({
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      viewport: stageState.viewport
    });
    if (navigation.type === "zoom") {
      dispatchStage({ type: "zoomViewport", direction: navigation.direction });
      return;
    }
    if (navigation.deltaXFeet !== 0 || navigation.deltaYFeet !== 0) {
      dispatchStage({
        type: "panViewport",
        deltaXFeet: navigation.deltaXFeet,
        deltaYFeet: navigation.deltaYFeet
      });
    }
  };

  return (
    <LayoutEditorWorkspace>
    <section
      id="layout-editor-stage-proof"
      className="layout-editor-stage"
      aria-labelledby="layout-editor-stage-title"
      data-active-floorplan-version-id={activeFloorplanContract?.activeFloorplanVersionId ?? ""}
    >
      <header className="layout-editor-stage__header">
        <div>
          <p className="eyebrow">Layout editor</p>
          <h2 id="layout-editor-stage-title">Floorplan editor</h2>
        </div>
        <details className="layout-editor-stage__meta">
          <summary>Advanced editor status</summary>
        <dl aria-label="Layout editor stage metadata">
          <div>
            <dt>Layout</dt>
            <dd>{stageState.loadedFloorplan?.planId ?? stageState.editableLayout?.layoutId}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{stageState.readOnly ? "Read-only" : "Editable"}</dd>
          </div>
          <div>
            <dt>Units</dt>
            <dd>{stageState.editableLayout?.units}</dd>
          </div>
          <div>
            <dt>Snap</dt>
            <dd>{stageState.snapMode}</dd>
          </div>
        </dl>
        </details>
      </header>

      {addObjectMenuOpen ? (
        <AddObjectMenu
          viewModel={addObjectMenuViewModel}
          readOnly={stageState.readOnly}
          onSelect={selectAddObjectMenuItem}
        />
      ) : null}
      {pendingAddObjectLabel == null ? null : (
        <p className="layout-editor-stage__placement-mode" role="status">
          {pendingAddObjectLabel}
        </p>
      )}

      <EditorNextStepPanel viewModel={nextStepViewModel} />

      <div
        className="layout-editor-stage__tool-strip"
        data-editor-toolbar-docked="above-canvas"
        data-toolbar-directly-above-canvas="true"
      >
        <EditorNormalToolbar
          saveDisabled={activeFloorplan == null}
          addDisabled={stageState.readOnly}
          onSaveFloorplan={saveWorkingCopy}
          onDoneEditing={onDoneEditing ?? (() => undefined)}
          onAddRoom={() => selectAddObjectMenuItem("patient_care_room")}
          onAddDoor={addDoorToSelectedRoom}
          onAddSplitRoom={convertSelectedRoomToSplitRoom}
          onAddNurseStation={() => selectAddObjectMenuItem("nurse_station")}
          referenceOverlayVisible={referenceOverlayVisible}
          onToggleReferenceOverlay={() => setReferenceOverlayVisible((visible) => !visible)}
          routeGraphVisible={routeGraphVisible}
          onToggleRouteGraph={() => setRouteGraphVisible((visible) => !visible)}
          advancedContent={(
            <div className="layout-editor-stage__advanced-toolbar-content">
              <EditorSaveStatusPanel
                activeCopyName={stageState.loadedFloorplan?.name ?? "No active copy"}
                activeRecordId={stageState.loadedFloorplan?.recordId ?? null}
                activePlanId={stageState.loadedFloorplan?.planId ?? null}
                activeSourceLabel={sourceKindDisplayLabel(stageState.loadedFloorplan?.sourceKind ?? null)}
                localRecoveryDraftLabel={localRecoveryDraftStatusLabel(draftRecoveryState)}
                lastNamedCopySaveLabel={lastNamedCopySaveLabel}
                reloadProofLabel={reloadProofLabel}
                readOnly={stageState.readOnly}
                isDirty={stageState.isDirty}
                saveStatus={saveStatus}
              />
              <LayoutDraftRecoveryBanner
                state={draftRecoveryState}
                onRestore={restoreRecoveryDraft}
                onDiscard={discardRecoveryDraft}
                onExportJson={exportRecoveryDraftJson}
              />
              <details className="layout-editor-stage__json-drawer">
                <summary>Advanced editor payload</summary>
                <textarea
                  aria-label="Floorplan JSON"
                  value={floorplanJsonText}
                  onChange={(event) => setFloorplanJsonText(event.target.value)}
                  spellCheck={false}
                />
              </details>
              <EditorCommandBar
                layoutLabel={stageState.loadedFloorplan?.planId ?? stageState.editableLayout?.layoutId ?? "layout"}
                hasActiveFloorplan={activeFloorplan != null}
                activeCopyName={stageState.loadedFloorplan?.name ?? "No active copy"}
                activeRecordId={stageState.loadedFloorplan?.recordId ?? null}
                activePlanId={stageState.loadedFloorplan?.planId ?? null}
                activeSourceLabel={sourceKindDisplayLabel(stageState.loadedFloorplan?.sourceKind ?? null)}
                localRecoveryDraftLabel={localRecoveryDraftStatusLabel(draftRecoveryState)}
                lastNamedCopySaveLabel={lastNamedCopySaveLabel}
                reloadProofLabel={reloadProofLabel}
                hasLocalRecoveryDraft={availableRecoveryDraft != null}
                readOnly={stageState.readOnly}
                isDirty={stageState.isDirty}
                undoDisabled={stageState.history.past.length === 0}
                redoDisabled={stageState.history.future.length === 0}
                jsonStatus={floorplanJsonStatus}
                saveStatus={saveStatus}
                validationSummary={viewportLayoutViewModel.validationSummary}
                validationDisabled={validationDisabled}
                inspectorCollapsed={detailsPanelCollapsed}
                onUndo={() => dispatchStage({ type: "undoLayoutEdit" })}
                onRedo={() => dispatchStage({ type: "redoLayoutEdit" })}
                onRestoreDraft={restoreRecoveryDraft}
                onResetDraft={() => {
                  if (localDraftStorage != null && stageState.loadedFloorplan != null) {
                    resetLayoutLocalDraft(localDraftStorage, stageState.loadedFloorplan.recordId);
                  }
                  if (activeFloorplan == null) {
                    dispatchStage({ type: "loadLayout", layout: layoutEditorProofFixture });
                  } else {
                    dispatchStage({ type: "loadActiveFloorplan", floorplan: activeFloorplan });
                  }
                }}
                onSaveWorkingCopy={saveWorkingCopy}
                onSaveAsNewCopy={saveAsNewCopy}
                onDoneEditing={onDoneEditing ?? (() => undefined)}
                onExportJson={exportActiveFloorplanJson}
                onImportJson={importEditableFloorplanJson}
                onValidate={validateSimulationReadyExportFromStage}
                onResetView={() => dispatchStage({ type: "resetViewport" })}
                onAddObject={() => setAddObjectMenuOpen((value) => !value)}
                onToggleInspector={toggleDetailsPanelCollapsed}
              />
              <div
                className="layout-editor-stage__legacy-toolbar"
                aria-label="Advanced editor controls"
                data-editor-detailed-tools-advanced="true"
              >
                <LayoutEditorModeToolbar mode={editorMode} onModeChange={setEditorMode} />
                {editorMode === "edit" ? (
                  <>
                    <LayoutToolPalette
                      mode={toolMode}
                      selectedRoomType={selectedNewRoomType}
                      readOnly={stageState.readOnly}
                      onCreateWorkingCopy={onCreateWorkingCopy}
                      onModeChange={(mode) => {
                        setToolMode(mode);
                        if (mode === "add_door") {
                          addDoorToSelectedRoom();
                        }
                      }}
                      onRoomTypeChange={setSelectedNewRoomType}
                      onGenerateHallways={() => dispatchStage({ type: "generateAutoHallways" })}
                    />
                    <details className="layout-editor-stage__advanced-tools">
                      <summary>Advanced tools</summary>
                      <div className="layout-editor-stage__advanced-tools-body">
                        <AutoHallwayControls
                          readOnly={stageState.readOnly}
                          generatedCount={stageState.editableLayout?.hallways.filter((hallway) =>
                            hallway.id.startsWith("generated-hallway-")
                          ).length ?? 0}
                          onGenerate={() => dispatchStage({ type: "generateAutoHallways" })}
                        />
                        <DoorPathNodeSyncControls
                          readOnly={stageState.readOnly || stageState.sourcePlan == null || stageState.editableLayout == null}
                          generatedNodeCount={doorPathNodeGenerationResult?.generatedNodes.length ?? 0}
                          generatedEdgeCount={doorPathNodeGenerationResult?.generatedEdgeIds.length ?? 0}
                          pathSyncStatus={doorPathNodeGenerationResult?.pathSyncStatus ?? null}
                          warningCodes={doorPathNodeGenerationResult?.warningCodes ?? []}
                          onGenerate={generateDoorPathNodesFromStage}
                        />
                        {simulationReadyExportResult == null ? null : (
                          <SimulationReadyExportPanel
                            result={simulationReadyExportResult}
                            disabled={validationDisabled}
                            onValidateExport={validateSimulationReadyExportFromStage}
                            showValidateButton={false}
                          />
                        )}
                      </div>
                    </details>
                  </>
                ) : null}
                <LayoutViewportToolbar
                  viewport={stageState.viewport}
                  onZoomIn={() => dispatchStage({ type: "zoomViewport", direction: "in" })}
                  onZoomOut={() => dispatchStage({ type: "zoomViewport", direction: "out" })}
                  onPanNorth={() => dispatchStage(panViewportAction("north"))}
                  onPanSouth={() => dispatchStage(panViewportAction("south"))}
                  onPanWest={() => dispatchStage(panViewportAction("west"))}
                  onPanEast={() => dispatchStage(panViewportAction("east"))}
                  onReset={() => dispatchStage({ type: "resetViewport" })}
                  onFit={() => dispatchStage({ type: "fitViewport" })}
                />
                <EditorPopupModeControl mode={popupMode} onModeChange={setPopupMode} />
              </div>
            </div>
          )}
        />
      </div>

      <div
        className={viewportLayoutViewModel.workspaceClassName}
        style={workspaceMeasurements.workspaceStyle}
        data-editor-canvas-height={workspaceMeasurements.canvasHeight}
        {...viewportLayoutViewModel.dataAttributes}
      >
        <div className="layout-editor-stage__shell" data-proof-only="true" ref={workspaceMeasurements.shellRef}>
          <CanvasViewportControls
            viewport={stageState.viewport}
            popupMode={popupMode}
            onZoomIn={() => dispatchStage({ type: "zoomViewport", direction: "in" })}
            onZoomOut={() => dispatchStage({ type: "zoomViewport", direction: "out" })}
            onPanNorth={() => dispatchStage(panViewportAction("north"))}
            onPanSouth={() => dispatchStage(panViewportAction("south"))}
            onPanWest={() => dispatchStage(panViewportAction("west"))}
            onPanEast={() => dispatchStage(panViewportAction("east"))}
            onReset={() => dispatchStage({ type: "resetViewport" })}
            onFit={() => dispatchStage({ type: "fitViewport" })}
            onPopupModeChange={setPopupMode}
          />
          <p className="layout-editor-stage__pan-helper" data-canvas-pan-helper="true">
            Drag the hallway/background to pan the map.
          </p>
          <SplitRoomPreviewPanel
            viewModel={splitRoomPreviewOpen ? roomQuickEditViewModel.splitRoomAction : null}
            onClose={() => setSplitRoomPreviewOpen(false)}
          />
          {splitRoomStatusMessage == null ? null : (
            <p className="split-room-status-message" role="status" data-split-room-status-message="true">
              {splitRoomStatusMessage}
            </p>
          )}
          <svg
            className={`layout-editor-stage__svg layout-editor-stage--${editorMode}`}
            viewBox={STAGE_VIEW_BOX}
            role="img"
            aria-label="Feet-based SVG grid stage"
            data-render-item-count={renderItems.length}
            data-room-render-count={roomItems.length}
            data-split-bay-render-count={stageState.editableLayout?.splitBays?.length ?? 0}
            data-split-room-parent-render-count={splitRoomItems.length}
            data-split-room-renderer-contract={SPLIT_ROOM_RENDERER_CONTRACT}
            data-bed-position-renderer-contract={BED_POSITION_RENDERER_CONTRACT}
            data-split-bed-selection-contract="independent-bed-positions"
            data-split-parent-selection-contract="separate-parent-room"
            data-split-room-parent-move-contract="move-parent-footprint-bed-ratios-stable"
            data-split-room-parent-resize-contract="resize-parent-recalculate-bed-relative-bounds"
            data-support-access-render-count={supportAccessItems.length}
            data-station-render-count={stationItems.length}
            data-provider-pharmacy-zone-render-count={providerPharmacyZoneItems.length}
            data-floorplan-source-kind={stageState.loadedFloorplan?.sourceKind ?? "proof-fixture"}
            data-validation-warning-count={stageState.validationWarnings.length}
            data-read-only={stageState.readOnly ? "true" : "false"}
            data-editor-mode={editorMode}
            data-reference-overlay-visible={referenceOverlayVisible ? "true" : "false"}
            data-route-graph-overlay-visible={routeGraphVisible ? "true" : "false"}
            data-route-node-count={routeGraph?.nodes.length ?? 0}
            data-route-edge-count={routeGraph?.edges.length ?? 0}
            data-artifact-quarantine-policy={artifactQuarantinePolicy.unknownVisuals}
            data-hit-testing-contract="geometry-truth-v1"
            data-render-layer-order={LAYOUT_EDITOR_RENDER_LAYER_ORDER.join("|")}
            data-split-room-merge-required={requiresRoomMergeForSplitConversion() ? "true" : "false"}
            data-canvas-pan={canvasPanActive ? "grabbing" : "grab"}
            data-pan-x-feet={stageState.viewport.panXFeet}
            data-pan-y-feet={stageState.viewport.panYFeet}
            data-placement-object={pendingAddObjectId ?? "none"}
            onClick={addRoomFromStageClick}
            onPointerDown={startCanvasPan}
            onPointerMove={moveCanvasPan}
            onPointerUp={endCanvasPan}
            onPointerCancel={endCanvasPan}
            onWheel={handleCanvasWheel}
          >
            <rect
              className="layout-editor-stage__viewport-frame"
              data-canvas-pan-background="true"
              x="0"
              y="0"
              width={STAGE_WIDTH_PIXELS}
              height={STAGE_HEIGHT_PIXELS}
              rx="0"
            />
            <WallShape viewModel={outerWallViewModel} onSelect={(_, wallId) => selectStageObject("outer_wall", wallId)} />
            <g className="layout-editor-stage__background-objects">
              {perimeterWallItems.map((item) => (
                <PerimeterWallShape
                  key={item.hitTargetKey}
                  viewModel={buildPerimeterWallViewModel(item, stageState.viewport)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                />
              ))}
              {podBorderViewModel == null ? null : (
                <ReferenceOverlayRenderer viewModel={referenceOverlayViewModel}>
                  <PodBorderShape viewModel={podBorderViewModel} />
                </ReferenceOverlayRenderer>
              )}
              {hallwayItems.map((item) => (
                <HallwayShape
                  key={item.hitTargetKey}
                  viewModel={buildHallwayShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                />
              ))}
              {zoneItems.map((item) => (
                <SupportAreaShape
                  key={item.hitTargetKey}
                  viewModel={buildZoneShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                />
              ))}
            </g>
            {editorMode === "presentation" ? (
              <HallwayArrowOverlay arrows={hallwayArrows} />
            ) : null}
            <RouteGraphOverlay
              graph={routeGraph}
              viewport={stageState.viewport}
              visible={routeGraphVisible}
            />
            <g
              className="layout-editor-stage__grid"
              data-grid-state={
                editorMode === "edit"
                  ? "visible"
                  : editorMode === "assignment"
                    ? "muted"
                    : "hidden"
              }
            >
              {grid.verticalLines.map((line) => (
                <line
                  key={line.id}
                  className={line.isMajor ? "layout-editor-stage__grid-line--major" : "layout-editor-stage__grid-line"}
                  x1={line.x1Pixels}
                  y1={line.y1Pixels}
                  x2={line.x2Pixels}
                  y2={line.y2Pixels}
                />
              ))}
              {grid.horizontalLines.map((line) => (
                <line
                  key={line.id}
                  className={line.isMajor ? "layout-editor-stage__grid-line--major" : "layout-editor-stage__grid-line"}
                  x1={line.x1Pixels}
                  y1={line.y1Pixels}
                  x2={line.x2Pixels}
                  y2={line.y2Pixels}
                />
              ))}
            </g>
            <g className="layout-editor-stage__rooms">
              {splitRoomItems.map((item) => {
                const splitRoom = stageState.editableLayout?.splitRooms?.find(
                  (candidate) => candidate.splitRoomId === item.objectId
                );
                return splitRoom == null ? null : (
                  <SplitRoomShape
                    key={item.hitTargetKey}
                    splitRoom={splitRoom}
                    parentBounds={{
                      xPixels: item.displayRectPixels.xPixels,
                      yPixels: item.displayRectPixels.yPixels,
                      widthPixels: item.displayRectPixels.widthPixels,
                      heightPixels: item.displayRectPixels.heightPixels
                    }}
                    isSelected={isLayoutObjectSelected({
                      objectType: "split_room_parent",
                      objectId: splitRoom.splitRoomId,
                      selectedObjectType: stageState.selectedObjectType,
                      selectedObjectId: stageState.selectedObjectId
                    })}
                    selectedBedPositionId={
                      stageState.selectedObjectType === "bed_position" ? stageState.selectedObjectId : null
                    }
                    onSelectParent={(splitRoomId) => selectStageObject("split_room_parent", splitRoomId)}
                    onSelectBedPosition={selectStageObject}
                    onMoveStart={startSplitRoomParentMove}
                    onMove={moveSplitRoomParentFromStage}
                    onMoveEnd={endSplitRoomParentMove}
                  />
                );
              })}
              {roomItems.map((item) => (
                <RoomShape
                  key={item.hitTargetKey}
                  viewModel={buildRoomShapeViewModel(item, {
                    mode: editorMode,
                    assignment: assignmentOverlay.roomsById[item.objectId] ?? null
                  })}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                  onMoveStart={startRoomMove}
                  onMove={moveRoom}
                  onMoveEnd={endRoomMove}
                />
              ))}
              <AssignmentOverlay
                layout={manualAssignmentOverlayLayout}
                assignmentTargets={manualAssignmentTargets}
                staffMembers={manualStaffFixture}
                assignmentSet={manualAssignmentSet}
                pixelsPerFoot={stageState.viewport.pixelsPerFoot * stageState.viewport.zoom}
              />
            </g>
            <g className="layout-editor-stage__doors">
              {entryExitItems.map((item) => (
                <EntryExitShape
                  key={item.hitTargetKey}
                  item={item}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                />
              ))}
              {doorItems.map((item) => (
                <DoorShape
                  key={item.hitTargetKey}
                  viewModel={buildDoorShapeViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                />
              ))}
              {[...doorItems, ...supportAccessItems].map((item) => (
                <DoorDestinationLabel
                  key={`${item.hitTargetKey}:destination`}
                  viewModel={buildDoorDestinationViewModel({
                    item,
                    destination: stageState.editableLayout?.doorDestinations?.find(
                      (destination) => destination.doorId === item.objectId
                    ) ?? null
                  })}
                  visible={
                    editorMode === "presentation" ||
                    stageState.selectedObjectType === "door" ||
                    stageState.selectedObjectType === "support_access" ||
                    stageState.selectedObjectType === "entry_exit"
                  }
                />
              ))}
              {supportAccessItems.map((item) => (
                <SupportAccessPointShape
                  key={item.hitTargetKey}
                  viewModel={buildSupportAccessPointViewModel(item)}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                />
              ))}
            </g>
            <g className="layout-editor-stage__stations">
              {stationItems.map((item) => (
                <StationShape
                  key={item.hitTargetKey}
                  viewModel={buildStationShapeViewModel(item)}
                  presentation={editorMode === "presentation"}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                  onMoveStart={editorMode === "edit" ? startStationMove : undefined}
                  onMove={editorMode === "edit" ? moveStation : undefined}
                  onMoveEnd={editorMode === "edit" ? endStationMove : undefined}
                />
              ))}
            </g>
            <g className="layout-editor-stage__labels">
              {grid.verticalLines
                .filter((line) => line.isMajor)
                .map((line) => (
                  <text key={`${line.id}-label`} x={line.x1Pixels + 3} y="14">
                    {line.label}
                  </text>
                ))}
              {grid.horizontalLines
                .filter((line) => line.isMajor && line.valueFeet > 0)
                .map((line) => (
                  <text key={`${line.id}-label`} x="4" y={line.y1Pixels - 4}>
                    {line.label}
                  </text>
                ))}
            </g>
            {editorMode === "edit" && roomResizeHandlesViewModel != null ? (
              <RoomResizeHandles
                viewModel={roomResizeHandlesViewModel}
                onResizeStart={startRoomResize}
                onResize={resizeRoom}
                onResizeEnd={endRoomResize}
              />
            ) : null}
            {editorMode === "edit" && stationResizeHandlesViewModel != null ? (
              <StationResizeHandles
                viewModel={stationResizeHandlesViewModel}
                onResizeStart={startStationResize}
                onResize={resizeStation}
                onResizeEnd={endStationResize}
              />
            ) : null}
            {editorMode === "edit" ? (
              <DoorWallGuideOverlay viewModel={doorWallGuideViewModel} />
            ) : null}
            {objectPlacementPreviewViewModel == null ? null : (
              <ObjectPlacementPreview
                viewModel={objectPlacementPreviewViewModel}
                viewport={stageState.viewport}
              />
            )}
            {canvasObjectPopoverViewModel == null || canvasObjectPopoverViewModel.placement !== "canvas" ? null : (
              <CanvasObjectPopover
                viewModel={canvasObjectPopoverViewModel}
                onClose={() => setCanvasPopoverOpen(false)}
              >
                {canvasObjectPopoverViewModel.objectType === "room" ? (
                  <RoomQuickEditPopover
                    viewModel={roomQuickEditViewModel}
                    onRoomTypeChange={(roomType) => {
                      if (roomQuickEditViewModel.roomId != null) {
                        dispatchDoorStageAction({
                          type: "editSelectedRoomType",
                          roomId: roomQuickEditViewModel.roomId,
                          roomType: editableRoomTypeToAuthoringRoomType(roomType)
                        });
                      }
                    }}
                    onRoomIdentityChange={({ roomNumber, label }) => {
                      if (roomQuickEditViewModel.roomId != null) {
                        dispatchDoorStageAction({
                          type: "editSelectedRoomLabel",
                          roomId: roomQuickEditViewModel.roomId,
                          roomNumber,
                          label
                        });
                      }
                    }}
                    onWidthStep={(deltaFeet) => {
                      if (roomQuickEditViewModel.widthFeet != null) {
                        dispatchDoorStageAction({
                          type: "editSelectedRoomDimensions",
                          dimensions: { widthFeet: roomQuickEditViewModel.widthFeet + deltaFeet }
                        });
                      }
                    }}
                    onHeightStep={(deltaFeet) => {
                      if (roomQuickEditViewModel.heightFeet != null) {
                        dispatchDoorStageAction({
                          type: "editSelectedRoomDimensions",
                          dimensions: { heightFeet: roomQuickEditViewModel.heightFeet + deltaFeet }
                        });
                      }
                    }}
                    onAssignNurse={() => setEditorMode("assignment")}
                    onAddDoor={addDoorToSelectedRoom}
                    onPreviewSplitRoom={() => setSplitRoomPreviewOpen(true)}
                    onCreateSplitRoom={convertSelectedRoomToSplitRoom}
                    onShowSplitRoomHelp={() => setSplitRoomPreviewOpen(true)}
                    onRemoveAttachedDoors={() => dispatchStage({ type: "removeSelectedRoomDoors" })}
                    attachedDoorCount={selectedRoomAttachedDoorCount}
                    onDuplicateRoom={() => dispatchStage({ type: "duplicateSelectedObject" })}
                    onDeleteRoom={() => dispatchStage({ type: "deleteSelectedRoom" })}
                  />
                ) : canvasObjectPopoverViewModel.objectType === "door" ? (
                  <DoorQuickEditPopover
                    viewModel={doorQuickEditViewModel}
                    onWallChange={(wall) => {
                      const next = computeDoorWallMove(wall);
                      if (next != null && doorQuickEditViewModel.doorId != null) {
                        dispatchDoorStageAction({
                          type: "moveDoor",
                          doorId: doorQuickEditViewModel.doorId,
                          wall: next.wall,
                          offsetFeet: next.offsetFeet
                        });
                      }
                    }}
                    onNudge={(deltaFeet) => {
                      const next = computeDoorNudge(deltaFeet);
                      if (next != null && doorQuickEditViewModel.doorId != null) {
                        dispatchDoorStageAction({
                          type: "moveDoor",
                          doorId: doorQuickEditViewModel.doorId,
                          wall: next.wall,
                          offsetFeet: next.offsetFeet
                        });
                      }
                    }}
                    onCenter={() => {
                      const next = computeDoorCenter();
                      if (next != null && doorQuickEditViewModel.doorId != null) {
                        dispatchDoorStageAction({
                          type: "moveDoor",
                          doorId: doorQuickEditViewModel.doorId,
                          wall: next.wall,
                          offsetFeet: next.offsetFeet
                        });
                      }
                    }}
                    onOpposite={() => {
                      const next = computeDoorOpposite();
                      if (next != null && doorQuickEditViewModel.doorId != null) {
                        dispatchDoorStageAction({
                          type: "moveDoor",
                          doorId: doorQuickEditViewModel.doorId,
                          wall: next.wall,
                          offsetFeet: next.offsetFeet
                        });
                      }
                    }}
                    onAdjacentCandidate={(roomId, wall, offsetFeet) => {
                      if (doorQuickEditViewModel.doorId != null) {
                        dispatchDoorStageAction({
                          type: "assignDoorToRoom",
                          doorId: doorQuickEditViewModel.doorId,
                          roomId,
                          wall,
                          offsetFeet
                        });
                      }
                    }}
                    onWidthDecrease={() => updateSelectedDoorWidth("decrease")}
                    onWidthIncrease={() => updateSelectedDoorWidth("increase")}
                    onWidthPreset={(widthFeet) => updateSelectedDoorWidth(widthFeet)}
                    onDeleteDoor={() => {
                      if (doorQuickEditViewModel.doorId != null) {
                        dispatchDoorStageAction({ type: "deleteDoor", doorId: doorQuickEditViewModel.doorId });
                      }
                    }}
                  />
                ) : canvasObjectPopoverViewModel.objectType === "support_access" ? (
                  <SupportAccessQuickEditPopover
                    viewModel={supportAccessQuickEditViewModel}
                    onWallChange={(wall) => {
                      if (selectedSupportAccessPoint != null) {
                        moveSelectedSupportAccess(wall, selectedSupportAccessPoint.offsetFeet);
                      }
                    }}
                    onNudge={(deltaFeet) => {
                      if (selectedSupportAccessPoint != null) {
                        moveSelectedSupportAccess(
                          selectedSupportAccessPoint.wall,
                          selectedSupportAccessPoint.offsetFeet + deltaFeet
                        );
                      }
                    }}
                    onWidthStep={updateSelectedSupportAccessWidth}
                    onDelete={() => {
                      if (selectedSupportAccessPoint != null) {
                        dispatchDoorStageAction({
                          type: "deleteSupportAccessPoint",
                          accessPointId: selectedSupportAccessPoint.id
                        });
                      }
                    }}
                  />
                ) : canvasObjectPopoverViewModel.objectType === "split_room_parent" || canvasObjectPopoverViewModel.objectType === "bed_position" ? (
                  <SplitRoomInspectorPanel
                    splitRoom={selectedSplitRoom ?? selectedBedSplitRoom}
                    parentRoom={selectedSplitRoomParentRoom ?? findSplitRoomParentRoom(stageState, selectedBedSplitRoom)}
                    selectedBedPositionId={selectedBedPosition?.bedPositionId ?? null}
                    readOnly={stageState.readOnly}
                    advanced={false}
                    onSelectParent={(splitRoomId) => selectStageObject("split_room_parent", splitRoomId)}
                    onSelectBedPosition={(bedPositionId) => selectStageObject("bed_position", bedPositionId)}
                    onDividerOrientationChange={updateSelectedSplitRoomDividerOrientation}
                    onDividerRatioChange={updateSelectedSplitRoomDividerRatio}
                    onDividerRatioReset={resetSelectedSplitRoomDivider}
                    onUnsplit={unsplitSelectedSplitRoom}
                  />
                ) : canvasObjectPopoverViewModel.objectType === "station" ? (
                  <StationQuickEditPopover
                    viewModel={stationQuickEditViewModel}
                    onStationLabelChange={(label) => {
                      if (stationQuickEditViewModel.stationId != null) {
                        dispatchStage({
                          type: "editSelectedStation",
                          stationId: stationQuickEditViewModel.stationId,
                          label
                        });
                      }
                    }}
                    onStationTypeChange={(stationType) => {
                      if (stationQuickEditViewModel.stationId != null) {
                        dispatchStage({
                          type: "editSelectedStation",
                          stationId: stationQuickEditViewModel.stationId,
                          stationType
                        });
                      }
                    }}
                    onPresentationStyle={() => setEditorMode("presentation")}
                    onMoveResize={() => setToolMode("select")}
                  />
                ) : canvasObjectPopoverViewModel.objectType === "hallway" || canvasObjectPopoverViewModel.objectType === "zone" ? (
                  <HallwayZoneQuickEditPopover
                    viewModel={hallwayZoneQuickEditViewModel}
                    onLabelChange={(label) => {
                      if (hallwayZoneQuickEditViewModel.objectId == null) {
                        return;
                      }
                      if (hallwayZoneQuickEditViewModel.status === "hallway") {
                        dispatchStage({
                          type: "editSelectedHallwayLabel",
                          hallwayId: hallwayZoneQuickEditViewModel.objectId,
                          label
                        });
                      }
                      if (hallwayZoneQuickEditViewModel.status === "zone") {
                        dispatchStage({
                          type: "editSelectedZone",
                          zoneId: hallwayZoneQuickEditViewModel.objectId,
                          label
                        });
                      }
                    }}
                    onZoneTypeChange={(zoneType) => {
                      if (hallwayZoneQuickEditViewModel.objectId != null) {
                        dispatchStage({
                          type: "editSelectedZone",
                          zoneId: hallwayZoneQuickEditViewModel.objectId,
                          zoneType
                        });
                      }
                    }}
                    onTogglePresentationVisibility={() => setEditorMode("presentation")}
                    onReverseArrow={reverseSelectedHallwayArrow}
                    onHideArrow={() => setSelectedHallwayArrowVisible(false)}
                    onShowArrow={() => setSelectedHallwayArrowVisible(true)}
                    onAddSupportAccessPoint={addSupportAccessToSelectedZone}
                  />
                ) : null}
              </CanvasObjectPopover>
            )}
          </svg>
        </div>
      </div>
      <EditorDetailsPanel
        selectedObjectType={stageState.selectedObjectType}
        collapsed={detailsPanelCollapsed}
        onToggleCollapsed={toggleDetailsPanelCollapsed}
        advancedDetails={<InspectorAdvancedDetails viewModel={inspectorViewModel} />}
      >
          {canvasObjectPopoverViewModel == null || canvasObjectPopoverViewModel.placement !== "docked" ? null : (
            <section className="layout-editor-stage__docked-popover" data-popup-docked-panel="true">
              <header>
                <strong>{canvasObjectPopoverViewModel.title}</strong>
                <button type="button" onClick={() => setCanvasPopoverOpen(false)}>
                  Close
                </button>
              </header>
              <p>{canvasObjectPopoverViewModel.dockReason ?? "Docked editing mode is active."}</p>
              <p>Use the selected-object inspector below for reconstruction edits while this popup stays docked.</p>
            </section>
          )}
          <LayoutInspectorTabs
            selectedObjectType={stageState.selectedObjectType}
            room={
              stageState.selectedObjectType === "hallway" ? (
                <HallwayInspectorPanel
                  hallway={selectedHallway}
                  viewModel={inspectorViewModel}
                  readOnly={stageState.readOnly}
                  onLabelChange={(label) => {
                    if (selectedHallway != null) {
                      dispatchStage({
                        type: "editSelectedHallwayLabel",
                        hallwayId: selectedHallway.id,
                        label
                      });
                    }
                  }}
                  onDimensionChange={(dimensions) => {
                    if (selectedHallway != null) {
                      dispatchStage({
                        type: "editSelectedHallwayDimensions",
                        hallwayId: selectedHallway.id,
                        dimensions
                      });
                    }
                  }}
                />
              ) : stageState.selectedObjectType === "split_room_parent" || stageState.selectedObjectType === "bed_position" ? (
                <SplitRoomInspectorPanel
                  splitRoom={selectedSplitRoom ?? selectedBedSplitRoom}
                  parentRoom={selectedSplitRoomParentRoom ?? findSplitRoomParentRoom(stageState, selectedBedSplitRoom)}
                  selectedBedPositionId={selectedBedPosition?.bedPositionId ?? null}
                  readOnly={stageState.readOnly}
                  advanced={false}
                  onSelectParent={(splitRoomId) => dispatchStage({
                    type: "selectObject",
                    objectType: "split_room_parent",
                    objectId: splitRoomId
                  })}
                  onSelectBedPosition={(bedPositionId) => dispatchStage({
                    type: "selectObject",
                    objectType: "bed_position",
                    objectId: bedPositionId
                  })}
                  onDividerOrientationChange={updateSelectedSplitRoomDividerOrientation}
                  onDividerRatioChange={updateSelectedSplitRoomDividerRatio}
                  onDividerRatioReset={resetSelectedSplitRoomDivider}
                  onUnsplit={unsplitSelectedSplitRoom}
                />
              ) : (
                <>
                  <LayoutInspectorPanel
                    viewModel={inspectorViewModel}
                    roomDimensionDraft={roomDimensionDraft}
                    onChangeRoomDimensionDraft={(field, value) =>
                      setRoomDimensionDraft((draft) =>
                        updateRoomInspectorDimensionDraft(draft, field, value)
                      )
                    }
                    onCommitRoomDimensionDraft={(field) => {
                      const result = commitRoomInspectorDimensionDraftField(roomDimensionDraft, field);
                      setRoomDimensionDraft(result.draft);
                      if (result.status === "valid") {
                        if (selectedRoom != null) {
                          dispatchStage({ type: "editSelectedRoomDimensions", dimensions: result.changes });
                        }
                        if (selectedStation != null) {
                          dispatchStage({
                            type: "editSelectedStationDimensions",
                            stationId: selectedStation.id,
                            dimensions: result.changes
                          });
                        }
                      }
                    }}
                    onCancelRoomDimensionDraft={(field) =>
                      setRoomDimensionDraft((draft) =>
                        cancelRoomInspectorDimensionDraftField(draft, selectedInspectorRect, field)
                      )
                    }
                  />
                  <LockedGeometryInspectorPanel viewModel={inspectorViewModel} />
                  <RoomAlignmentControls
                    viewModel={roomAlignmentViewModel}
                    onApply={applyRoomAlignment}
                  />
                  <RoomTypeEditor
                    room={selectedRoom}
                    readOnly={stageState.readOnly}
                    onChangeRoomType={(roomId, roomType) =>
                      dispatchStage({ type: "editSelectedRoomType", roomId, roomType })
                    }
                  />
                </>
              )
            }
            door={
              stageState.selectedObjectType === "entry_exit" ? (
                <EntryExitInspectorPanel
                  entryExit={selectedEntryExit}
                  hallways={stageState.editableLayout?.hallways ?? []}
                  zones={stageState.editableLayout?.zones ?? []}
                  readOnly={stageState.readOnly}
                  onDestinationChange={(entryExitId, connectsTo) =>
                    dispatchStage({
                      type: "editEntryExitDestination",
                      entryExitId,
                      connectsTo
                    })
                  }
                  onDestinationLabelChange={(entryExitId, displayLabel) =>
                    dispatchStage({
                      type: "editEntryExitDestinationLabel",
                      entryExitId,
                      displayLabel
                    })
                  }
                />
              ) : (
                <>
                  <DoorDestinationInspectorPanel
                    door={selectedDoorDestinationAccessPoint}
                    destination={
                      selectedDoorDestinationAccessPoint == null
                        ? null
                        : stageState.editableLayout?.doorDestinations?.find(
                            (destination) => destination.doorId === selectedDoorDestinationAccessPoint.id
                          ) ?? null
                    }
                    rooms={stageState.editableLayout?.rooms ?? []}
                    hallways={stageState.editableLayout?.hallways ?? []}
                    zones={stageState.editableLayout?.zones ?? []}
                    entryExits={stageState.editableLayout?.entryExits ?? []}
                    readOnly={stageState.readOnly}
                    onChange={(destination) =>
                      dispatchStage({ type: "editDoorDestination", destination })
                    }
                  />
                  <DoorEditor
                    door={selectedDoor}
                    rooms={stageState.editableLayout?.rooms ?? []}
                    hallways={stageState.editableLayout?.hallways ?? []}
                    readOnly={stageState.readOnly}
                    onMoveDoor={(doorId, wall, offsetFeet) =>
                      dispatchDoorStageAction({ type: "moveDoor", doorId, wall, offsetFeet })
                    }
                    onUpdateDoorWidth={(doorId, wall, offsetFeet, widthFeet) =>
                      dispatchDoorStageAction({ type: "updateDoorWidth", doorId, wall, offsetFeet, widthFeet })
                    }
                    onDeleteDoor={(doorId) => dispatchDoorStageAction({ type: "deleteDoor", doorId })}
                    onAssignDoorToRoom={(doorId, roomId, wall, offsetFeet) =>
                      dispatchDoorStageAction({ type: "assignDoorToRoom", doorId, roomId, wall, offsetFeet })
                    }
                  />
                </>
              )
            }
            assignment={
              <PresentationLegend assignmentItems={assignmentOverlay.legend} />
            }
            validation={
              <>
                <HallwayArrowEditor
                  viewModel={hallwayArrowEditorViewModel}
                  onReverse={reverseSelectedHallwayArrow}
                  onHide={() => setSelectedHallwayArrowVisible(false)}
                  onShow={() => setSelectedHallwayArrowVisible(true)}
                />
                <SupportMarkerEditor
                  viewModel={supportMarkerEditorViewModel}
                  onLabelChange={(label) => {
                    if (selectedZone != null && validateSupportMarkerLabel(label) === "Operational label accepted.") {
                      dispatchStage({
                        type: "editSelectedZone",
                        zoneId: selectedZone.id,
                        label
                      });
                    }
                  }}
                  onTogglePresentationVisibility={() => setEditorMode("presentation")}
                />
                <PathSyncStatusPanel audit={pathSyncAudit} />
                <LayoutValidationPanel viewModel={validationPanelViewModel} maxVisibleWarnings={2} />
                <LayoutDeltaPreviewPanel viewModel={deltaPreviewViewModel} />
              </>
            }
          />
      </EditorDetailsPanel>
      <EditorValidationSummaryRow viewModel={validationPanelViewModel} />
      <ValidationDrawer viewModel={validationDrawerViewModel} />
    </section>
    </LayoutEditorWorkspace>
  );
}

function buildAddDoorBlockedWarning(input: {
  reason: string;
  roomId: string | null;
}): DoorAuthoringWarning {
  return {
    code: "add_door_preflight_blocked",
    severity: "blocking",
    actionType: "addDoor",
    message: `Add door blocked: ${input.reason}`,
    roomId: input.roomId ?? undefined
  };
}

function doorRecoverySnapshotContextFromAction(action: LayoutEditorAction): {
  actionType: string;
  doorId?: string;
  roomId?: string;
} | null {
  switch (action.type) {
    case "addDoorToRoom":
      return { actionType: "addDoor", doorId: action.doorId, roomId: action.roomId };
    case "moveDoor":
      return { actionType: "moveDoor", doorId: action.doorId };
    case "updateDoorWidth":
      return { actionType: "updateDoorWidth", doorId: action.doorId };
    case "assignDoorToRoom":
      return { actionType: "assignDoor", doorId: action.doorId, roomId: action.roomId };
    case "deleteDoor":
      return { actionType: "deleteDoor", doorId: action.doorId };
    case "addSupportAccessPoint":
      return { actionType: "supportAccessAdd", doorId: action.accessPointId, roomId: action.zoneId };
    case "moveSupportAccessPoint":
      return { actionType: "supportAccessMove", doorId: action.accessPointId };
    case "updateSupportAccessPointWidth":
      return { actionType: "supportAccessWidth", doorId: action.accessPointId };
    case "deleteSupportAccessPoint":
      return { actionType: "supportAccessDelete", doorId: action.accessPointId };
    default:
      return null;
  }
}

function findSelectedRoom(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "room" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.rooms.find((room) => room.id === state.selectedObjectId) ?? null;
}

function findSelectedStation(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "station" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.stations.find((station) => station.id === state.selectedObjectId) ?? null;
}

function findSelectedHallway(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "hallway" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.hallways.find((hallway) => hallway.id === state.selectedObjectId) ?? null;
}

function findSelectedZone(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "zone" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.zones.find((zone) => zone.id === state.selectedObjectId) ?? null;
}

function findSelectedSupportAccessPoint(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "support_access" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.supportAccessPoints?.find((accessPoint) => accessPoint.id === state.selectedObjectId) ?? null;
}

function findSelectedSplitRoom(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "split_room_parent" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.splitRooms?.find((splitRoom) => splitRoom.splitRoomId === state.selectedObjectId) ?? null;
}

function findSelectedBedPosition(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "bed_position" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.splitRooms
    ?.flatMap((splitRoom) => splitRoom.bedPositions)
    .find((bedPosition) => bedPosition.bedPositionId === state.selectedObjectId) ?? null;
}

function findSplitRoomForBedPosition(
  state: { editableLayout: typeof baseInitialStageState.editableLayout },
  bedPositionId: string | null
) {
  if (state.editableLayout == null || bedPositionId == null) {
    return null;
  }
  return state.editableLayout.splitRooms?.find((splitRoom) =>
    splitRoom.bedPositions.some((bedPosition) => bedPosition.bedPositionId === bedPositionId)
  ) ?? null;
}

function findSplitRoomParentRoom(
  state: { editableLayout: typeof baseInitialStageState.editableLayout },
  splitRoom: SplitRoomContract | null
) {
  if (state.editableLayout == null || splitRoom == null) {
    return null;
  }
  return state.editableLayout.rooms.find((room) => room.id === splitRoom.parentRoomId) ?? null;
}

function createInitialStageState() {
  return baseInitialStageState;
}

function buildStagePathSyncAudit(state: LayoutEditorState): PathSyncAuditResult | null {
  const draft = buildStageAuthoringDraft(state);
  if (draft == null) {
    return null;
  }
  try {
    const exported = editableLayoutToPlanContract({
      sourcePlan: draft.sourcePlan,
      editableLayout: draft.editableLayout
    });
    return auditPathSyncStatus({
      authoringDraft: draft,
      plan: exported.plan
    });
  } catch {
    return null;
  }
}

function buildStageAuthoringDraft(state: LayoutEditorState): AuthoringDraftContract | null {
  if (state.sourcePlan == null || state.editableLayout == null) {
    return null;
  }
  return {
    draftId: `editor-draft-${state.loadedFloorplan?.recordId ?? state.sourcePlan.planId}`,
    sourceDefaultPlanId: state.loadedFloorplan?.parentDefaultPlanId ?? state.sourcePlan.planId,
    planId: state.sourcePlan.planId,
    displayName: state.loadedFloorplan?.name ?? state.sourcePlan.name,
    versionLabel: "editor-preview",
    editableLayout: state.editableLayout,
    sourcePlan: state.sourcePlan,
    authoringStatus: state.isDirty ? "draft_has_warnings" : "draft_valid",
    pathSyncStatus: state.isDirty ? "stale_warning" : "fresh",
    authoringWarnings: state.isDirty ? ["PATH_SYNC_STALE"] : [],
    sourceProvenance: {
      sourceReferenceId: state.sourcePlan.planId,
      sourceKind: state.loadedFloorplan?.sourceKind === "default-json" ? "default_fixture" : "manual_authoring",
      sourceVisibility: "runtime-safe-json",
      publicExposureAllowed: false,
      runtimeServedByWeb: false,
      runtimeServedByApi: false,
      notes: ["Safe provenance only; no private source payload is stored."]
    },
    createdAt: "2026-05-25T00:00:00Z",
    updatedAt: "2026-05-25T00:00:00Z",
    syntheticDataOnly: true
  };
}

function getBrowserLocalDraftStorage(): LayoutLocalDraftStorage | null {
  if (typeof window === "undefined" || window.localStorage == null) {
    return null;
  }
  return window.localStorage;
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

function sourceKindDisplayLabel(
  sourceKind: LayoutEditorFloorplanInput["sourceKind"] | null
): string {
  if (sourceKind === "saved-json") {
    return "Saved working copy";
  }
  if (sourceKind === "review-candidate-json") {
    return "Review candidate";
  }
  if (sourceKind === "default-json") {
    return "Canonical default";
  }
  return "No active source";
}

function localRecoveryDraftStatusLabel(state: DraftRecoveryState): string {
  if (state.status === "available") {
    return `Available local recovery draft captured ${formatSaveTime(state.updatedAt)}; not a named save`;
  }
  if (state.status === "restored") {
    return `Restored local recovery draft from ${formatSaveTime(state.updatedAt)}; named copy not saved by restore`;
  }
  if (state.status === "discarded") {
    return "Local recovery draft discarded";
  }
  return "No local recovery draft for this copy";
}

function pixelsDeltaToFeet(
  deltaPixels: number,
  viewport: { pixelsPerFoot: number; zoom: number }
): number {
  return deltaPixels / (viewport.pixelsPerFoot * viewport.zoom);
}

function stagePointerToFeet(
  event: PointerEvent<SVGSVGElement>,
  viewport: { pixelsPerFoot: number; zoom: number; panXFeet: number; panYFeet: number }
) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const xPixels = event.clientX - bounds.left;
  const yPixels = event.clientY - bounds.top;
  return {
    xFeet: xPixels / (viewport.pixelsPerFoot * viewport.zoom) + viewport.panXFeet,
    yFeet: yPixels / (viewport.pixelsPerFoot * viewport.zoom) + viewport.panYFeet
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatSaveTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
