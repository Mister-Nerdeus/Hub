import {
  addDoorToRoom,
  addSplitBayToEditableLayout,
  alignRoomToReference,
  addRoomToEditableLayout,
  assignDoorToRoom,
  authoringRoomTypeToEditableRoomType,
  createEditableSupportAccessPoint,
  duplicateLayoutObject,
  generateAutoHallways,
  isProviderPharmacySupportZone,
  moveDoor,
  snapRoomToGrid,
  updateDoorWidth,
  validateAuthoringRoomType,
  type AuthoringRoomType,
  type EditableDoorWall,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry,
  type EditableSplitBayDividerStyle,
  type EditableStationType,
  type EditableZoneType
} from "@nerdeus/shared";

import {
  createLayoutEditorState,
  createLayoutEditorStateFromFloorplan,
  isLayoutEditorSelectableObjectType,
  isLayoutEditorSnapMode,
  normalizeLayoutEditorViewport,
  type LayoutEditorFloorplanInput,
  type LayoutEditorSelectableObjectType,
  type LayoutEditorSnapMode,
  type LayoutEditorState,
  type LayoutEditorValidationWarning,
  type LayoutEditorViewport
} from "./layoutEditorState";
import {
  DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET,
  panLayoutViewport,
  fitLayoutViewportToBounds,
  resetLayoutViewport,
  zoomLayoutViewport,
  type LayoutViewportZoomDirection
} from "./layoutViewportControls";
import {
  createRoomDimensionEditAuditEntry,
  createRoomMoveAuditEntry,
  createRoomResizeAuditEntry,
  createStationDimensionEditAuditEntry,
  createStationMoveAuditEntry,
  createStationResizeAuditEntry
} from "./layoutEditAuditTrail";
import { applyLayoutEditEffects } from "./layoutEditEffects";
import { selectEditableLayoutObject } from "./layoutSelectionModel";
import {
  buildLayoutValidationWarning,
  validateLayoutValidationWarning
} from "./layoutValidationWarningContract";
import {
  recalculateWarningsForRoom,
  replaceGeneratedWarningsBySources
} from "./layoutWarningRecalculation";
import { moveRoomByDeltaFeet } from "./roomDragMove";
import { moveStationByDeltaFeet } from "./stationDragMove";
import {
  editSelectedRoomDimensionsInLayout,
  type RoomInspectorDimensionChanges
} from "./roomInspectorDimensionEdit";
import { resizeSelectedRoomInLayout } from "./roomResizeInteraction";
import type { RoomResizeHandle } from "./roomResizeHandlesViewModel";
import {
  editSelectedStationDimensionsInLayout,
  resizeSelectedStationInLayout,
  type StationInspectorDimensionChanges
} from "./stationResizeInteraction";
import type { StationResizeHandle } from "./stationResizeHandlesViewModel";
import { validateRoomResizeWarnings } from "./roomResizeValidation";
import {
  validateRoomOperationalLabel,
  validateRoomOperationalNumber
} from "./roomLabelValidation";
import {
  createLayoutUndoRedoHistory,
  createLayoutUndoRedoSnapshot,
  pushLayoutUndoRedoSnapshot,
  redoLayoutEditHistory,
  undoLayoutEditHistory,
  type LayoutUndoRedoSnapshot
} from "./layoutUndoRedoHistory";
import type { LayoutLocalDraftRecord } from "./layoutLocalDraftPersistence";

export type LayoutEditorAction =
  | { type: "loadLayout"; layout: EditableLayoutGeometryContract }
  | { type: "loadActiveFloorplan"; floorplan: LayoutEditorFloorplanInput }
  | { type: "restoreLocalDraft"; draft: LayoutLocalDraftRecord }
  | {
      type: "selectObject";
      objectType: LayoutEditorSelectableObjectType;
      objectId: string;
    }
  | { type: "clearSelection" }
  | { type: "setViewport"; viewport: LayoutEditorViewport }
  | { type: "zoomViewport"; direction: LayoutViewportZoomDirection }
  | { type: "panViewport"; deltaXFeet: number; deltaYFeet: number }
  | { type: "resetViewport" }
  | { type: "fitViewport" }
  | { type: "setSnapMode"; snapMode: LayoutEditorSnapMode }
  | { type: "moveRoom"; roomId: string; deltaXFeet: number; deltaYFeet: number }
  | { type: "moveStation"; stationId: string; deltaXFeet: number; deltaYFeet: number }
  | {
      type: "resizeRoom";
      roomId: string;
      handle: RoomResizeHandle;
      deltaXFeet: number;
      deltaYFeet: number;
    }
  | {
      type: "resizeStation";
      stationId: string;
      handle: StationResizeHandle;
      deltaXFeet: number;
      deltaYFeet: number;
    }
  | { type: "editSelectedRoomDimensions"; dimensions: RoomInspectorDimensionChanges }
  | {
      type: "editSelectedStationDimensions";
      stationId: string;
      dimensions: StationInspectorDimensionChanges;
    }
  | {
      type: "editSelectedRoomLabel";
      roomId: string;
      roomNumber?: string;
      label?: string;
    }
  | { type: "editSelectedRoomType"; roomId: string; roomType: AuthoringRoomType }
  | {
      type: "addRoom";
      roomId: string;
      label: string;
      roomType: AuthoringRoomType;
      xFeet: number;
      yFeet: number;
      widthFeet: number;
      heightFeet: number;
    }
  | { type: "deleteSelectedRoom" }
  | {
      type: "addDoorToRoom";
      doorId: string;
      roomId: string;
      wall: EditableDoorWall;
      offsetFeet: number;
      widthFeet: number;
    }
  | {
      type: "addSupportAccessPoint";
      accessPointId: string;
      zoneId: string;
      wall: EditableDoorWall;
      offsetFeet: number;
      widthFeet: number;
    }
  | {
      type: "moveSupportAccessPoint";
      accessPointId: string;
      wall: EditableDoorWall;
      offsetFeet: number;
    }
  | {
      type: "updateSupportAccessPointWidth";
      accessPointId: string;
      wall: EditableDoorWall;
      offsetFeet: number;
      widthFeet: number;
    }
  | { type: "deleteSupportAccessPoint"; accessPointId: string }
  | {
      type: "addSplitBay";
      splitBayId: string;
      label: string;
      roomA: EditableRoomGeometry;
      roomB: EditableRoomGeometry;
    }
  | {
      type: "convertSelectedRoomPairToSplitBay";
      roomId: string;
      splitBayId: string;
    }
  | {
      type: "editSplitBayDivider";
      splitBayId: string;
      dividerStyle: EditableSplitBayDividerStyle;
    }
  | { type: "moveDoor"; doorId: string; wall: EditableDoorWall; offsetFeet: number }
  | { type: "updateDoorWidth"; doorId: string; wall: EditableDoorWall; offsetFeet: number; widthFeet: number }
  | { type: "doorToolMove"; doorId: string; wall: EditableDoorWall; offsetFeet: number }
  | { type: "deleteDoor"; doorId: string }
  | { type: "removeSelectedRoomDoors" }
  | {
      type: "assignDoorToRoom";
      doorId: string;
      roomId: string;
      wall: EditableDoorWall;
      offsetFeet: number;
    }
  | {
      type: "editSelectedStation";
      stationId: string;
      label?: string;
      stationType?: EditableStationType;
    }
  | { type: "editSelectedHallwayLabel"; hallwayId: string; label: string }
  | {
      type: "editSelectedZone";
      zoneId: string;
      label?: string;
      zoneType?: EditableZoneType;
    }
  | { type: "generateAutoHallways" }
  | {
      type: "alignSelectedRoom";
      operation: "alignTop" | "alignBottom" | "alignLeft" | "alignRight" | "matchWidth" | "matchHeight" | "snapToGrid";
      referenceRoomId?: string | null;
    }
  | { type: "duplicateSelectedObject" }
  | { type: "undoLayoutEdit" }
  | { type: "redoLayoutEdit" }
  | { type: "setValidationWarnings"; validationWarnings: LayoutEditorValidationWarning[] }
  | { type: "markClean" };

export function layoutEditorReducer(
  state: LayoutEditorState = createLayoutEditorState(),
  action: LayoutEditorAction
): LayoutEditorState {
  if (action == null || typeof action !== "object" || typeof action.type !== "string") {
    throw new Error("layout editor action type is required");
  }

  switch (action.type) {
    case "loadLayout":
      return {
        ...state,
        editableLayout: action.layout,
        sourcePlan: null,
        loadedFloorplan: null,
        readOnly: false,
        selectedObjectId: null,
        selectedObjectType: null,
        validationWarnings: [],
        editAuditTrail: [],
        isDirty: false,
        history: createLayoutUndoRedoHistory(state.history.maxDepth)
      };
    case "loadActiveFloorplan":
      return createLayoutEditorStateFromFloorplan(action.floorplan, {
        viewport: state.viewport,
        layoutBoundsFeet: state.layoutBoundsFeet,
        snapMode: state.snapMode,
        history: createLayoutUndoRedoHistory(state.history.maxDepth)
      });
    case "restoreLocalDraft": {
      const firstRoom = action.draft.editableLayout.rooms[0];
      return {
        ...state,
        editableLayout: action.draft.editableLayout,
        viewport: normalizeLayoutEditorViewport(action.draft.viewport),
        snapMode: action.draft.snapMode,
        editAuditTrail: [...action.draft.auditTrail],
        isDirty: action.draft.dirtyState.isDirty,
        selectedObjectType: firstRoom == null ? null : "room",
        selectedObjectId: firstRoom?.id ?? null,
        history: createLayoutUndoRedoHistory(state.history.maxDepth)
      };
    }
    case "selectObject":
      return selectObject(state, action.objectType, action.objectId);
    case "clearSelection":
      return {
        ...state,
        selectedObjectId: null,
        selectedObjectType: null
      };
    case "setViewport":
      return {
        ...state,
        viewport: normalizeLayoutEditorViewport(action.viewport)
      };
    case "zoomViewport":
      return {
        ...state,
        viewport: zoomLayoutViewport(state.viewport, action.direction)
      };
    case "panViewport":
      return {
        ...state,
        viewport: panLayoutViewport(state.viewport, {
          deltaXFeet: action.deltaXFeet,
          deltaYFeet: action.deltaYFeet
        })
      };
    case "resetViewport":
      return {
        ...state,
        viewport: resetLayoutViewport()
      };
    case "fitViewport":
      return {
        ...state,
        viewport: fitLayoutViewportToBounds(state.layoutBoundsFeet, {
          widthPixels: 1080,
          heightPixels: 720
        }, state.viewport.pixelsPerFoot)
      };
    case "setSnapMode":
      if (!isLayoutEditorSnapMode(action.snapMode)) {
        throw new Error("snapMode must be default or fine");
      }
      return {
        ...state,
        snapMode: action.snapMode
      };
    case "moveRoom":
      return moveRoom(state, action.roomId, {
        deltaXFeet: action.deltaXFeet,
        deltaYFeet: action.deltaYFeet
      });
    case "moveStation":
      return moveStation(state, action.stationId, {
        deltaXFeet: action.deltaXFeet,
        deltaYFeet: action.deltaYFeet
      });
    case "resizeRoom":
      return resizeRoom(state, action.roomId, action.handle, {
        deltaXFeet: action.deltaXFeet,
        deltaYFeet: action.deltaYFeet
      });
    case "resizeStation":
      return resizeStation(state, action.stationId, action.handle, {
        deltaXFeet: action.deltaXFeet,
        deltaYFeet: action.deltaYFeet
      });
    case "editSelectedRoomDimensions":
      return editSelectedRoomDimensions(state, action.dimensions);
    case "editSelectedStationDimensions":
      return editSelectedStationDimensions(state, action.stationId, action.dimensions);
    case "editSelectedRoomLabel":
      return editSelectedRoomLabel(state, action);
    case "editSelectedRoomType":
      return editSelectedRoomType(state, action.roomId, action.roomType);
    case "addRoom":
      return addRoom(state, action);
    case "deleteSelectedRoom":
      return deleteSelectedRoom(state);
    case "addDoorToRoom":
      return applyDoorAuthoring(
        state,
        addDoorToRoom({
          layout: requireEditableLayout(state),
          readOnly: state.readOnly,
          doorId: action.doorId,
          roomId: action.roomId,
          wall: action.wall,
          offsetFeet: action.offsetFeet,
          widthFeet: action.widthFeet
        })
      );
    case "addSupportAccessPoint":
      return addSupportAccessPoint(state, action);
    case "moveSupportAccessPoint":
      return editSupportAccessPoint(state, action.accessPointId, {
        wall: action.wall,
        offsetFeet: action.offsetFeet
      });
    case "updateSupportAccessPointWidth":
      return editSupportAccessPoint(state, action.accessPointId, {
        wall: action.wall,
        offsetFeet: action.offsetFeet,
        widthFeet: action.widthFeet
      });
    case "deleteSupportAccessPoint":
      return deleteSupportAccessPoint(state, action.accessPointId);
    case "addSplitBay":
      return addSplitBay(state, action);
    case "convertSelectedRoomPairToSplitBay":
      return convertSelectedRoomPairToSplitBay(state, action);
    case "editSplitBayDivider":
      return editSplitBayDivider(state, action.splitBayId, action.dividerStyle);
    case "moveDoor":
      return applyDoorAuthoring(
        state,
        moveDoor({
          layout: requireEditableLayout(state),
          readOnly: state.readOnly,
          doorId: action.doorId,
          wall: action.wall,
          offsetFeet: action.offsetFeet
        })
      );
    case "updateDoorWidth":
      return applyDoorAuthoring(
        state,
        updateDoorWidth({
          layout: requireEditableLayout(state),
          readOnly: state.readOnly,
          doorId: action.doorId,
          wall: action.wall,
          offsetFeet: action.offsetFeet,
          widthFeet: action.widthFeet
        })
      );
    case "doorToolMove":
      return applyDoorAuthoring(
        state,
        moveDoor({
          layout: requireEditableLayout(state),
          readOnly: state.readOnly,
          doorId: action.doorId,
          wall: action.wall,
          offsetFeet: action.offsetFeet
        })
      );
    case "deleteDoor":
      return deleteDoorFromState(state, action.doorId);
    case "removeSelectedRoomDoors":
      return removeSelectedRoomDoors(state);
    case "assignDoorToRoom":
      return applyDoorAuthoring(
        state,
        assignDoorToRoom({
          layout: requireEditableLayout(state),
          readOnly: state.readOnly,
          doorId: action.doorId,
          roomId: action.roomId,
          wall: action.wall,
          offsetFeet: action.offsetFeet
        })
      );
    case "editSelectedStation":
      return editSelectedStation(state, action);
    case "editSelectedHallwayLabel":
      return editSelectedHallwayLabel(state, action.hallwayId, action.label);
    case "editSelectedZone":
      return editSelectedZone(state, action);
    case "generateAutoHallways":
      return generateAutoHallwaysForState(state);
    case "alignSelectedRoom":
      return alignSelectedRoom(state, action);
    case "duplicateSelectedObject":
      return duplicateSelectedObject(state);
    case "undoLayoutEdit":
      return restoreLayoutEditHistory(state, "undo");
    case "redoLayoutEdit":
      return restoreLayoutEditHistory(state, "redo");
    case "setValidationWarnings":
      if (!Array.isArray(action.validationWarnings)) {
        throw new Error("validationWarnings must be an array");
      }
      return {
        ...state,
        validationWarnings: action.validationWarnings.map(validateLayoutValidationWarning)
      };
    case "markClean":
      return {
        ...state,
        isDirty: false
      };
    default:
      throw new Error(`Unsupported layout editor action: ${(action as { type: string }).type}`);
  }
}

function alignSelectedRoom(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "alignSelectedRoom" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null || state.selectedObjectType !== "room" || state.selectedObjectId == null) {
    return state;
  }
  const selectedRoomId = state.selectedObjectId;
  const referenceRoomId =
    action.referenceRoomId ??
    state.editableLayout.rooms.find((room) => room.id !== selectedRoomId)?.id ??
    null;
  const nextLayout = action.operation === "snapToGrid"
    ? snapRoomToGrid({ layout: state.editableLayout, roomId: selectedRoomId, gridFeet: 2 })
    : referenceRoomId == null
      ? state.editableLayout
      : alignRoomToReference({
          layout: state.editableLayout,
          roomId: selectedRoomId,
          referenceRoomId,
          operation: action.operation
        });
  if (JSON.stringify(nextLayout.rooms) === JSON.stringify(state.editableLayout.rooms)) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: nextLayout,
    selectedObjectType: "room",
    selectedObjectId: selectedRoomId,
    isDirty: true
  });
}

function editSelectedRoomType(
  state: LayoutEditorState,
  roomId: string,
  roomTypeValue: AuthoringRoomType
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "room" || state.selectedObjectId !== roomId) {
    return state;
  }
  const roomType = authoringRoomTypeToEditableRoomType(validateAuthoringRoomType(roomTypeValue));
  const room = state.editableLayout.rooms.find((candidate) => candidate.id === roomId);
  if (room == null) {
    throw new Error(`unknown room: ${roomId}`);
  }
  if (room.roomType === roomType) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      rooms: state.editableLayout.rooms.map((candidate) =>
        candidate.id === roomId
          ? {
              ...candidate,
              roomType,
              isHallBed: roomType === "hall_bed",
              isTraumaAdjacent: roomType === "trauma"
            }
          : candidate
      )
    },
    selectedObjectType: "room",
    selectedObjectId: roomId,
    isDirty: true
  });
}

function editSelectedRoomLabel(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "editSelectedRoomLabel" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "room" || state.selectedObjectId !== action.roomId) {
    return state;
  }
  const room = state.editableLayout.rooms.find((candidate) => candidate.id === action.roomId);
  if (room == null) {
    throw new Error(`unknown room: ${action.roomId}`);
  }
  const nextRoomNumber =
    action.roomNumber === undefined ? room.roomNumber : validateAccepted(validateRoomOperationalNumber(action.roomNumber));
  const nextLabel =
    action.label === undefined ? room.label : validateAccepted(validateRoomOperationalLabel(action.label));
  if (nextRoomNumber === room.roomNumber && nextLabel === room.label) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      rooms: state.editableLayout.rooms.map((candidate) =>
        candidate.id === action.roomId
          ? { ...candidate, roomNumber: nextRoomNumber, label: nextLabel }
          : candidate
      )
    },
    selectedObjectType: "room",
    selectedObjectId: action.roomId,
    isDirty: true
  });
}

function addRoom(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "addRoom" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const result = addRoomToEditableLayout({
    layout: state.editableLayout,
    readOnly: state.readOnly,
    roomId: action.roomId,
    label: action.label,
    roomType: action.roomType,
    xFeet: action.xFeet,
    yFeet: action.yFeet,
    widthFeet: action.widthFeet,
    heightFeet: action.heightFeet,
    boundsFeet: state.layoutBoundsFeet
  });
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: "room",
    selectedObjectId: result.selectedRoomId,
    validationWarnings: [
      ...state.validationWarnings,
      ...result.warnings.map((warning) =>
        buildLayoutValidationWarning({
          code: warning.code,
          severity: warning.severity,
          source: warning.code === "ROOM_MISSING_DOOR" ? "door_sync" : "path_sync",
          message: warning.message,
          objectType: warning.objectType === "room" || warning.objectType === "door" ? warning.objectType : null,
          objectId: warning.objectId,
          isGenerated: true
        })
      )
    ],
    isDirty: true
  });
}

function deleteSelectedRoom(state: LayoutEditorState): LayoutEditorState {
  if (
    state.readOnly ||
    state.editableLayout == null ||
    state.selectedObjectType !== "room" ||
    state.selectedObjectId == null
  ) {
    return state;
  }
  const roomId = state.selectedObjectId;
  if (!state.editableLayout.rooms.some((room) => room.id === roomId)) {
    return state;
  }
  const removedDoorIds = new Set(
    state.editableLayout.doors
      .filter((door) => door.ownerKind === "room" && door.ownerId === roomId)
      .map((door) => door.id)
  );
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      rooms: state.editableLayout.rooms.filter((room) => room.id !== roomId),
      doors: state.editableLayout.doors.filter((door) => !removedDoorIds.has(door.id)),
      splitBays: (state.editableLayout.splitBays ?? []).filter(
        (splitBay) => !splitBay.bedPositionRoomIds.includes(roomId)
      )
    },
    selectedObjectType: null,
    selectedObjectId: null,
    validationWarnings: state.validationWarnings.filter((warning) => {
      if (warning.objectType === "room" && warning.objectId === roomId) {
        return false;
      }
      if (warning.objectType === "door" && warning.objectId != null && removedDoorIds.has(warning.objectId)) {
        return false;
      }
      return true;
    }),
    isDirty: true
  });
}

function addSupportAccessPoint(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "addSupportAccessPoint" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const ownerZone = state.editableLayout.zones.find((zone) => zone.id === action.zoneId);
  if (ownerZone == null || !isProviderPharmacySupportZone(ownerZone)) {
    return state;
  }
  const wallLength = action.wall === "north" || action.wall === "south"
    ? ownerZone.widthFeet
    : ownerZone.heightFeet;
  const accessPoint = createEditableSupportAccessPoint({
    id: action.accessPointId,
    label: `${ownerZone.label} access`,
    ownerId: ownerZone.id,
    wall: action.wall,
    offsetFeet: clamp(action.offsetFeet, 0, Math.max(0, wallLength - action.widthFeet)),
    widthFeet: Math.min(action.widthFeet, wallLength)
  });
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      supportAccessPoints: [
        ...(state.editableLayout.supportAccessPoints ?? []).filter((candidate) => candidate.id !== accessPoint.id),
        accessPoint
      ]
    },
    selectedObjectType: "support_access",
    selectedObjectId: accessPoint.id,
    isDirty: true
  });
}

function editSupportAccessPoint(
  state: LayoutEditorState,
  accessPointId: string,
  changes: { wall: EditableDoorWall; offsetFeet: number; widthFeet?: number }
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const accessPoint = state.editableLayout.supportAccessPoints?.find((candidate) => candidate.id === accessPointId);
  if (accessPoint == null) {
    return state;
  }
  const ownerZone = state.editableLayout.zones.find((zone) => zone.id === accessPoint.ownerId);
  if (ownerZone == null) {
    return state;
  }
  const nextWidth = changes.widthFeet ?? accessPoint.widthFeet;
  const wallLength = changes.wall === "north" || changes.wall === "south"
    ? ownerZone.widthFeet
    : ownerZone.heightFeet;
  const updated = {
    ...accessPoint,
    wall: changes.wall,
    widthFeet: clamp(nextWidth, 2, wallLength),
    offsetFeet: clamp(changes.offsetFeet, 0, Math.max(0, wallLength - clamp(nextWidth, 2, wallLength)))
  };
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      supportAccessPoints: (state.editableLayout.supportAccessPoints ?? []).map((candidate) =>
        candidate.id === accessPointId ? updated : candidate
      )
    },
    selectedObjectType: "support_access",
    selectedObjectId: accessPointId,
    isDirty: true
  });
}

function deleteSupportAccessPoint(state: LayoutEditorState, accessPointId: string): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      supportAccessPoints: (state.editableLayout.supportAccessPoints ?? []).filter((candidate) => candidate.id !== accessPointId)
    },
    selectedObjectType: null,
    selectedObjectId: null,
    isDirty: true
  });
}

function addSplitBay(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "addSplitBay" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const result = addSplitBayToEditableLayout({
    layout: state.editableLayout,
    readOnly: state.readOnly,
    splitBayId: action.splitBayId,
    label: action.label,
    roomA: action.roomA,
    roomB: action.roomB,
    dividerStyle: "diagonal"
  });
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: "split_bay",
    selectedObjectId: result.selectedSplitBayId,
    isDirty: true
  });
}

function convertSelectedRoomPairToSplitBay(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "convertSelectedRoomPairToSplitBay" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const roomA = state.editableLayout.rooms.find((room) => room.id === action.roomId);
  const roomB = findBestSplitBayPartner(state.editableLayout.rooms, action.roomId);
  if (roomA == null || roomB == null) {
    return state;
  }
  if (roomAlreadyInSplitBay(state.editableLayout, roomA.id) || roomAlreadyInSplitBay(state.editableLayout, roomB.id)) {
    return state;
  }
  return addSplitBay(state, {
    type: "addSplitBay",
    splitBayId: action.splitBayId,
    label: `Split Bay ${roomA.roomNumber}/${roomB.roomNumber}`,
    roomA,
    roomB
  });
}

function roomAlreadyInSplitBay(layout: EditableLayoutGeometryContract, roomId: string): boolean {
  return (layout.splitBays ?? []).some((splitBay) => splitBay.bedPositionRoomIds.includes(roomId));
}

function editSplitBayDivider(
  state: LayoutEditorState,
  splitBayId: string,
  dividerStyle: EditableSplitBayDividerStyle
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      splitBays: (state.editableLayout.splitBays ?? []).map((splitBay) =>
        splitBay.splitBayId === splitBayId ? { ...splitBay, dividerStyle } : splitBay
      )
    },
    selectedObjectType: "split_bay",
    selectedObjectId: splitBayId,
    isDirty: true
  });
}

function findBestSplitBayPartner(
  rooms: readonly EditableRoomGeometry[],
  roomId: string
): EditableRoomGeometry | null {
  const selected = rooms.find((room) => room.id === roomId);
  if (selected == null) return null;
  const canonicalPartner = canonicalPartnerRoomId(roomId);
  if (canonicalPartner != null) {
    return rooms.find((room) => room.id === canonicalPartner) ?? null;
  }
  return rooms
    .filter((room) => room.id !== roomId && room.roomType !== "solid_wall")
    .sort((left, right) => rectDistanceFeet(selected, left) - rectDistanceFeet(selected, right))[0] ?? null;
}

function canonicalPartnerRoomId(roomId: string): string | null {
  const pairs: readonly (readonly [string, string])[] = [
    ["room-02", "room-03"],
    ["room-04", "room-05"],
    ["room-06", "room-07"],
    ["room-08", "room-09"]
  ];
  for (const [left, right] of pairs) {
    if (roomId === left) return right;
    if (roomId === right) return left;
  }
  return null;
}

function rectDistanceFeet(left: EditableRoomGeometry, right: EditableRoomGeometry): number {
  const leftCenterX = left.xFeet + left.widthFeet / 2;
  const leftCenterY = left.yFeet + left.heightFeet / 2;
  const rightCenterX = right.xFeet + right.widthFeet / 2;
  const rightCenterY = right.yFeet + right.heightFeet / 2;
  return Math.abs(leftCenterX - rightCenterX) + Math.abs(leftCenterY - rightCenterY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

function deleteDoorFromState(state: LayoutEditorState, doorId: string): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const door = state.editableLayout.doors.find((candidate) => candidate.id === doorId);
  if (door == null) {
    return state;
  }
  const ownerRoomExists = door.ownerKind === "room" &&
    state.editableLayout.rooms.some((room) => room.id === door.ownerId);
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      doors: state.editableLayout.doors.filter((candidate) => candidate.id !== doorId)
    },
    selectedObjectType: ownerRoomExists ? "room" : null,
    selectedObjectId: ownerRoomExists ? door.ownerId : null,
    validationWarnings: state.validationWarnings
      .filter((warning) => warning.objectType !== "door" || warning.objectId !== doorId)
      .filter((warning) => warning.relatedObjectType !== "door" || warning.relatedObjectId !== doorId)
      .concat(
        buildLayoutValidationWarning({
          code: "path_sync_stale_after_door_edit",
          severity: "warning",
          source: "path_sync",
          message: "Door authoring changed geometry; route/path sync is stale until path nodes are reviewed.",
          objectType: ownerRoomExists ? "room" : null,
          objectId: ownerRoomExists ? door.ownerId : null,
          isGenerated: true
        })
      ),
    isDirty: true
  });
}

function removeSelectedRoomDoors(state: LayoutEditorState): LayoutEditorState {
  if (
    state.readOnly ||
    state.editableLayout == null ||
    state.selectedObjectType !== "room" ||
    state.selectedObjectId == null
  ) {
    return state;
  }
  const roomId = state.selectedObjectId;
  const removedDoorIds = new Set(
    state.editableLayout.doors
      .filter((door) => door.ownerKind === "room" && door.ownerId === roomId)
      .map((door) => door.id)
  );
  if (removedDoorIds.size === 0) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      doors: state.editableLayout.doors.filter((door) => !removedDoorIds.has(door.id))
    },
    selectedObjectType: "room",
    selectedObjectId: roomId,
    validationWarnings: state.validationWarnings
      .filter((warning) => warning.objectType !== "door" || warning.objectId == null || !removedDoorIds.has(warning.objectId))
      .filter((warning) => warning.relatedObjectType !== "door" || warning.relatedObjectId == null || !removedDoorIds.has(warning.relatedObjectId))
      .concat(
        buildLayoutValidationWarning({
          code: "path_sync_stale_after_door_edit",
          severity: "warning",
          source: "path_sync",
          message: "Door authoring changed geometry; route/path sync is stale until path nodes are reviewed.",
          objectType: "room",
          objectId: roomId,
          isGenerated: true
        })
      ),
    isDirty: true
  });
}

function applyDoorAuthoring(
  state: LayoutEditorState,
  result: ReturnType<typeof addDoorToRoom>
): LayoutEditorState {
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: result.selectedDoorId == null ? null : "door",
    selectedObjectId: result.selectedDoorId,
    validationWarnings: [
      ...state.validationWarnings,
      buildLayoutValidationWarning({
        code: "path_sync_stale_after_door_edit",
        severity: "warning",
        source: "path_sync",
        message: result.warning,
        objectType: result.selectedDoorId == null ? null : "door",
        objectId: result.selectedDoorId,
        isGenerated: true
      })
    ],
    isDirty: true
  });
}

function generateAutoHallwaysForState(state: LayoutEditorState): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const result = generateAutoHallways({
    layout: state.editableLayout,
    sourcePlanId: state.loadedFloorplan?.planId ?? state.editableLayout.layoutId,
    readOnly: state.readOnly,
    boundsFeet: state.layoutBoundsFeet
  });
  const manualHallways = state.editableLayout.hallways.filter((hallway) =>
    result.preservedManualHallwayIds.includes(hallway.id)
  );
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      hallways: [...manualHallways, ...result.generatedHallwayZones]
    },
    validationWarnings: [
      ...state.validationWarnings,
      buildLayoutValidationWarning({
        code: "generated_hallways_require_review",
        severity: "info",
        source: "path_sync",
        message: "Generated hallway/public space is approximate and requires route/path review.",
        objectType: "hallway",
        objectId: result.generatedHallwayId,
        isGenerated: true
      })
    ],
    isDirty: true
  });
}

function editSelectedStation(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "editSelectedStation" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "station" || state.selectedObjectId !== action.stationId) {
    return state;
  }
  const label = normalizeEditableLabel(action.label);
  const updatedLayout = {
    ...state.editableLayout,
    stations: state.editableLayout.stations.map((station) =>
      station.id === action.stationId
        ? {
            ...station,
            label: label ?? station.label,
            stationType: action.stationType ?? station.stationType
          }
        : station
    )
  };
  if (JSON.stringify(updatedLayout.stations) === JSON.stringify(state.editableLayout.stations)) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: updatedLayout,
    selectedObjectType: "station",
    selectedObjectId: action.stationId,
    isDirty: true
  });
}

function editSelectedHallwayLabel(
  state: LayoutEditorState,
  hallwayId: string,
  labelValue: string
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "hallway" || state.selectedObjectId !== hallwayId) {
    return state;
  }
  const label = normalizeEditableLabel(labelValue);
  if (label == null) {
    return state;
  }
  const updatedLayout = {
    ...state.editableLayout,
    hallways: state.editableLayout.hallways.map((hallway) =>
      hallway.id === hallwayId ? { ...hallway, label } : hallway
    )
  };
  if (JSON.stringify(updatedLayout.hallways) === JSON.stringify(state.editableLayout.hallways)) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: updatedLayout,
    selectedObjectType: "hallway",
    selectedObjectId: hallwayId,
    isDirty: true
  });
}

function editSelectedZone(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "editSelectedZone" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "zone" || state.selectedObjectId !== action.zoneId) {
    return state;
  }
  const label = normalizeEditableLabel(action.label);
  const updatedLayout = {
    ...state.editableLayout,
    zones: state.editableLayout.zones.map((zone) =>
      zone.id === action.zoneId
        ? {
            ...zone,
            label: label ?? zone.label,
            zoneType: action.zoneType ?? zone.zoneType
          }
        : zone
    )
  };
  if (JSON.stringify(updatedLayout.zones) === JSON.stringify(state.editableLayout.zones)) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: updatedLayout,
    selectedObjectType: "zone",
    selectedObjectId: action.zoneId,
    isDirty: true
  });
}

function duplicateSelectedObject(state: LayoutEditorState): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null || state.selectedObjectId == null) {
    return state;
  }
  if (
    state.selectedObjectType !== "room" &&
    state.selectedObjectType !== "station" &&
    state.selectedObjectType !== "zone"
  ) {
    return state;
  }
  const result = duplicateLayoutObject({
    layout: state.editableLayout,
    readOnly: state.readOnly,
    objectType: state.selectedObjectType,
    objectId: state.selectedObjectId
  });
  const labelReviewWarning = result.objectType === "room"
    ? [
        buildLayoutValidationWarning({
          code: "copied_room_label_review",
          severity: "info",
          source: "audit",
          message: "Copied room label should be reviewed.",
          objectType: "room",
          objectId: result.duplicatedObjectId,
          isGenerated: true
        })
      ]
    : [];
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: result.objectType,
    selectedObjectId: result.duplicatedObjectId,
    validationWarnings: [...state.validationWarnings, ...labelReviewWarning],
    isDirty: true
  });
}

function normalizeEditableLabel(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const label = value.trim();
  return label.length === 0 ? null : label;
}

function validateAccepted(result: ReturnType<typeof validateRoomOperationalLabel>): string {
  if (result.status !== "accepted") {
    throw new Error(result.reason);
  }
  return result.value;
}

function requireEditableLayout(state: LayoutEditorState): EditableLayoutGeometryContract {
  if (state.editableLayout == null) {
    throw new Error("editable layout is required");
  }
  return state.editableLayout;
}

function restoreLayoutEditHistory(
  state: LayoutEditorState,
  direction: "undo" | "redo"
): LayoutEditorState {
  const currentSnapshot = snapshotForHistory(state);
  const transition =
    direction === "undo"
      ? undoLayoutEditHistory(state.history, currentSnapshot)
      : redoLayoutEditHistory(state.history, currentSnapshot);
  if (transition.status === "empty") {
    return state;
  }
  return applyHistorySnapshot(state, transition.snapshot, transition.history);
}

function editSelectedRoomDimensions(
  state: LayoutEditorState,
  dimensions: RoomInspectorDimensionChanges
): LayoutEditorState {
  if (state.readOnly) {
    return state;
  }
  if (state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "room" || state.selectedObjectId == null) {
    return state;
  }

  const roomId = state.selectedObjectId;
  const beforeRoom = state.editableLayout.rooms.find((room) => room.id === roomId);
  if (beforeRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }

  const editedLayout = editSelectedRoomDimensionsInLayout({
    layout: state.editableLayout,
    selectedObjectType: state.selectedObjectType,
    selectedObjectId: state.selectedObjectId,
    roomId,
    changes: dimensions,
    snapMode: state.snapMode
  });
  const afterRoom = editedLayout.rooms.find((room) => room.id === roomId);
  if (afterRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }
  if (roomRectEquals(beforeRoom, afterRoom)) {
    return state;
  }

  const auditEntry = createRoomDimensionEditAuditEntry({
    roomId,
    before: roomRectForAudit(beforeRoom),
    after: roomRectForAudit(afterRoom),
    deltaFeet: {
      deltaXFeet: afterRoom.xFeet - beforeRoom.xFeet,
      deltaYFeet: afterRoom.yFeet - beforeRoom.yFeet,
      deltaWidthFeet: afterRoom.widthFeet - beforeRoom.widthFeet,
      deltaHeightFeet: afterRoom.heightFeet - beforeRoom.heightFeet
    },
    changedFields: changedRoomDimensionFields(beforeRoom, afterRoom),
    createdAtOrder: state.editAuditTrail.length + 1
  });

  return withUndoHistory(
    state,
    applyLayoutEditEffects({
      state,
      editableLayout: editedLayout,
      validationWarnings: replaceGeneratedWarningsBySources({
        existingWarnings: state.validationWarnings,
        replacementWarnings: validateRoomResizeWarnings({
          layout: editedLayout,
          roomId,
          boundsFeet: state.layoutBoundsFeet
        }),
        sources: ["resize", "door_sync"]
      }),
      selectedObjectType: "room",
      selectedObjectId: roomId,
      auditEntry
    })
  );
}

function resizeRoom(
  state: LayoutEditorState,
  roomId: string,
  handle: RoomResizeHandle,
  delta: { deltaXFeet: number; deltaYFeet: number }
): LayoutEditorState {
  if (state.readOnly) {
    return state;
  }
  if (state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "room" || state.selectedObjectId !== roomId) {
    return state;
  }

  const beforeRoom = state.editableLayout.rooms.find((room) => room.id === roomId);
  if (beforeRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }

  const resizedLayout = resizeSelectedRoomInLayout({
    layout: state.editableLayout,
    selectedObjectType: state.selectedObjectType,
    selectedObjectId: state.selectedObjectId,
    roomId,
    handle,
    deltaFeet: delta,
    snapMode: state.snapMode
  });
  const afterRoom = resizedLayout.rooms.find((room) => room.id === roomId);
  if (afterRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }
  if (roomRectEquals(beforeRoom, afterRoom)) {
    return state;
  }

  const auditEntry = createRoomResizeAuditEntry({
    roomId,
    resizeHandle: handle,
    before: roomRectForAudit(beforeRoom),
    after: roomRectForAudit(afterRoom),
    deltaFeet: {
      deltaXFeet: afterRoom.xFeet - beforeRoom.xFeet,
      deltaYFeet: afterRoom.yFeet - beforeRoom.yFeet,
      deltaWidthFeet: afterRoom.widthFeet - beforeRoom.widthFeet,
      deltaHeightFeet: afterRoom.heightFeet - beforeRoom.heightFeet
    },
    createdAtOrder: state.editAuditTrail.length + 1
  });

  return withUndoHistory(
    state,
    applyLayoutEditEffects({
      state,
      editableLayout: resizedLayout,
      validationWarnings: replaceGeneratedWarningsBySources({
        existingWarnings: state.validationWarnings,
        replacementWarnings: validateRoomResizeWarnings({
          layout: resizedLayout,
          roomId,
          boundsFeet: state.layoutBoundsFeet
        }),
        sources: ["resize", "door_sync"]
      }),
      selectedObjectType: "room",
      selectedObjectId: roomId,
      auditEntry
    })
  );
}

function editSelectedStationDimensions(
  state: LayoutEditorState,
  stationId: string,
  dimensions: StationInspectorDimensionChanges
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "station" || state.selectedObjectId !== stationId) {
    return state;
  }

  const beforeStation = state.editableLayout.stations.find((station) => station.id === stationId);
  if (beforeStation == null) {
    throw new Error(`unknown station: ${stationId}`);
  }
  const editedLayout = editSelectedStationDimensionsInLayout({
    layout: state.editableLayout,
    selectedObjectType: state.selectedObjectType,
    selectedObjectId: state.selectedObjectId,
    stationId,
    changes: dimensions,
    snapMode: state.snapMode
  });
  const afterStation = editedLayout.stations.find((station) => station.id === stationId);
  if (afterStation == null) {
    throw new Error(`unknown station: ${stationId}`);
  }
  if (roomRectEquals(beforeStation, afterStation)) {
    return state;
  }

  const auditEntry = createStationDimensionEditAuditEntry({
    stationId,
    before: roomRectForAudit(beforeStation),
    after: roomRectForAudit(afterStation),
    deltaFeet: {
      deltaXFeet: afterStation.xFeet - beforeStation.xFeet,
      deltaYFeet: afterStation.yFeet - beforeStation.yFeet,
      deltaWidthFeet: afterStation.widthFeet - beforeStation.widthFeet,
      deltaHeightFeet: afterStation.heightFeet - beforeStation.heightFeet
    },
    changedFields: changedRoomDimensionFields(beforeStation, afterStation),
    createdAtOrder: state.editAuditTrail.length + 1
  });

  return withUndoHistory(
    state,
    applyLayoutEditEffects({
      state,
      editableLayout: editedLayout,
      validationWarnings: replaceGeneratedWarningsBySources({
        existingWarnings: state.validationWarnings,
        replacementWarnings: validateStationResizeWarnings(afterStation),
        sources: ["resize"]
      }),
      selectedObjectType: "station",
      selectedObjectId: stationId,
      auditEntry
    })
  );
}

function resizeStation(
  state: LayoutEditorState,
  stationId: string,
  handle: StationResizeHandle,
  delta: { deltaXFeet: number; deltaYFeet: number }
): LayoutEditorState {
  if (state.readOnly) {
    return state;
  }
  if (state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "station" || state.selectedObjectId !== stationId) {
    return state;
  }

  const beforeStation = state.editableLayout.stations.find((station) => station.id === stationId);
  if (beforeStation == null) {
    throw new Error(`unknown station: ${stationId}`);
  }

  const resizedLayout = resizeSelectedStationInLayout({
    layout: state.editableLayout,
    selectedObjectType: state.selectedObjectType,
    selectedObjectId: state.selectedObjectId,
    stationId,
    handle,
    deltaFeet: delta,
    snapMode: state.snapMode
  });
  const afterStation = resizedLayout.stations.find((station) => station.id === stationId);
  if (afterStation == null) {
    throw new Error(`unknown station: ${stationId}`);
  }
  if (roomRectEquals(beforeStation, afterStation)) {
    return state;
  }

  const auditEntry = createStationResizeAuditEntry({
    stationId,
    resizeHandle: handle,
    before: roomRectForAudit(beforeStation),
    after: roomRectForAudit(afterStation),
    deltaFeet: {
      deltaXFeet: afterStation.xFeet - beforeStation.xFeet,
      deltaYFeet: afterStation.yFeet - beforeStation.yFeet,
      deltaWidthFeet: afterStation.widthFeet - beforeStation.widthFeet,
      deltaHeightFeet: afterStation.heightFeet - beforeStation.heightFeet
    },
    createdAtOrder: state.editAuditTrail.length + 1
  });

  return withUndoHistory(
    state,
    applyLayoutEditEffects({
      state,
      editableLayout: resizedLayout,
      validationWarnings: replaceGeneratedWarningsBySources({
        existingWarnings: state.validationWarnings,
        replacementWarnings: validateStationResizeWarnings(afterStation),
        sources: ["resize"]
      }),
      selectedObjectType: "station",
      selectedObjectId: stationId,
      auditEntry
    })
  );
}

function validateStationResizeWarnings(station: {
  id: string;
  widthFeet: number;
  heightFeet: number;
}): LayoutEditorValidationWarning[] {
  if (station.widthFeet >= 8 && station.heightFeet >= 5) {
    return [];
  }
  return [
    buildLayoutValidationWarning({
      code: "station_label_readability_small",
      severity: "info",
      source: "resize",
      message: "Station label may be hard to read at this size.",
      objectType: "station",
      objectId: station.id,
      isGenerated: true
    })
  ];
}

function roomRectEquals(
  left: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number },
  right: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number }
): boolean {
  return (
    left.xFeet === right.xFeet &&
    left.yFeet === right.yFeet &&
    left.widthFeet === right.widthFeet &&
    left.heightFeet === right.heightFeet
  );
}

function roomRectForAudit(room: {
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
}) {
  return {
    xFeet: room.xFeet,
    yFeet: room.yFeet,
    widthFeet: room.widthFeet,
    heightFeet: room.heightFeet
  };
}

function changedRoomDimensionFields(
  beforeRoom: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number },
  afterRoom: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number }
): string[] {
  return ["xFeet", "yFeet", "widthFeet", "heightFeet"].filter(
    (field) =>
      beforeRoom[field as keyof typeof beforeRoom] !==
      afterRoom[field as keyof typeof afterRoom]
  );
}

export function panViewportAction(
  direction: "north" | "south" | "west" | "east"
): Extract<LayoutEditorAction, { type: "panViewport" }> {
  switch (direction) {
    case "north":
      return { type: "panViewport", deltaXFeet: 0, deltaYFeet: -DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET };
    case "south":
      return { type: "panViewport", deltaXFeet: 0, deltaYFeet: DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET };
    case "west":
      return { type: "panViewport", deltaXFeet: -DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET, deltaYFeet: 0 };
    case "east":
      return { type: "panViewport", deltaXFeet: DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET, deltaYFeet: 0 };
  }
}

function selectObject(
  state: LayoutEditorState,
  objectType: LayoutEditorSelectableObjectType,
  objectId: string
): LayoutEditorState {
  if (!isLayoutEditorSelectableObjectType(objectType)) {
    throw new Error("objectType must be room, door, support_access, station, hallway, zone, or split_bay");
  }
  if (typeof objectId !== "string" || objectId.length === 0) {
    throw new Error("objectId must be a non-empty string");
  }
  if (state.editableLayout == null) {
    return state;
  }
  const selection = selectEditableLayoutObject(state.editableLayout, objectType, objectId);
  if (selection == null) {
    return state;
  }

  return {
    ...state,
    selectedObjectId: selection.objectId,
    selectedObjectType: selection.objectType
  };
}

function moveRoom(
  state: LayoutEditorState,
  roomId: string,
  delta: { deltaXFeet: number; deltaYFeet: number }
): LayoutEditorState {
  if (state.readOnly) {
    return state;
  }
  if (state.editableLayout == null) {
    return state;
  }

  const beforeRoom = state.editableLayout.rooms.find((room) => room.id === roomId);
  if (beforeRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }
  const movedLayout = moveRoomByDeltaFeet({
    layout: state.editableLayout,
    roomId,
    delta,
    snapMode: state.snapMode
  });
  const afterRoom = movedLayout.rooms.find((room) => room.id === roomId);
  if (afterRoom == null) {
    throw new Error(`unknown room: ${roomId}`);
  }

  const auditEntry = createRoomMoveAuditEntry({
    roomId,
    before: { xFeet: beforeRoom.xFeet, yFeet: beforeRoom.yFeet },
    after: { xFeet: afterRoom.xFeet, yFeet: afterRoom.yFeet },
    deltaFeet: {
      deltaXFeet: afterRoom.xFeet - beforeRoom.xFeet,
      deltaYFeet: afterRoom.yFeet - beforeRoom.yFeet
    },
    createdAtOrder: state.editAuditTrail.length + 1
  });

  return withUndoHistory(
    state,
    applyLayoutEditEffects({
      state,
      editableLayout: movedLayout,
      validationWarnings: recalculateWarningsForRoom({
        existingWarnings: state.validationWarnings,
        layout: movedLayout,
        roomId,
        boundsFeet: state.layoutBoundsFeet
      }),
      selectedObjectType: "room",
      selectedObjectId: roomId,
      auditEntry
    })
  );
}

function moveStation(
  state: LayoutEditorState,
  stationId: string,
  delta: { deltaXFeet: number; deltaYFeet: number }
): LayoutEditorState {
  if (state.readOnly) {
    return state;
  }
  if (state.editableLayout == null) {
    return state;
  }

  const beforeStation = state.editableLayout.stations.find((station) => station.id === stationId);
  if (beforeStation == null) {
    throw new Error(`unknown station: ${stationId}`);
  }
  const movedLayout = moveStationByDeltaFeet({
    layout: state.editableLayout,
    stationId,
    delta,
    snapMode: state.snapMode,
    boundsFeet: state.layoutBoundsFeet
  });
  const afterStation = movedLayout.stations.find((station) => station.id === stationId);
  if (afterStation == null) {
    throw new Error(`unknown station: ${stationId}`);
  }

  const auditEntry = createStationMoveAuditEntry({
    stationId,
    before: { xFeet: beforeStation.xFeet, yFeet: beforeStation.yFeet },
    after: { xFeet: afterStation.xFeet, yFeet: afterStation.yFeet },
    deltaFeet: {
      deltaXFeet: afterStation.xFeet - beforeStation.xFeet,
      deltaYFeet: afterStation.yFeet - beforeStation.yFeet
    },
    createdAtOrder: state.editAuditTrail.length + 1
  });

  return withUndoHistory(
    state,
    applyLayoutEditEffects({
      state,
      editableLayout: movedLayout,
      validationWarnings: state.validationWarnings,
      selectedObjectType: "station",
      selectedObjectId: stationId,
      auditEntry
    })
  );
}

function withUndoHistory(state: LayoutEditorState, nextState: LayoutEditorState): LayoutEditorState {
  if (nextState === state) {
    return state;
  }
  return {
    ...nextState,
    history: pushLayoutUndoRedoSnapshot(state.history, snapshotForHistory(state))
  };
}

function snapshotForHistory(state: LayoutEditorState): LayoutUndoRedoSnapshot {
  return createLayoutUndoRedoSnapshot({
    editableLayout: state.editableLayout,
    validationWarnings: state.validationWarnings,
    editAuditTrail: state.editAuditTrail,
    isDirty: state.isDirty
  });
}

function applyHistorySnapshot(
  state: LayoutEditorState,
  snapshot: LayoutUndoRedoSnapshot,
  history: LayoutEditorState["history"]
): LayoutEditorState {
  return {
    ...state,
    editableLayout: snapshot.editableLayout,
    validationWarnings: snapshot.validationWarnings,
    editAuditTrail: snapshot.editAuditTrail,
    isDirty: snapshot.isDirty,
    history
  };
}
