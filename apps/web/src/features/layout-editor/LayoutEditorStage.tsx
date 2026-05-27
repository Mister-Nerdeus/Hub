import { useEffect, useReducer, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import {
  auditPathSyncStatus,
  assignDoorToAdjacentRoom,
  editableRoomTypeToAuthoringRoomType,
  centerDoorOnWall,
  generateDoorPathNodes,
  moveToOppositeWall,
  moveToWall,
  nudgeDoor,
  validateSimulationReadyExport,
  type AuthoringDraftContract,
  type AuthoringRoomType,
  type DoorPathNodeGenerationResult,
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
import { layoutEditorReducer, panViewportAction } from "./layoutEditorReducer";
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
import { LayoutInspectorTabs } from "./LayoutInspectorTabs";
import { ZoneShape } from "./ZoneShape";
import { EditorCommandBar } from "./EditorCommandBar";
import { buildEditorViewportLayoutViewModel } from "./editorViewportLayoutViewModel";
import { EditorNextStepPanel } from "./EditorNextStepPanel";
import { buildEditorNextStep } from "./editorNextStepViewModel";
import {
  canvasPointerDeltaToPanFeet,
  isCanvasPanBackgroundTarget
} from "./layoutCanvasPan";
import { applyCanvasWheelNavigation } from "./layoutCanvasWheelNavigation";
import { CanvasObjectPopover } from "./CanvasObjectPopover";
import { buildCanvasObjectPopover } from "./canvasObjectPopoverViewModel";
import { RoomQuickEditPopover } from "./RoomQuickEditPopover";
import { buildRoomQuickEdit } from "./roomQuickEditViewModel";
import { DoorQuickEditPopover } from "./DoorQuickEditPopover";
import { buildDoorQuickEdit } from "./doorQuickEditViewModel";
import { StationQuickEditPopover } from "./StationQuickEditPopover";
import { buildStationQuickEdit } from "./stationQuickEditViewModel";
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

type RoomResizeState = {
  roomId: string;
  handle: RoomResizeHandle;
  lastClientX: number;
  lastClientY: number;
};

type CanvasPanState = {
  lastClientX: number;
  lastClientY: number;
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
};

export function LayoutEditorStage({ activeFloorplan = null }: LayoutEditorStageProps) {
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
  const [toolMode, setToolMode] = useState<LayoutToolMode>("select");
  const [editorMode, setEditorMode] = useState<LayoutEditorMode>(DEFAULT_LAYOUT_EDITOR_MODE);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [canvasPanActive, setCanvasPanActive] = useState(false);
  const [canvasPopoverOpen, setCanvasPopoverOpen] = useState(false);
  const [selectedNewRoomType, setSelectedNewRoomType] =
    useState<AuthoringRoomType>("patient_room");
  const [authoringSequence, setAuthoringSequence] = useState(1);
  const [doorPathNodeGenerationResult, setDoorPathNodeGenerationResult] =
    useState<DoorPathNodeGenerationResult | null>(null);
  const [simulationReadyExportResult, setSimulationReadyExportResult] =
    useState<SimulationReadyExportResult | null>(null);
  const roomDragRef = useRef<RoomDragState | null>(null);
  const roomResizeRef = useRef<RoomResizeState | null>(null);
  const canvasPanRef = useRef<CanvasPanState | null>(null);
  const selectedRoom = findSelectedRoom(stageState);
  const selectedStation = findSelectedStation(stageState);
  useEffect(() => {
    if (activeFloorplan == null) {
      return;
    }
    dispatchStage({ type: "loadActiveFloorplan", floorplan: activeFloorplan });
  }, [
    activeFloorplan?.recordId,
    activeFloorplan?.planId,
    activeFloorplan?.sourceKind,
    activeFloorplan?.readOnly
  ]);
  useEffect(() => {
    setRoomDimensionDraft(createRoomInspectorDimensionDraft(selectedRoom));
  }, [selectedRoom?.id, selectedRoom?.xFeet, selectedRoom?.yFeet, selectedRoom?.widthFeet, selectedRoom?.heightFeet]);
  useEffect(() => {
    setDoorPathNodeGenerationResult(null);
    setSimulationReadyExportResult(null);
  }, [stageState.editableLayout, stageState.sourcePlan]);
  useEffect(() => {
    if (localDraftStorage == null || stageState.editableLayout == null || stageState.readOnly) {
      return;
    }
    saveLayoutLocalDraft(
      localDraftStorage,
      buildLayoutLocalDraftRecord({
        editableLayout: stageState.editableLayout,
        snapMode: stageState.snapMode,
        viewport: stageState.viewport,
        auditTrail: stageState.editAuditTrail,
        isDirty: stageState.isDirty
      })
    );
  }, [
    localDraftStorage,
    stageState.editableLayout,
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
  const roomItems = renderItems.filter((item) => item.objectType === "room");
  const doorItems = renderItems.filter((item) => item.objectType === "door");
  const stationItems = renderItems.filter((item) => item.objectType === "station");
  const hallwayArrows = buildHallwayArrowViewModels(renderItems);
  const selectedDoor =
    stageState.selectedObjectType === "door" && stageState.selectedObjectId != null
      ? stageState.editableLayout?.doors.find((door) => door.id === stageState.selectedObjectId) ?? null
      : null;
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
  const canvasObjectPopoverViewModel = canvasPopoverOpen
    ? buildCanvasObjectPopover({
        selectedObjectType: stageState.selectedObjectType,
        selectedObjectId: stageState.selectedObjectId,
        renderItems
      })
    : null;
  const roomQuickEditViewModel = buildRoomQuickEdit({
    room: selectedRoom,
    readOnly: stageState.readOnly
  });
  const doorQuickEditViewModel = buildDoorQuickEdit({
    door: selectedDoor,
    rooms: stageState.editableLayout?.rooms ?? [],
    readOnly: stageState.readOnly
  });
  const stationQuickEditViewModel = buildStationQuickEdit({
    station: selectedStation,
    readOnly: stageState.readOnly,
    presentation: editorMode === "presentation"
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
      setFloorplanJsonText(exported);
      setFloorplanJsonStatus(`Exported ${exportResult.plan.planId}; door/path sync deferred`);
    } catch (error) {
      setFloorplanJsonStatus(errorMessage(error));
    }
  };
  const addRoomFromStageClick = (event: PointerEvent<SVGSVGElement>) => {
    if (toolMode !== "add_room" || stageState.readOnly) {
      if (isCanvasPanBackgroundTarget(event.target)) {
        setCanvasPopoverOpen(false);
      }
      return;
    }
    const pointFeet = stagePointerToFeet(event, stageState.viewport);
    dispatchStage(
      buildAddRoomAction({
        sequence: authoringSequence,
        draft: {
          selectedRoomType: selectedNewRoomType,
          defaultWidthFeet: 12,
          defaultHeightFeet: 10
        },
        xFeet: pointFeet.xFeet,
        yFeet: pointFeet.yFeet
      })
    );
    setAuthoringSequence((value) => value + 1);
    setToolMode("select");
  };
  const addDoorToSelectedRoom = () => {
    if (
      stageState.readOnly ||
      stageState.selectedObjectType !== "room" ||
      stageState.selectedObjectId == null
    ) {
      return;
    }
    dispatchStage(
      buildAddDoorAction({
        sequence: authoringSequence,
        roomId: stageState.selectedObjectId
      })
    );
    setAuthoringSequence((value) => value + 1);
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
  const computeDoorAdjacent = () => {
    if (selectedDoor == null || stageState.editableLayout == null) {
      return null;
    }
    return assignDoorToAdjacentRoom({
      layout: stageState.editableLayout,
      door: selectedDoor
    });
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
      lastClientX: event.clientX,
      lastClientY: event.clientY
    };
    setCanvasPanActive(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveCanvasPan = (event: PointerEvent<SVGSVGElement>) => {
    const pan = canvasPanRef.current;
    if (pan == null) {
      return;
    }
    event.preventDefault();
    const delta = canvasPointerDeltaToPanFeet({
      deltaClientX: event.clientX - pan.lastClientX,
      deltaClientY: event.clientY - pan.lastClientY,
      pixelsPerFoot: stageState.viewport.pixelsPerFoot,
      zoom: stageState.viewport.zoom
    });
    canvasPanRef.current = {
      lastClientX: event.clientX,
      lastClientY: event.clientY
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
        readOnly={stageState.readOnly}
        isDirty={stageState.isDirty}
        undoDisabled={stageState.history.past.length === 0}
        redoDisabled={stageState.history.future.length === 0}
        jsonStatus={floorplanJsonStatus}
        validationSummary={viewportLayoutViewModel.validationSummary}
        validationDisabled={validationDisabled}
        inspectorCollapsed={inspectorCollapsed}
        onUndo={() => dispatchStage({ type: "undoLayoutEdit" })}
        onRedo={() => dispatchStage({ type: "redoLayoutEdit" })}
        onResetDraft={() => {
          if (localDraftStorage != null) {
            resetLayoutLocalDraft(localDraftStorage);
          }
          if (activeFloorplan == null) {
            dispatchStage({ type: "loadLayout", layout: layoutEditorProofFixture });
          } else {
            dispatchStage({ type: "loadActiveFloorplan", floorplan: activeFloorplan });
          }
        }}
        onExportJson={exportActiveFloorplanJson}
        onImportJson={importEditableFloorplanJson}
        onValidate={validateSimulationReadyExportFromStage}
        onResetView={() => dispatchStage({ type: "resetViewport" })}
        onAddObject={() => setToolMode("add_room")}
        onToggleInspector={() => setInspectorCollapsed((value) => !value)}
      />

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
        />
      </div>

      <div className={viewportLayoutViewModel.workspaceClassName} {...viewportLayoutViewModel.dataAttributes}>
        <div className="layout-editor-stage__shell" data-proof-only="true">
          <svg
            className={`layout-editor-stage__svg layout-editor-stage--${editorMode}`}
            viewBox={STAGE_VIEW_BOX}
            role="img"
            aria-label="Feet-based SVG grid stage"
            data-render-item-count={renderItems.length}
            data-room-render-count={roomItems.length}
            data-station-render-count={stationItems.length}
            data-provider-pharmacy-zone-render-count={providerPharmacyZoneItems.length}
            data-floorplan-source-kind={stageState.loadedFloorplan?.sourceKind ?? "proof-fixture"}
            data-validation-warning-count={stageState.validationWarnings.length}
            data-read-only={stageState.readOnly ? "true" : "false"}
            data-editor-mode={editorMode}
            data-canvas-pan={canvasPanActive ? "grabbing" : "grab"}
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
            {canvasObjectPopoverViewModel == null ? null : (
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
                    onDuplicateRoom={() => undefined}
                    onDeleteRoom={() => undefined}
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
                    onAdjacent={() => {
                      const next = computeDoorAdjacent();
                      if (next != null && doorQuickEditViewModel.doorId != null) {
                        dispatchStage({
                          type: "assignDoorToRoom",
                          doorId: doorQuickEditViewModel.doorId,
                          roomId: next.roomId,
                          wall: next.wall,
                          offsetFeet: next.offsetFeet
                        });
                      }
                    }}
                    onDeleteDoor={() => {
                      if (doorQuickEditViewModel.doorId != null) {
                        dispatchStage({ type: "deleteDoor", doorId: doorQuickEditViewModel.doorId });
                      }
                    }}
                  />
                ) : canvasObjectPopoverViewModel.objectType === "station" ? (
                  <StationQuickEditPopover
                    viewModel={stationQuickEditViewModel}
                    onStationTypeChange={() => undefined}
                    onPresentationStyle={() => setEditorMode("presentation")}
                    onMoveResize={() => setToolMode("select")}
                  />
                ) : null}
              </CanvasObjectPopover>
            )}
          </svg>
        </div>
        {inspectorCollapsed ? null : (
        <div className="layout-editor-stage__side-panels">
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
                      dispatchStage({ type: "editSelectedRoomDimensions", dimensions: result.changes });
                    }
                  }}
                  onCancelRoomDimensionDraft={(field) =>
                    setRoomDimensionDraft((draft) =>
                      cancelRoomInspectorDimensionDraftField(draft, selectedRoom, field)
                    )
                  }
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
                readOnly={stageState.readOnly}
                onMoveDoor={(doorId, wall, offsetFeet) =>
                  dispatchStage({ type: "moveDoor", doorId, wall, offsetFeet })
                }
                onDeleteDoor={(doorId) => dispatchStage({ type: "deleteDoor", doorId })}
                onAssignDoorToRoom={(doorId, roomId, wall, offsetFeet) =>
                  dispatchStage({ type: "assignDoorToRoom", doorId, roomId, wall, offsetFeet })
                }
              />
            }
            assignment={
              <aside className="layout-assignment-legend" aria-label="Assignment color legend">
              <h3>Assignment Colors</h3>
              <ul>
                {assignmentOverlay.legend.map((item) => (
                  <li key={item.label}>
                    <span style={{ backgroundColor: item.color }} />
                    {item.label}
                  </li>
                ))}
                <li>
                  <span className="layout-assignment-legend__unassigned" />
                  Unassigned occupied
                </li>
              </ul>
              </aside>
            }
            validation={
              <>
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

function createInitialStageState() {
  const storage = getBrowserLocalDraftStorage();
  if (storage == null) {
    return baseInitialStageState;
  }

  const loadedDraft = loadLayoutLocalDraft(storage);
  if (loadedDraft.status !== "loaded") {
    return baseInitialStageState;
  }

  const firstRoom = loadedDraft.draft.editableLayout.rooms[0];
  return createLayoutEditorState({
    ...baseInitialStageState,
    editableLayout: loadedDraft.draft.editableLayout,
    viewport: loadedDraft.draft.viewport,
    snapMode: loadedDraft.draft.snapMode,
    editAuditTrail: loadedDraft.draft.auditTrail,
    isDirty: loadedDraft.draft.dirtyState.isDirty,
    selectedObjectType: firstRoom == null ? null : "room",
    selectedObjectId: firstRoom?.id ?? null
  });
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
