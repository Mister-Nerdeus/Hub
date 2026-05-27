import type { LayoutEditorViewport } from "../layoutEditorState";
import {
  applyCanvasWheelNavigation,
  isZoomWithinCanvasWheelBounds
} from "../layoutCanvasWheelNavigation";
import {
  MAX_LAYOUT_EDITOR_ZOOM,
  MIN_LAYOUT_EDITOR_ZOOM
} from "../layoutViewportControls";

const viewport: LayoutEditorViewport = {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
};

const pan = applyCanvasWheelNavigation({
  deltaX: 24,
  deltaY: 12,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  viewport
});
if (pan.type !== "pan" || pan.deltaXFeet !== 2 || pan.deltaYFeet !== 1) {
  throw new Error("plain wheel should pan the canvas in feet");
}

const shiftPan = applyCanvasWheelNavigation({
  deltaX: 0,
  deltaY: 24,
  shiftKey: true,
  ctrlKey: false,
  metaKey: false,
  viewport
});
if (shiftPan.type !== "pan" || shiftPan.deltaXFeet !== 2 || shiftPan.deltaYFeet !== 0) {
  throw new Error("shift wheel should favor horizontal pan");
}

const zoomIn = applyCanvasWheelNavigation({
  deltaX: 0,
  deltaY: -100,
  shiftKey: false,
  ctrlKey: true,
  metaKey: false,
  viewport
});
if (zoomIn.type !== "zoom" || zoomIn.direction !== "in" || zoomIn.nextZoom !== 1.25) {
  throw new Error("ctrl wheel up should zoom in");
}

const zoomOut = applyCanvasWheelNavigation({
  deltaX: 0,
  deltaY: 100,
  shiftKey: false,
  ctrlKey: false,
  metaKey: true,
  viewport
});
if (zoomOut.type !== "zoom" || zoomOut.direction !== "out" || zoomOut.nextZoom !== 0.75) {
  throw new Error("cmd wheel down should zoom out");
}

if (!isZoomWithinCanvasWheelBounds(MIN_LAYOUT_EDITOR_ZOOM)) {
  throw new Error("minimum zoom should be within bounds");
}
if (!isZoomWithinCanvasWheelBounds(MAX_LAYOUT_EDITOR_ZOOM)) {
  throw new Error("maximum zoom should be within bounds");
}
if (isZoomWithinCanvasWheelBounds(MAX_LAYOUT_EDITOR_ZOOM + 0.25)) {
  throw new Error("above maximum zoom should be outside bounds");
}

try {
  applyCanvasWheelNavigation({
    deltaX: Number.NaN,
    deltaY: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    viewport
  });
  throw new Error("invalid wheel delta should fail");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("wheel delta")) {
    throw error;
  }
}
