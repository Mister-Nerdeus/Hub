import { pixelsToFeet, feetToPixels } from "./layoutCoordinateSystem";
import {
  DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET,
  MAX_LAYOUT_EDITOR_ZOOM,
  MIN_LAYOUT_EDITOR_ZOOM,
  panLayoutViewport,
  resetLayoutViewport,
  zoomLayoutViewport
} from "./layoutViewportControls";
import type { LayoutEditorViewport } from "./layoutEditorState";

const viewport: LayoutEditorViewport = {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
};

const zoomedIn = zoomLayoutViewport(viewport, "in");
if (zoomedIn.zoom !== 1.25 || viewport.zoom !== 1) {
  throw new Error("zoom in must update viewport zoom without mutating the source viewport");
}

const zoomedOut = zoomLayoutViewport(zoomedIn, "out");
if (zoomedOut.zoom !== 1) {
  throw new Error("zoom out must reverse the default zoom step");
}

let clampedMax = viewport;
for (let index = 0; index < 20; index += 1) {
  clampedMax = zoomLayoutViewport(clampedMax, "in");
}
if (clampedMax.zoom !== MAX_LAYOUT_EDITOR_ZOOM) {
  throw new Error("zoom in must clamp to max zoom");
}

let clampedMin = viewport;
for (let index = 0; index < 20; index += 1) {
  clampedMin = zoomLayoutViewport(clampedMin, "out");
}
if (clampedMin.zoom !== MIN_LAYOUT_EDITOR_ZOOM) {
  throw new Error("zoom out must clamp to min zoom");
}

const panned = panLayoutViewport(viewport, {
  deltaXFeet: DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET,
  deltaYFeet: -DEFAULT_LAYOUT_EDITOR_PAN_STEP_FEET
});
if (panned.panXFeet !== 5 || panned.panYFeet !== -5) {
  throw new Error("pan offsets must be stored in feet");
}

const pointFeet = { xFeet: 14, yFeet: 9 };
const roundtrip = pixelsToFeet(feetToPixels(pointFeet, panned), panned);
if (roundtrip.xFeet !== pointFeet.xFeet || roundtrip.yFeet !== pointFeet.yFeet) {
  throw new Error("zoom/pan viewport must preserve coordinate roundtrip");
}

const reset = resetLayoutViewport();
if (reset.zoom !== 1 || reset.panXFeet !== 0 || reset.panYFeet !== 0) {
  throw new Error("reset viewport must restore default zoom and pan");
}

try {
  zoomLayoutViewport(viewport, "sideways" as never);
  throw new Error("invalid zoom direction must fail");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("zoom direction")) {
    throw error;
  }
}

try {
  panLayoutViewport(viewport, { deltaXFeet: Number.NaN, deltaYFeet: 0 });
  throw new Error("invalid pan delta must fail");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("deltaXFeet")) {
    throw error;
  }
}
