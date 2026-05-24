import {
  DEFAULT_LAYOUT_EDITOR_VIEWPORT,
  normalizeLayoutEditorViewport,
  type LayoutEditorViewport
} from "./layoutEditorState";

export const MIN_LAYOUT_EDITOR_ZOOM = 0.5;
export const MAX_LAYOUT_EDITOR_ZOOM = 3;
export const DEFAULT_LAYOUT_EDITOR_ZOOM_STEP = 0.25;
export const DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET = 5;

export type LayoutViewportZoomDirection = "in" | "out";

export type LayoutViewportPanDeltaFeet = {
  deltaXFeet: number;
  deltaYFeet: number;
};

export function zoomLayoutViewport(
  viewport: LayoutEditorViewport,
  direction: LayoutViewportZoomDirection,
  step = DEFAULT_LAYOUT_EDITOR_ZOOM_STEP
): LayoutEditorViewport {
  const normalized = normalizeLayoutEditorViewport(viewport);
  const zoomStep = requirePositive(step, "zoomStep");
  const signedStep = direction === "in" ? zoomStep : direction === "out" ? -zoomStep : null;
  if (signedStep == null) {
    throw new Error("zoom direction must be in or out");
  }

  return {
    ...normalized,
    zoom: clampZoom(roundViewportValue(normalized.zoom + signedStep))
  };
}

export function panLayoutViewport(
  viewport: LayoutEditorViewport,
  delta: LayoutViewportPanDeltaFeet
): LayoutEditorViewport {
  const normalized = normalizeLayoutEditorViewport(viewport);
  return {
    ...normalized,
    panXFeet: roundViewportValue(
      normalized.panXFeet + requireFinite(delta.deltaXFeet, "deltaXFeet")
    ),
    panYFeet: roundViewportValue(
      normalized.panYFeet + requireFinite(delta.deltaYFeet, "deltaYFeet")
    )
  };
}

export function resetLayoutViewport(): LayoutEditorViewport {
  return { ...DEFAULT_LAYOUT_EDITOR_VIEWPORT };
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_LAYOUT_EDITOR_ZOOM, Math.max(MIN_LAYOUT_EDITOR_ZOOM, zoom));
}

function roundViewportValue(value: number): number {
  return Number(value.toFixed(6));
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
