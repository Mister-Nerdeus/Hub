import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

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
  resetLayoutViewport,
  zoomLayoutViewport,
  type LayoutViewportZoomDirection
} from "./layoutViewportControls";
import {
  createRoomDimensionEditAuditEntry,
  createRoomMoveAuditEntry,
  createRoomResizeAuditEntry
} from "./layoutEditAuditTrail";
import { applyLayoutEditEffects } from "./layoutEditEffects";
import { selectEditableLayoutObject } from "./layoutSelectionModel";
import { validateLayoutValidationWarning } from "./layoutValidationWarningContract";
import {
  recalculateWarningsForRoom,
  replaceGeneratedWarningsBySources
} from "./layoutWarningRecalculation";
import { moveRoomByDeltaFeet } from "./roomDragMove";
import {
  editSelectedRoomDimensionsInLayout,
  type RoomInspectorDimensionChanges
} from "./roomInspectorDimensionEdit";
import { resizeSelectedRoomInLayout } from "./roomResizeInteraction";
import type { RoomResizeHandle } from "./roomResizeHandlesViewModel";
import { validateRoomResizeWarnings } from "./roomResizeValidation";
import {
  createLayoutUndoRedoHistory,
  createLayoutUndoRedoSnapshot,
  pushLayoutUndoRedoSnapshot,
  redoLayoutEditHistory,
  undoLayoutEditHistory,
  type LayoutUndoRedoSnapshot
} from "./layoutUndoRedoHistory";

export type LayoutEditorAction =
  | { type: "loadLayout"; layout: EditableLayoutGeometryContract }
  | { type: "loadActiveFloorplan"; floorplan: LayoutEditorFloorplanInput }
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
  | { type: "setSnapMode"; snapMode: LayoutEditorSnapMode }
  | { type: "moveRoom"; roomId: string; deltaXFeet: number; deltaYFeet: number }
  | {
      type: "resizeRoom";
      roomId: string;
      handle: RoomResizeHandle;
      deltaXFeet: number;
      deltaYFeet: number;
    }
  | { type: "editSelectedRoomDimensions"; dimensions: RoomInspectorDimensionChanges }
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
    case "resizeRoom":
      return resizeRoom(state, action.roomId, action.handle, {
        deltaXFeet: action.deltaXFeet,
        deltaYFeet: action.deltaYFeet
      });
    case "editSelectedRoomDimensions":
      return editSelectedRoomDimensions(state, action.dimensions);
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
    throw new Error("objectType must be room, door, station, hallway, or zone");
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
