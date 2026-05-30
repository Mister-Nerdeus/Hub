import { useEffect, useReducer, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  auditPathSyncStatus,
  applyDoorWidthPreset,
  editableRoomTypeToAuthoringRoomType,
  centerDoorOnWall,
  decreaseDoorWidth,
  generateDoorPathNodes,
  increaseDoorWidth,
  isProviderPharmacySupportZone,
  moveToOppositeWall,
  moveToWall,
  nudgeDoor,
  validateSimulationReadyExport,
  type AuthoringDraftContract,
  type AuthoringRoomType,
  type DoorAuthoringWarning,
  type DoorPathNodeGenerationResult,
  type EditableSplitBayDividerStyle,
  type EditableDoorWall,
  type PathSyncAuditResult,
  type SimulationReadyExportResult
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
import { SplitBayShape } from "./SplitBayShape";
import { buildSplitBayShapeViewModel } from "./splitBayShapeViewModel";
import { SplitBayQuickEditPopover } from "./SplitBayQuickEditPopover";
import { buildSplitBayQuickEdit } from "./splitBayQuickEditViewModel";
import { layoutEditorReducer, panViewportAction } from "./layoutEditorReducer";
import { LayoutToolPalette, type LayoutToolMode } from "./LayoutToolPalette";
import { buildAddRoomAction } from "./addRoomTool";
import { buildAddDoorAction } from "./addDoorTool";
import { buildAddSplitBayAction } from "./addSplitBayTool";
import { RoomTypeEditor } from "./RoomTypeEditor";
import { DoorEditor } from "./DoorEditor";
import { DoorPathNodeSyncControls } from "./DoorPathNodeSyncControls";
import { AutoHallwayControls } from "./AutoHallwayControls";
import { PodBorderShape } from "./PodBorderShape";
import { buildPodBorderViewModel } from "./podBorderViewModel";
import { LayoutDeltaPreviewPanel } from "./LayoutDeltaPreviewPanel";
import { buildLayoutDeltaPreviewViewModel } from "./layoutDeltaPreviewViewModel";
import { HallwayShape } from "./HallwayShape";
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
import { createSyntheticLayoutAssignmentOverlay } from "./layoutAssignmentOverlayViewModel";
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
import { HallwayArrowEditor } from "./HallwayArrowEditor";
import { buildHallwayArrowEditorViewModel } from "./hallwayArrowEditorViewModel";
import { SupportMarkerEditor } from "./SupportMarkerEditor";
import { buildSupportMarkerEditorViewModel, validateSupportMarkerLabel } from "./supportMarkerEditorViewModel";
import { LayoutInspectorTabs } from "./LayoutInspectorTabs";
import { ZoneShape } from "./ZoneShape";
import { EditorCommandBar } from "./EditorCommandBar";
import { EditorSaveStatusPanel } from "./EditorSaveStatusPanel";
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
import { EditorPopupModeControl, type EditorPopupMode } from "./EditorPopupModeControl";
import { useEditorWorkspaceMeasurements } from "./useEditorWorkspaceMeasurements";
import { RoomQuickEditPopover } from "./RoomQuickEditPopover";
import { buildRoomQuickEdit } from "./roomQuickEditViewModel";
import { DoorQuickEditPopover } from "./DoorQuickEditPopover";
import { buildDoorQuickEdit } from "./doorQuickEditViewModel";
import { StationQuickEditPopover } from "./StationQuickEditPopover";
import { buildStationQuickEdit } from "./stationQuickEditViewModel";
import { HallwayZoneQuickEditPopover } from "./HallwayZoneQuickEditPopover";
import { buildHallwayZoneQuickEdit } from "./hallwayZoneQuickEditViewModel";
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
import "./LayoutEditorStage.css";

const STAGE_PIXELS_PER_FOOT = DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT;
const STAGE_WIDTH_PIXELS = DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS.widthPixels;
const STAGE_HEIGHT_PIXELS = DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS.heightPixels;
const STAGE_VIEW_BOX = `0 0 ${STAGE_WIDTH_PIXELS} ${STAGE_HEIGHT_PIXELS}`;

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
  onCreateWorkingCopy?: () => void;
  onSaveWorkingCopy?: (draft: AuthoringDraftContract) => SaveWorkingCopyResult;
  onSaveAsNewCopy?: (draft: AuthoringDraftContract) => SaveWorkingCopyResult;
};

export type SaveWorkingCopyResult =
  | { status: "saved"; recordId: string; displayName: string; savedAt: string }
  | { status: "created_copy"; recordId: string; displayName: string; savedAt: string }
  | { status: "failed"; message: string };

export function LayoutEditorStage({
  activeFloorplan = null,
  onCreateWorkingCopy,
  onSaveWorkingCopy,
  onSaveAsNewCopy
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
  const [saveStatus, setSaveStatus] = useState("Named working copy not saved this session");
  const [lastNamedCopySaveLabel, setLastNamedCopySaveLabel] = useState("Not saved this session");
  const [reloadProofLabel, setReloadProofLabel] = useState("Not verified this session");
  const [draftRecoveryState, setDraftRecoveryState] = useState<DraftRecoveryState>({ status: "none" });
  const [availableRecoveryDraft, setAvailableRecoveryDraft] = useState<ReturnType<typeof loadLayoutLocalDraft>["draft"]>(null);
  const [toolMode, setToolMode] = useState<LayoutToolMode>("select");
  const [editorMode, setEditorMode] = useState<LayoutEditorMode>(DEFAULT_LAYOUT_EDITOR_MODE);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [canvasPanActive, setCanvasPanActive] = useState(false);
  const [canvasPopoverOpen, setCanvasPopoverOpen] = useState(false);
  const [popupMode, setPopupMode] = useState<EditorPopupMode>("auto");
  const [addObjectMenuOpen, setAddObjectMenuOpen] = useState(false);
  const [pendingAddObjectId, setPendingAddObjectId] = useState<AddObjectMenuItemId | null>(null);
  const [pendingAddObjectLabel, setPendingAddObjectLabel] = useState<string | null>(null);
  const [hallwayArrowState, setHallwayArrowState] = useState<Record<string, { visible?: boolean; reversed?: boolean }>>({});
  const [placementPreviewPoint, setPlacementPreviewPoint] = useState<{
    xFeet: number;
    yFeet: number;
  } | null>(null);
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
  const selectedSplitBay = findSelectedSplitBay(stageState);
  useEffect(() => {
    if (activeFloorplan == null) {
      return;
    }
    dispatchStage({ type: "loadActiveFloorplan", floorplan: activeFloorplan });
    if (lastAppliedSaveRecordIdRef.current === activeFloorplan.recordId) {
      lastAppliedSaveRecordIdRef.current = null;
    } else {
      setSaveStatus("Named working copy not saved this session");
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
      dispatchStage({ type: "deleteDoor", doorId: stageState.selectedObjectId });
      setCanvasPopoverOpen(false);
    };
    document.addEventListener("keydown", deleteSelectedDoor);
    return () => document.removeEventListener("keydown", deleteSelectedDoor);
  }, [editorMode, stageState.readOnly, stageState.selectedObjectType, stageState.selectedObjectId]);
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
  const validationPanelViewModel = buildLayoutValidationPanelViewModel({
    warnings: stageState.validationWarnings
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
  const zoneItems = renderItems.filter((item) => item.objectType === "zone");
  const splitBayItems = renderItems.filter((item) => item.objectType === "split_bay");
  const splitBayBedRoomIds = new Set(
    stageState.editableLayout?.splitBays?.flatMap((splitBay) => [...splitBay.bedPositionRoomIds]) ?? []
  );
  const roomItems = renderItems.filter(
    (item) => item.objectType === "room" && !splitBayBedRoomIds.has(item.objectId)
  );
  const doorItems = renderItems.filter((item) => item.objectType === "door");
  const supportAccessItems = renderItems.filter((item) => item.objectType === "support_access");
  const stationItems = renderItems.filter((item) => item.objectType === "station");
  const hallwayArrows = buildHallwayArrowViewModels(renderItems, hallwayArrowState);
  const selectedDoor =
    stageState.selectedObjectType === "door" && stageState.selectedObjectId != null
      ? stageState.editableLayout?.doors.find((door) => door.id === stageState.selectedObjectId) ?? null
      : null;
  const supportAccessQuickEditViewModel = buildSupportAccessQuickEdit({
    accessPoint: selectedSupportAccessPoint,
    readOnly: stageState.readOnly
  });
  const splitBayQuickEditViewModel = buildSplitBayQuickEdit({
    splitBay: selectedSplitBay,
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
  const assignmentOverlay = createSyntheticLayoutAssignmentOverlay(stageState.editableLayout);
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
    const namedCopySaveLabel = `${time} / record ${result.recordId}`;
    lastAppliedSaveRecordIdRef.current = result.recordId;
    setSaveStatus(
      result.status === "saved"
        ? `Saved working copy ${result.recordId} at ${time}`
        : `Created new copy ${result.recordId} at ${time}`
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
    if (placementAction === "place-split-bay") {
      const pointFeet = stagePointerToFeet(event, stageState.viewport);
      const defaultPlacementSize = getDefaultPlacementSizeForObject("split_bay");
      dispatchStage(
        buildAddSplitBayAction({
          sequence: authoringSequence,
          xFeet: pointFeet.xFeet,
          yFeet: pointFeet.yFeet,
          widthFeet: defaultPlacementSize.widthFeet,
          heightFeet: defaultPlacementSize.heightFeet
        })
      );
      setAuthoringSequence((value) => value + 1);
      setPendingAddObjectId(null);
      setPendingAddObjectLabel(null);
      setPlacementPreviewPoint(null);
      setToolMode("select");
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
    dispatchStage(result.action);
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
    dispatchStage({
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
  const convertSelectedRoomToSplitBay = () => {
    if (
      stageState.readOnly ||
      stageState.selectedObjectType !== "room" ||
      stageState.selectedObjectId == null
    ) {
      return;
    }
    dispatchStage({
      type: "convertSelectedRoomPairToSplitBay",
      roomId: stageState.selectedObjectId,
      splitBayId: `authored-split-bay-${String(authoringSequence).padStart(3, "0")}`
    });
    setAuthoringSequence((value) => value + 1);
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
    if (itemId === "split_bay") {
      setToolMode("select");
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
      dispatchStage({
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
    dispatchStage({
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
    dispatchStage({
      type: "updateSupportAccessPointWidth",
      accessPointId: selectedSupportAccessPoint.id,
      wall: selectedSupportAccessPoint.wall,
      offsetFeet: selectedSupportAccessPoint.offsetFeet,
      widthFeet: selectedSupportAccessPoint.widthFeet + deltaFeet
    });
  };
  const updateSelectedSplitBayDivider = (dividerStyle: EditableSplitBayDividerStyle) => {
    if (selectedSplitBay == null) {
      return;
    }
    dispatchStage({
      type: "editSplitBayDivider",
      splitBayId: selectedSplitBay.splitBayId,
      dividerStyle
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
    if (stageState.selectedObjectType !== "room" || stageState.selectedObjectId !== roomId) {
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

    dispatchStage({
      type: "resizeRoom",
      roomId,
      handle,
      deltaXFeet,
      deltaYFeet
    });
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
    <section
      id="layout-editor-stage-proof"
      className="layout-editor-stage"
      aria-labelledby="layout-editor-stage-title"
    >
      <header className="layout-editor-stage__header">
        <div>
          <p className="eyebrow">Layout editor</p>
          <h2 id="layout-editor-stage-title">JSON floorplan editor</h2>
        </div>
        <dl className="layout-editor-stage__meta" aria-label="Layout editor stage metadata">
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
      </header>

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
        inspectorCollapsed={inspectorCollapsed}
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
        onExportJson={exportActiveFloorplanJson}
        onImportJson={importEditableFloorplanJson}
        onValidate={validateSimulationReadyExportFromStage}
        onResetView={() => dispatchStage({ type: "resetViewport" })}
        onAddObject={() => setAddObjectMenuOpen((value) => !value)}
        onToggleInspector={() => setInspectorCollapsed((value) => !value)}
      />

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

      <details className="layout-editor-stage__json-drawer">
        <summary>Floorplan JSON</summary>
        <textarea
          aria-label="Floorplan JSON"
          value={floorplanJsonText}
          onChange={(event) => setFloorplanJsonText(event.target.value)}
          spellCheck={false}
        />
      </details>

      <div className="layout-editor-stage__tool-strip">
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

      <div
        className={viewportLayoutViewModel.workspaceClassName}
        style={workspaceMeasurements.workspaceStyle}
        data-editor-canvas-height={workspaceMeasurements.canvasHeight}
        {...viewportLayoutViewModel.dataAttributes}
      >
        <div className="layout-editor-stage__shell" data-proof-only="true" ref={workspaceMeasurements.shellRef}>
          <p className="layout-editor-stage__pan-helper" data-canvas-pan-helper="true">
            Drag the hallway/background to pan the map.
          </p>
          <svg
            className={`layout-editor-stage__svg layout-editor-stage--${editorMode}`}
            viewBox={STAGE_VIEW_BOX}
            role="img"
            aria-label="Feet-based SVG grid stage"
            data-render-item-count={renderItems.length}
            data-room-render-count={roomItems.length}
            data-split-bay-render-count={splitBayItems.length}
            data-support-access-render-count={supportAccessItems.length}
            data-station-render-count={stationItems.length}
            data-provider-pharmacy-zone-render-count={providerPharmacyZoneItems.length}
            data-floorplan-source-kind={stageState.loadedFloorplan?.sourceKind ?? "proof-fixture"}
            data-validation-warning-count={stageState.validationWarnings.length}
            data-read-only={stageState.readOnly ? "true" : "false"}
            data-editor-mode={editorMode}
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
            <rect
              className="layout-editor-stage__workspace-boundary"
              x={grid.workspaceBoundary.xPixels}
              y={grid.workspaceBoundary.yPixels}
              width={grid.workspaceBoundary.widthPixels}
              height={grid.workspaceBoundary.heightPixels}
              rx="0"
            />
            <g className="layout-editor-stage__background-objects">
              {podBorderViewModel == null ? null : (
                <PodBorderShape viewModel={podBorderViewModel} />
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
                <ZoneShape
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
            <g className="layout-editor-stage__rooms">
              {splitBayItems.map((item) => (
                <SplitBayShape
                  key={item.hitTargetKey}
                  viewModel={buildSplitBayShapeViewModel({
                    item,
                    rooms: stageState.editableLayout?.rooms ?? []
                  })}
                  isSelected={isLayoutObjectSelected({
                    objectType: item.objectType,
                    objectId: item.objectId,
                    selectedObjectType: stageState.selectedObjectType,
                    selectedObjectId: stageState.selectedObjectId
                  })}
                  onSelect={selectStageObject}
                />
              ))}
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
            </g>
            <g className="layout-editor-stage__doors">
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
                        dispatchStage({
                          type: "editSelectedRoomType",
                          roomId: roomQuickEditViewModel.roomId,
                          roomType: editableRoomTypeToAuthoringRoomType(roomType)
                        });
                      }
                    }}
                    onRoomIdentityChange={({ roomNumber, label }) => {
                      if (roomQuickEditViewModel.roomId != null) {
                        dispatchStage({
                          type: "editSelectedRoomLabel",
                          roomId: roomQuickEditViewModel.roomId,
                          roomNumber,
                          label
                        });
                      }
                    }}
                    onWidthStep={(deltaFeet) => {
                      if (roomQuickEditViewModel.widthFeet != null) {
                        dispatchStage({
                          type: "editSelectedRoomDimensions",
                          dimensions: { widthFeet: roomQuickEditViewModel.widthFeet + deltaFeet }
                        });
                      }
                    }}
                    onHeightStep={(deltaFeet) => {
                      if (roomQuickEditViewModel.heightFeet != null) {
                        dispatchStage({
                          type: "editSelectedRoomDimensions",
                          dimensions: { heightFeet: roomQuickEditViewModel.heightFeet + deltaFeet }
                        });
                      }
                    }}
                    onAssignNurse={() => setEditorMode("assignment")}
                    onAddDoor={addDoorToSelectedRoom}
                    onConvertToSplitBay={convertSelectedRoomToSplitBay}
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
                        dispatchStage({
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
                        dispatchStage({
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
                        dispatchStage({
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
                        dispatchStage({
                          type: "moveDoor",
                          doorId: doorQuickEditViewModel.doorId,
                          wall: next.wall,
                          offsetFeet: next.offsetFeet
                        });
                      }
                    }}
                    onAdjacentCandidate={(roomId, wall, offsetFeet) => {
                      if (doorQuickEditViewModel.doorId != null) {
                        dispatchStage({
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
                        dispatchStage({ type: "deleteDoor", doorId: doorQuickEditViewModel.doorId });
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
                        dispatchStage({
                          type: "deleteSupportAccessPoint",
                          accessPointId: selectedSupportAccessPoint.id
                        });
                      }
                    }}
                  />
                ) : canvasObjectPopoverViewModel.objectType === "split_bay" ? (
                  <SplitBayQuickEditPopover
                    viewModel={splitBayQuickEditViewModel}
                    onDividerStyleChange={updateSelectedSplitBayDivider}
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
        {inspectorCollapsed ? null : (
        <div className="layout-editor-stage__side-panels" ref={workspaceMeasurements.sidePanelRef}>
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
            }
            door={
              <DoorEditor
                door={selectedDoor}
                rooms={stageState.editableLayout?.rooms ?? []}
                hallways={stageState.editableLayout?.hallways ?? []}
                readOnly={stageState.readOnly}
                onMoveDoor={(doorId, wall, offsetFeet) =>
                  dispatchStage({ type: "moveDoor", doorId, wall, offsetFeet })
                }
                onUpdateDoorWidth={(doorId, wall, offsetFeet, widthFeet) =>
                  dispatchStage({ type: "updateDoorWidth", doorId, wall, offsetFeet, widthFeet })
                }
                onDeleteDoor={(doorId) => dispatchStage({ type: "deleteDoor", doorId })}
                onAssignDoorToRoom={(doorId, roomId, wall, offsetFeet) =>
                  dispatchStage({ type: "assignDoorToRoom", doorId, roomId, wall, offsetFeet })
                }
              />
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
        </div>
        )}
      </div>
      <ValidationDrawer viewModel={validationDrawerViewModel} />
    </section>
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

function findSelectedSplitBay(state: {
  editableLayout: typeof baseInitialStageState.editableLayout;
  selectedObjectType: string | null;
  selectedObjectId: string | null;
}) {
  if (
    state.editableLayout == null ||
    state.selectedObjectType !== "split_bay" ||
    state.selectedObjectId == null
  ) {
    return null;
  }
  return state.editableLayout.splitBays?.find((splitBay) => splitBay.id === state.selectedObjectId) ?? null;
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
