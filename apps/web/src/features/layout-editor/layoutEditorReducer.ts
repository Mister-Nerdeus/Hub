import {
  addDoorToRoom,
  addRoomToEditableLayout,
  assignDoorToRoom,
  authoringRoomTypeToEditableRoomType,
  deleteDoor,
  duplicateLayoutObject,
  generateAutoHallways,
  moveDoor,
  validateAuthoringRoomType,
  type AuthoringRoomType,
  type EditableDoorWall,
  type EditableLayoutGeometryContract,
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
import {
  buildLayoutValidationWarning,
  validateLayoutValidationWarning
} from "./layoutValidationWarningContract";
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
  | { type: "moveDoor"; doorId: string; wall: EditableDoorWall; offsetFeet: number }
  | { type: "doorToolMove"; doorId: string; wall: EditableDoorWall; offsetFeet: number }
  | { type: "deleteDoor"; doorId: string }
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
      return applyDoorAuthoring(
        state,
        deleteDoor({
          layout: requireEditableLayout(state),
          readOnly: state.readOnly,
          doorId: action.doorId
        })
      );
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
      doors: state.editableLayout.doors.filter((door) => !removedDoorIds.has(door.id))
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
  return withUndoHistory(state, {
    ...state,
    editableLayout: result.layout,
    selectedObjectType: result.objectType,
    selectedObjectId: result.duplicatedObjectId,
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
