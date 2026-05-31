import {
  addSplitBayToEditableLayout,
  alignRoomToReference,
  addRoomToEditableLayout,
  authoringRoomTypeToEditableRoomType,
  createEditableSupportAccessPoint,
  createSplitRoomInEditableLayout,
  duplicateLayoutObject,
  generateAutoHallways,
  isDoorEligibleRoomType,
  isProviderPharmacySupportZone,
  removeSplitRoomFromEditableLayout,
  resolveSplitRoomPair,
  safeAddDoorToRoom,
  safeAssignDoorToRoom,
  safeDeleteDoor,
  safeMoveDoor,
  safeUpdateDoorWidth,
  snapRoomToGrid,
  validateAuthoringRoomType,
  type AuthoringRoomType,
  type DoorAuthoringActionType,
  type DoorAuthoringWarning,
  type EditableDoorWall,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry,
  type SafeDoorAuthoringResult,
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
import { buildDoorAuthoringValidationWarning } from "./layoutDoorAuthoringWarnings";
import {
  recalculateWarningsForRoom,
  replaceGeneratedWarningsBySources
} from "./layoutWarningRecalculation";
import { moveRoomByDeltaFeet } from "./roomDragMove";
import { moveStationByDeltaFeet } from "./stationDragMove";
import {
  editSelectedHallwayDimensionsInLayout,
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
import {
  convertSingleRoomToSplitRoom,
  moveSplitRoomParent,
  resizeSplitRoomParent,
  resetSplitRoomDividerToEven,
  updateSplitRoomDividerOrientation,
  updateSplitRoomDividerRatio,
  type SplitRoomDividerOrientation
} from "./splitRoomActions";

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
      type: "editSelectedHallwayDimensions";
      hallwayId: string;
      dimensions: RoomInspectorDimensionChanges;
    }
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
  | { type: "recordDoorAuthoringWarning"; warning: DoorAuthoringWarning }
  | { type: "recordDoorOwnerWarning"; warning: DoorAuthoringWarning }
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
      splitBayId?: string;
    }
  | {
      type: "convertSelectedRoomToSplitRoom";
      roomId: string;
      splitRoomId?: string;
    }
  | { type: "moveSplitRoomParent"; splitRoomId: string; deltaXFeet: number; deltaYFeet: number }
  | {
      type: "resizeSplitRoomParent";
      splitRoomId: string;
      handle: RoomResizeHandle;
      deltaXFeet: number;
      deltaYFeet: number;
    }
  | {
      type: "editSplitRoomDividerOrientation";
      splitRoomId: string;
      dividerOrientation: SplitRoomDividerOrientation;
    }
  | { type: "editSplitRoomDividerRatio"; splitRoomId: string; dividerRatio: number }
  | { type: "resetSplitRoomDivider"; splitRoomId: string }
  | {
      type: "editSplitBayDivider";
      splitBayId: string;
      dividerStyle: EditableSplitBayDividerStyle;
    }
  | { type: "unsplitSplitRoom"; splitBayId: string }
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
    case "editSelectedHallwayDimensions":
      return editSelectedHallwayDimensions(state, action.hallwayId, action.dimensions);
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
      return applyDoorAuthoringMutation(
        state,
        {
          actionType: "addDoor",
          doorId: action.doorId,
          roomId: action.roomId
        },
        (layout) => safeAddDoorToRoom({
          layout,
          readOnly: state.readOnly,
          doorId: action.doorId,
          roomId: action.roomId,
          wall: action.wall,
          offsetFeet: action.offsetFeet,
          widthFeet: action.widthFeet
        })
      );
    case "recordDoorAuthoringWarning":
      return appendDoorAuthoringWarning(state, action.warning);
    case "recordDoorOwnerWarning":
      return appendDoorAuthoringWarning(state, action.warning);
    case "addSupportAccessPoint":
      return applySupportAccessMutation(
        state,
        {
          actionType: "supportAccessAdd",
          doorId: action.accessPointId,
          ownerId: action.zoneId,
          blockedMessage: "Support access action blocked: target zone cannot accept this access point."
        },
        () => addSupportAccessPoint(state, action)
      );
    case "moveSupportAccessPoint":
      return applySupportAccessMutation(
        state,
        {
          actionType: "supportAccessMove",
          doorId: action.accessPointId,
          blockedMessage: "Support access action blocked: access point could not be moved."
        },
        () => editSupportAccessPoint(state, action.accessPointId, {
          wall: action.wall,
          offsetFeet: action.offsetFeet
        })
      );
    case "updateSupportAccessPointWidth":
      return applySupportAccessMutation(
        state,
        {
          actionType: "supportAccessWidth",
          doorId: action.accessPointId,
          blockedMessage: "Support access action blocked: width change could not be applied."
        },
        () => editSupportAccessPoint(state, action.accessPointId, {
          wall: action.wall,
          offsetFeet: action.offsetFeet,
          widthFeet: action.widthFeet
        })
      );
    case "deleteSupportAccessPoint":
      return applySupportAccessMutation(
        state,
        {
          actionType: "supportAccessDelete",
          doorId: action.accessPointId,
          blockedMessage: "Support access action blocked: access point could not be deleted."
        },
        () => deleteSupportAccessPoint(state, action.accessPointId)
      );
    case "addSplitBay":
      return addSplitBay(state, action);
    case "convertSelectedRoomPairToSplitBay":
      return convertSelectedRoomPairToSplitBay(state, action);
    case "convertSelectedRoomToSplitRoom":
      return convertSelectedRoomToSplitRoom(state, action);
    case "moveSplitRoomParent":
      return moveSelectedSplitRoomParent(state, action.splitRoomId, {
        deltaXFeet: action.deltaXFeet,
        deltaYFeet: action.deltaYFeet
      });
    case "resizeSplitRoomParent":
      return resizeSelectedSplitRoomParent(state, action.splitRoomId, action.handle, {
        deltaXFeet: action.deltaXFeet,
        deltaYFeet: action.deltaYFeet
      });
    case "editSplitRoomDividerOrientation":
      return editSplitRoomDividerOrientation(state, action.splitRoomId, action.dividerOrientation);
    case "editSplitRoomDividerRatio":
      return editSplitRoomDividerRatio(state, action.splitRoomId, action.dividerRatio);
    case "resetSplitRoomDivider":
      return resetSplitRoomDivider(state, action.splitRoomId);
    case "editSplitBayDivider":
      return editSplitBayDivider(state, action.splitBayId, action.dividerStyle);
    case "unsplitSplitRoom":
      return unsplitSplitRoom(state, action.splitBayId);
    case "moveDoor":
      return applyDoorAuthoringMutation(
        state,
        {
          actionType: "moveDoor",
          doorId: action.doorId
        },
        (layout) => safeMoveDoor({
          layout,
          readOnly: state.readOnly,
          doorId: action.doorId,
          wall: action.wall,
          offsetFeet: action.offsetFeet
        })
      );
    case "updateDoorWidth":
      return applyDoorAuthoringMutation(
        state,
        {
          actionType: "updateDoorWidth",
          doorId: action.doorId
        },
        (layout) => safeUpdateDoorWidth({
          layout,
          readOnly: state.readOnly,
          doorId: action.doorId,
          wall: action.wall,
          offsetFeet: action.offsetFeet,
          widthFeet: action.widthFeet
        })
      );
    case "doorToolMove":
      return applyDoorAuthoringMutation(
        state,
        {
          actionType: "moveDoor",
          doorId: action.doorId
        },
        (layout) => safeMoveDoor({
          layout,
          readOnly: state.readOnly,
          doorId: action.doorId,
          wall: action.wall,
          offsetFeet: action.offsetFeet
        })
      );
    case "deleteDoor":
      return applyDoorAuthoringMutation(
        state,
        {
          actionType: "deleteDoor",
          doorId: action.doorId,
          selectionAfterApplied: selectionAfterDoorDelete(state, action.doorId),
          clearDoorWarningIds: [action.doorId]
        },
        (layout) => safeDeleteDoor({
          layout,
          readOnly: state.readOnly,
          doorId: action.doorId
        })
      );
    case "removeSelectedRoomDoors":
      return removeSelectedRoomDoors(state);
    case "assignDoorToRoom":
      return applyDoorAuthoringMutation(
        state,
        {
          actionType: "assignDoor",
          doorId: action.doorId,
          roomId: action.roomId
        },
        (layout) => safeAssignDoorToRoom({
          layout,
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
  const removedDoorIds = new Set(
    isDoorEligibleRoomType(roomType)
      ? []
      : state.editableLayout.doors
          .filter((door) => door.ownerKind === "room" && door.ownerId === roomId)
          .map((door) => door.id)
  );
  const validationWarnings =
    removedDoorIds.size === 0
      ? state.validationWarnings
      : state.validationWarnings
          .filter((warning) => warning.objectType !== "door" || warning.objectId == null || !removedDoorIds.has(warning.objectId))
          .filter((warning) => warning.relatedObjectType !== "door" || warning.relatedObjectId == null || !removedDoorIds.has(warning.relatedObjectId))
          .concat(
            buildLayoutValidationWarning({
              code: "path_sync_stale_after_door_edit",
              severity: "warning",
              source: "path_sync",
              message: "Solid wall / blocked area cannot keep attached doors; attached door geometry was removed and path nodes need review.",
              objectType: "room",
              objectId: roomId,
              isGenerated: true
            })
          );
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
      ),
      doors: removedDoorIds.size === 0
        ? state.editableLayout.doors
        : state.editableLayout.doors.filter((door) => !removedDoorIds.has(door.id))
    },
    validationWarnings,
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
  const accessPointExists = state.editableLayout.supportAccessPoints?.some((candidate) => candidate.id === accessPointId) === true;
  if (!accessPointExists) {
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
  // Legacy split-bay compatibility path only. Normal editor split creation dispatches
  // convertSelectedRoomToSplitRoom and does not resolve/merge a room pair.
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  try {
    void resolveSplitRoomPair({ layout: state.editableLayout, selectedRoomId: action.roomId });
  } catch {
    // Existing invalid layout references are handled below without interrupting the editor.
  }
  let result: ReturnType<typeof createSplitRoomInEditableLayout>;
  try {
    result = createSplitRoomInEditableLayout({
      layout: state.editableLayout,
      readOnly: state.readOnly,
      selectedRoomId: action.roomId
    });
  } catch {
    return {
      ...state,
      validationWarnings: [
        ...state.validationWarnings,
        buildLayoutValidationWarning({
          code: "split_room_creation_blocked",
          severity: "warning",
          source: "inspector_edit",
          message: "Create split room blocked: layout references need review.",
          objectType: "room",
          objectId: action.roomId,
          isGenerated: true
        })
      ]
    };
  }
  if (result.status === "blocked") {
    return {
      ...state,
      validationWarnings: [
        ...state.validationWarnings,
        buildLayoutValidationWarning({
          code: "split_room_creation_blocked",
          severity: "warning",
          source: "inspector_edit",
          message: `Create split room blocked: ${result.reason}`,
          objectType: "room",
          objectId: action.roomId,
          isGenerated: true
        })
      ]
    };
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: "split_bay",
    selectedObjectId: result.splitBayId,
    validationWarnings: state.validationWarnings,
    isDirty: true
  });
}

function convertSelectedRoomToSplitRoom(
  state: LayoutEditorState,
  action: Extract<LayoutEditorAction, { type: "convertSelectedRoomToSplitRoom" }>
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const parentRoom = state.editableLayout.rooms.find((room) => room.id === action.roomId);
  if (parentRoom == null) {
    return state;
  }
  if ((state.editableLayout.splitRooms ?? []).some((splitRoom) => splitRoom.parentRoomId === parentRoom.id)) {
    return state;
  }
  const splitRoom = convertSingleRoomToSplitRoom({
    room: parentRoom,
    splitRoomId: action.splitRoomId
  });
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      splitRooms: [
        ...(state.editableLayout.splitRooms ?? []),
        splitRoom
      ].sort((left, right) => left.splitRoomId.localeCompare(right.splitRoomId))
    },
    selectedObjectType: "split_room_parent",
    selectedObjectId: splitRoom.splitRoomId,
    validationWarnings: state.validationWarnings,
    isDirty: true
  });
}

function moveSelectedSplitRoomParent(
  state: LayoutEditorState,
  splitRoomId: string,
  delta: { deltaXFeet: number; deltaYFeet: number }
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const splitRoom = (state.editableLayout.splitRooms ?? []).find((candidate) => candidate.splitRoomId === splitRoomId);
  if (splitRoom == null) {
    return state;
  }
  const beforeRoom = state.editableLayout.rooms.find((room) => room.id === splitRoom.parentRoomId);
  if (beforeRoom == null) {
    return state;
  }
  const result = moveSplitRoomParent({
    parentRoom: beforeRoom,
    splitRoom,
    deltaXFeet: delta.deltaXFeet,
    deltaYFeet: delta.deltaYFeet
  });
  const movedLayout = {
    ...state.editableLayout,
    rooms: state.editableLayout.rooms.map((room) =>
      room.id === result.parentRoom.id ? result.parentRoom : room
    ),
    splitRooms: (state.editableLayout.splitRooms ?? []).map((candidate) =>
      candidate.splitRoomId === splitRoomId ? result.splitRoom : candidate
    )
  };
  const auditEntry = createRoomMoveAuditEntry({
    roomId: beforeRoom.id,
    before: { xFeet: beforeRoom.xFeet, yFeet: beforeRoom.yFeet },
    after: { xFeet: result.parentRoom.xFeet, yFeet: result.parentRoom.yFeet },
    deltaFeet: {
      deltaXFeet: result.parentRoom.xFeet - beforeRoom.xFeet,
      deltaYFeet: result.parentRoom.yFeet - beforeRoom.yFeet
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
        roomId: beforeRoom.id,
        boundsFeet: state.layoutBoundsFeet
      }),
      selectedObjectType: "split_room_parent",
      selectedObjectId: splitRoomId,
      auditEntry
    })
  );
}

function resizeSelectedSplitRoomParent(
  state: LayoutEditorState,
  splitRoomId: string,
  handle: RoomResizeHandle,
  delta: { deltaXFeet: number; deltaYFeet: number }
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const splitRoom = (state.editableLayout.splitRooms ?? []).find((candidate) => candidate.splitRoomId === splitRoomId);
  if (splitRoom == null) {
    return state;
  }
  const beforeRoom = state.editableLayout.rooms.find((room) => room.id === splitRoom.parentRoomId);
  if (beforeRoom == null) {
    return state;
  }
  const nextRect = nextResizeRect(beforeRoom, handle, delta);
  const result = resizeSplitRoomParent({
    parentRoom: { ...beforeRoom, xFeet: nextRect.xFeet, yFeet: nextRect.yFeet },
    splitRoom,
    widthFeet: nextRect.widthFeet,
    heightFeet: nextRect.heightFeet
  });
  const afterRoom = {
    ...result.parentRoom,
    xFeet: nextRect.xFeet,
    yFeet: nextRect.yFeet
  };
  if (roomRectEquals(beforeRoom, afterRoom)) {
    return state;
  }
  const resizedLayout = {
    ...state.editableLayout,
    rooms: state.editableLayout.rooms.map((room) =>
      room.id === afterRoom.id ? afterRoom : room
    ),
    splitRooms: (state.editableLayout.splitRooms ?? []).map((candidate) =>
      candidate.splitRoomId === splitRoomId ? result.splitRoom : candidate
    )
  };
  const auditEntry = createRoomResizeAuditEntry({
    roomId: beforeRoom.id,
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
          roomId: beforeRoom.id,
          boundsFeet: state.layoutBoundsFeet
        }),
        sources: ["resize", "door_sync"]
      }),
      selectedObjectType: "split_room_parent",
      selectedObjectId: splitRoomId,
      auditEntry
    })
  );
}

function editSplitRoomDividerOrientation(
  state: LayoutEditorState,
  splitRoomId: string,
  dividerOrientation: SplitRoomDividerOrientation
): LayoutEditorState {
  return updateSplitRoomInState(state, splitRoomId, (splitRoom) =>
    updateSplitRoomDividerOrientation(splitRoom, dividerOrientation)
  );
}

function editSplitRoomDividerRatio(
  state: LayoutEditorState,
  splitRoomId: string,
  dividerRatio: number
): LayoutEditorState {
  return updateSplitRoomInState(state, splitRoomId, (splitRoom) =>
    updateSplitRoomDividerRatio(splitRoom, dividerRatio)
  );
}

function resetSplitRoomDivider(
  state: LayoutEditorState,
  splitRoomId: string
): LayoutEditorState {
  return updateSplitRoomInState(state, splitRoomId, resetSplitRoomDividerToEven);
}

function updateSplitRoomInState(
  state: LayoutEditorState,
  splitRoomId: string,
  updater: (splitRoom: NonNullable<EditableLayoutGeometryContract["splitRooms"]>[number]) => NonNullable<EditableLayoutGeometryContract["splitRooms"]>[number]
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const splitRooms = state.editableLayout.splitRooms ?? [];
  const existing = splitRooms.find((splitRoom) => splitRoom.splitRoomId === splitRoomId);
  if (existing == null) {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: {
      ...state.editableLayout,
      splitRooms: splitRooms.map((splitRoom) =>
        splitRoom.splitRoomId === splitRoomId ? updater(splitRoom) : splitRoom
      )
    },
    selectedObjectType: "split_room_parent",
    selectedObjectId: splitRoomId,
    isDirty: true
  });
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

function unsplitSplitRoom(
  state: LayoutEditorState,
  splitBayId: string
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  const splitRoom = (state.editableLayout.splitRooms ?? []).find((candidate) => candidate.splitRoomId === splitBayId);
  if (splitRoom != null) {
    return withUndoHistory(state, {
      ...state,
      editableLayout: {
        ...state.editableLayout,
        splitRooms: (state.editableLayout.splitRooms ?? []).filter((candidate) => candidate.splitRoomId !== splitBayId)
      },
      selectedObjectType: "room",
      selectedObjectId: splitRoom.parentRoomId,
      isDirty: true
    });
  }
  const result = removeSplitRoomFromEditableLayout({
    layout: state.editableLayout,
    splitBayId,
    readOnly: state.readOnly
  });
  if (result.status === "blocked") {
    return state;
  }
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: "room",
    selectedObjectId: result.childRoomIds[0],
    isDirty: true
  });
}

function nextResizeRect(
  room: EditableRoomGeometry,
  handle: RoomResizeHandle,
  delta: { deltaXFeet: number; deltaYFeet: number }
): Pick<EditableRoomGeometry, "xFeet" | "yFeet" | "widthFeet" | "heightFeet"> {
  let xFeet = room.xFeet;
  let yFeet = room.yFeet;
  let widthFeet = room.widthFeet;
  let heightFeet = room.heightFeet;
  if (handle.includes("east")) {
    widthFeet += delta.deltaXFeet;
  }
  if (handle.includes("west")) {
    xFeet += delta.deltaXFeet;
    widthFeet -= delta.deltaXFeet;
  }
  if (handle.includes("south")) {
    heightFeet += delta.deltaYFeet;
  }
  if (handle.includes("north")) {
    yFeet += delta.deltaYFeet;
    heightFeet -= delta.deltaYFeet;
  }
  const minSize = 4;
  if (widthFeet < minSize) {
    if (handle.includes("west")) {
      xFeet -= minSize - widthFeet;
    }
    widthFeet = minSize;
  }
  if (heightFeet < minSize) {
    if (handle.includes("north")) {
      yFeet -= minSize - heightFeet;
    }
    heightFeet = minSize;
  }
  return { xFeet, yFeet, widthFeet, heightFeet };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
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

type DoorAuthoringSelection = {
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  selectedObjectId: string | null;
};

type DoorAuthoringMutationContext = {
  actionType: DoorAuthoringActionType;
  doorId?: string;
  roomId?: string;
  ownerId?: string;
  selectionAfterApplied?: DoorAuthoringSelection;
  clearDoorWarningIds?: readonly string[];
};

function applyDoorAuthoringMutation(
  state: LayoutEditorState,
  context: DoorAuthoringMutationContext,
  mutate: (layout: EditableLayoutGeometryContract) => SafeDoorAuthoringResult
): LayoutEditorState {
  if (state.editableLayout == null) {
    return appendDoorAuthoringWarning(state, {
      code: "door_authoring_layout_missing",
      severity: "blocking",
      actionType: context.actionType,
      message: "Door action blocked: editable layout is not loaded.",
      doorId: context.doorId,
      roomId: context.roomId,
      ownerId: context.ownerId
    });
  }

  let result: SafeDoorAuthoringResult;
  try {
    result = mutate(state.editableLayout);
  } catch (error) {
    return appendDoorAuthoringWarning(state, unexpectedDoorAuthoringWarning(context, error));
  }

  if (result.status === "blocked") {
    return appendDoorAuthoringWarning(state, result.warning);
  }

  const selection = context.selectionAfterApplied ?? selectionFromDoorAuthoringResult(result);
  const clearedWarnings = filterDoorAuthoringWarnings(
    state.validationWarnings,
    context.clearDoorWarningIds ?? []
  );
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: selection.selectedObjectType,
    selectedObjectId: selection.selectedObjectId,
    validationWarnings: [
      ...clearedWarnings,
      buildLayoutValidationWarning({
        code: "path_sync_stale_after_door_edit",
        severity: "warning",
        source: "path_sync",
        message: result.pathSyncWarning,
        objectType: selection.selectedObjectType,
        objectId: selection.selectedObjectId,
        isGenerated: true
      })
    ],
    isDirty: true
  });
}

function applySupportAccessMutation(
  state: LayoutEditorState,
  context: DoorAuthoringMutationContext & { blockedMessage: string },
  mutate: () => LayoutEditorState
): LayoutEditorState {
  if (state.editableLayout == null) {
    return appendDoorAuthoringWarning(state, {
      code: "door_authoring_layout_missing",
      severity: "blocking",
      actionType: context.actionType,
      message: "Door action blocked: editable layout is not loaded.",
      doorId: context.doorId,
      ownerId: context.ownerId
    });
  }
  if (state.readOnly) {
    return appendDoorAuthoringWarning(state, {
      code: "door_authoring_read_only",
      severity: "blocking",
      actionType: context.actionType,
      message: "Door action blocked: read-only plans cannot be edited.",
      doorId: context.doorId,
      ownerId: context.ownerId
    });
  }

  try {
    const nextState = mutate();
    if (nextState === state) {
      return appendDoorAuthoringWarning(state, {
        code: "door_authoring_action_blocked",
        severity: "blocking",
        actionType: context.actionType,
        message: context.blockedMessage,
        doorId: context.doorId,
        roomId: context.roomId,
        ownerId: context.ownerId
      });
    }
    return nextState;
  } catch (error) {
    return appendDoorAuthoringWarning(state, unexpectedDoorAuthoringWarning(context, error));
  }
}

function appendDoorAuthoringWarning(
  state: LayoutEditorState,
  warning: DoorAuthoringWarning
): LayoutEditorState {
  return {
    ...state,
    validationWarnings: [
      ...state.validationWarnings,
      buildDoorAuthoringValidationWarning(warning)
    ]
  };
}

function unexpectedDoorAuthoringWarning(
  context: DoorAuthoringMutationContext,
  error: unknown
): DoorAuthoringWarning {
  return {
    code: "door_authoring_unexpected_blocked",
    severity: "blocking",
    actionType: context.actionType,
    message: `Door action blocked by editor guard: ${messageFromUnknownError(error)}`,
    doorId: context.doorId,
    roomId: context.roomId,
    ownerId: context.ownerId
  };
}

function messageFromUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }
  return "previous layout was preserved";
}

function selectionFromDoorAuthoringResult(result: Extract<SafeDoorAuthoringResult, { status: "applied" }>): DoorAuthoringSelection {
  if (result.selectedDoorId == null) {
    return { selectedObjectType: null, selectedObjectId: null };
  }
  return { selectedObjectType: "door", selectedObjectId: result.selectedDoorId };
}

function selectionAfterDoorDelete(state: LayoutEditorState, doorId: string): DoorAuthoringSelection | undefined {
  const door = state.editableLayout?.doors.find((candidate) => candidate.id === doorId);
  if (door == null || door.ownerKind !== "room") {
    return undefined;
  }
  const ownerRoomExists = state.editableLayout?.rooms.some((room) => room.id === door.ownerId) === true;
  if (!ownerRoomExists) {
    return undefined;
  }
  return { selectedObjectType: "room", selectedObjectId: door.ownerId };
}

function filterDoorAuthoringWarnings(
  warnings: readonly LayoutEditorValidationWarning[],
  doorIds: readonly string[]
): LayoutEditorValidationWarning[] {
  if (doorIds.length === 0) {
    return [...warnings];
  }
  const removedDoorIds = new Set(doorIds);
  return warnings
    .filter((warning) => warning.objectType !== "door" || warning.objectId == null || !removedDoorIds.has(warning.objectId))
    .filter((warning) => warning.relatedObjectType !== "door" || warning.relatedObjectId == null || !removedDoorIds.has(warning.relatedObjectId));
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

function editSelectedHallwayDimensions(
  state: LayoutEditorState,
  hallwayId: string,
  dimensions: RoomInspectorDimensionChanges
): LayoutEditorState {
  if (state.readOnly || state.editableLayout == null) {
    return state;
  }
  if (state.selectedObjectType !== "hallway" || state.selectedObjectId !== hallwayId) {
    return state;
  }

  const beforeHallway = state.editableLayout.hallways.find((hallway) => hallway.id === hallwayId);
  if (beforeHallway == null) {
    throw new Error(`unknown hallway: ${hallwayId}`);
  }

  const editedLayout = editSelectedHallwayDimensionsInLayout({
    layout: state.editableLayout,
    selectedObjectType: state.selectedObjectType,
    selectedObjectId: state.selectedObjectId,
    hallwayId,
    changes: dimensions,
    snapMode: state.snapMode
  });
  const afterHallway = editedLayout.hallways.find((hallway) => hallway.id === hallwayId);
  if (afterHallway == null) {
    throw new Error(`unknown hallway: ${hallwayId}`);
  }
  if (roomRectEquals(beforeHallway, afterHallway)) {
    return state;
  }

  return withUndoHistory(state, {
    ...state,
    editableLayout: editedLayout,
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
    throw new Error("objectType must be room, door, support_access, station, hallway, zone, split_room_parent, bed_position, outer_wall, or split_bay");
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
