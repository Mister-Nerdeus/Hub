import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import type { LayoutViewportTransform } from "./layoutCoordinateSystem";
import {
  isLayoutSelectionObjectType,
  LAYOUT_SELECTION_OBJECT_TYPES,
  type LayoutSelectionObjectType
} from "./layoutSelectionModel";

export const LAYOUT_EDITOR_SELECTABLE_OBJECT_TYPES = LAYOUT_SELECTION_OBJECT_TYPES;

export const LAYOUT_EDITOR_SNAP_MODES = ["default", "fine"] as const;

export type LayoutEditorSelectableObjectType = LayoutSelectionObjectType;

export type LayoutEditorSnapMode = (typeof LAYOUT_EDITOR_SNAP_MODES)[number];

export type LayoutEditorViewport = Required<LayoutViewportTransform>;

export type LayoutEditorValidationWarning = {
  code: string;
  message: string;
  objectType?: LayoutEditorSelectableObjectType;
  objectId?: string;
};

export type LayoutEditorState = {
  editableLayout: EditableLayoutGeometryContract | null;
  selectedObjectId: string | null;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  viewport: LayoutEditorViewport;
  snapMode: LayoutEditorSnapMode;
  validationWarnings: readonly LayoutEditorValidationWarning[];
  isDirty: boolean;
};

export const DEFAULT_LAYOUT_EDITOR_VIEWPORT: LayoutEditorViewport = {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
};

export function createLayoutEditorState(
  overrides: Partial<LayoutEditorState> = {}
): LayoutEditorState {
  const selectedObjectId = overrides.selectedObjectId ?? null;
  const selectedObjectType = overrides.selectedObjectType ?? null;
  if ((selectedObjectId == null) !== (selectedObjectType == null)) {
    throw new Error("selectedObjectId and selectedObjectType must both be set or both be null");
  }
  if (selectedObjectType != null && !isLayoutEditorSelectableObjectType(selectedObjectType)) {
    throw new Error("selectedObjectType must be room, door, station, hallway, or zone");
  }

  const snapMode = overrides.snapMode ?? "default";
  if (!isLayoutEditorSnapMode(snapMode)) {
    throw new Error("snapMode must be default or fine");
  }

  return {
    editableLayout: overrides.editableLayout ?? null,
    selectedObjectId,
    selectedObjectType,
    viewport: normalizeLayoutEditorViewport(overrides.viewport ?? DEFAULT_LAYOUT_EDITOR_VIEWPORT),
    snapMode,
    validationWarnings: [...(overrides.validationWarnings ?? [])],
    isDirty: overrides.isDirty ?? false
  };
}

export function normalizeLayoutEditorViewport(
  viewport: LayoutViewportTransform
): LayoutEditorViewport {
  return {
    pixelsPerFoot: requirePositive(viewport.pixelsPerFoot, "viewport.pixelsPerFoot"),
    zoom: requirePositive(viewport.zoom, "viewport.zoom"),
    panXFeet: requireFinite(viewport.panXFeet ?? 0, "viewport.panXFeet"),
    panYFeet: requireFinite(viewport.panYFeet ?? 0, "viewport.panYFeet")
  };
}

export function isLayoutEditorSnapMode(value: unknown): value is LayoutEditorSnapMode {
  return typeof value === "string" && LAYOUT_EDITOR_SNAP_MODES.includes(value as LayoutEditorSnapMode);
}

export function isLayoutEditorSelectableObjectType(
  value: unknown
): value is LayoutEditorSelectableObjectType {
  return isLayoutSelectionObjectType(value);
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}
