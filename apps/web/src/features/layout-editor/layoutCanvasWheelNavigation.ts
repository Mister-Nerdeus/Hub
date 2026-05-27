import {
  MAX_LAYOUT_EDITOR_ZOOM,
  MIN_LAYOUT_EDITOR_ZOOM,
  zoomLayoutViewport
} from "./layoutViewportControls";
import type { LayoutEditorViewport } from "./layoutEditorState";

export type CanvasWheelNavigationInput = {
  deltaX: number;
  deltaY: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  viewport: LayoutEditorViewport;
};

export type CanvasWheelNavigationAction =
  | { type: "pan"; deltaXFeet: number; deltaYFeet: number }
  | { type: "zoom"; direction: "in" | "out"; nextZoom: number };

export function applyCanvasWheelNavigation({
  deltaX,
  deltaY,
  shiftKey,
  ctrlKey,
  metaKey,
  viewport
}: CanvasWheelNavigationInput): CanvasWheelNavigationAction {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
    throw new Error("wheel delta must be finite");
  }
  const zoomRequested = ctrlKey || metaKey;
  if (zoomRequested) {
    const direction = deltaY <= 0 ? "in" : "out";
    return {
      type: "zoom",
      direction,
      nextZoom: zoomLayoutViewport(viewport, direction).zoom
    };
  }

  const denominator = requirePositive(viewport.pixelsPerFoot, "pixelsPerFoot") * requirePositive(viewport.zoom, "zoom");
  const horizontalPixels = shiftKey && deltaX === 0 ? deltaY : deltaX;
  const verticalPixels = shiftKey ? 0 : deltaY;
  return {
    type: "pan",
    deltaXFeet: roundWheelFeet(horizontalPixels / denominator),
    deltaYFeet: roundWheelFeet(verticalPixels / denominator)
  };
}

export function isZoomWithinCanvasWheelBounds(zoom: number): boolean {
  return zoom >= MIN_LAYOUT_EDITOR_ZOOM && zoom <= MAX_LAYOUT_EDITOR_ZOOM;
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
  return value;
}

function roundWheelFeet(value: number): number {
  return Number(value.toFixed(6));
}
