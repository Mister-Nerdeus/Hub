import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import {
  createLayoutEditorState,
  isLayoutEditorSelectableObjectType,
  isLayoutEditorSnapMode,
  normalizeLayoutEditorViewport,
  type LayoutEditorSelectableObjectType,
  type LayoutEditorSnapMode,
  type LayoutEditorState,
  type LayoutEditorValidationWarning,
  type LayoutEditorViewport
} from "./layoutEditorState";

export type LayoutEditorAction =
  | { type: "loadLayout"; layout: EditableLayoutGeometryContract }
  | {
      type: "selectObject";
      objectType: LayoutEditorSelectableObjectType;
      objectId: string;
    }
  | { type: "clearSelection" }
  | { type: "setViewport"; viewport: LayoutEditorViewport }
  | { type: "setSnapMode"; snapMode: LayoutEditorSnapMode }
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
        selectedObjectId: null,
        selectedObjectType: null,
        validationWarnings: [],
        isDirty: false
      };
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
    case "setSnapMode":
      if (!isLayoutEditorSnapMode(action.snapMode)) {
        throw new Error("snapMode must be default or fine");
      }
      return {
        ...state,
        snapMode: action.snapMode
      };
    case "setValidationWarnings":
      if (!Array.isArray(action.validationWarnings)) {
        throw new Error("validationWarnings must be an array");
      }
      return {
        ...state,
        validationWarnings: action.validationWarnings.map((warning) => ({ ...warning }))
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
  if (state.editableLayout == null || !layoutObjectExists(state.editableLayout, objectType, objectId)) {
    return state;
  }

  return {
    ...state,
    selectedObjectId: objectId,
    selectedObjectType: objectType
  };
}

function layoutObjectExists(
  layout: EditableLayoutGeometryContract,
  objectType: LayoutEditorSelectableObjectType,
  objectId: string
): boolean {
  switch (objectType) {
    case "room":
      return layout.rooms.some((object) => object.id === objectId);
    case "door":
      return layout.doors.some((object) => object.id === objectId);
    case "station":
      return layout.stations.some((object) => object.id === objectId);
    case "hallway":
      return layout.hallways.some((object) => object.id === objectId);
    case "zone":
      return layout.zones.some((object) => object.id === objectId);
  }
}
