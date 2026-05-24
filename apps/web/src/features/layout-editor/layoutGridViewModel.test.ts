import { buildLayoutGridViewModel } from "./layoutGridViewModel";
import {
  DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT,
  DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS,
  DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET
} from "./layoutWorkspaceConfig";

const grid = buildLayoutGridViewModel({
  workspaceBoundsFeet: DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET,
  viewportSizePixels: DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS,
  viewport: {
    pixelsPerFoot: DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT,
    zoom: 1,
    panXFeet: 0,
    panYFeet: 0
  },
  gridSpacingFeet: 1,
  majorEveryFeet: 5
});

if (
  DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET.widthFeet < 180 ||
  DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET.heightFeet < 120
) {
  throw new Error("default layout workspace must be at least 180 ft by 120 ft");
}

if (grid.viewBox !== "0 0 1080 720") {
  throw new Error("grid view model must expose a pixel-based SVG viewBox");
}

if (grid.widthFeet !== 180 || grid.heightFeet !== 120) {
  throw new Error("grid view model must preserve workspace feet independently from viewport pixels");
}

if (grid.widthPixels !== 1080 || grid.heightPixels !== 720) {
  throw new Error("grid view model dimensions must reflect the visible pixel viewport");
}

if (
  grid.visibleBoundsFeet.xFeet !== 0 ||
  grid.visibleBoundsFeet.yFeet !== 0 ||
  grid.visibleBoundsFeet.widthFeet !== 90 ||
  grid.visibleBoundsFeet.heightFeet !== 60
) {
  throw new Error("zoom 1.0 grid must be generated from the visible workspace intersection");
}

if (grid.verticalLines.length !== 91 || grid.horizontalLines.length !== 61) {
  throw new Error("minor grid must remain 1 ft within the visible workspace");
}

const xFifty = grid.verticalLines.find((line) => line.valueFeet === 50);
if (xFifty == null || !xFifty.isMajor || xFifty.label !== "50 ft") {
  throw new Error("major grid must remain 5 ft with feet-based labels");
}

const zoomHalfGrid = buildLayoutGridViewModel({
  workspaceBoundsFeet: DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET,
  viewportSizePixels: DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS,
  viewport: {
    pixelsPerFoot: DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT,
    zoom: 0.5,
    panXFeet: 0,
    panYFeet: 0
  },
  gridSpacingFeet: 1,
  majorEveryFeet: 5
});

if (
  zoomHalfGrid.visibleBoundsFeet.widthFeet !== 180 ||
  zoomHalfGrid.visibleBoundsFeet.heightFeet !== 120 ||
  zoomHalfGrid.verticalLines.at(-1)?.valueFeet !== 180 ||
  zoomHalfGrid.horizontalLines.at(-1)?.valueFeet !== 120
) {
  throw new Error("zoom 0.5 grid must reveal the full 180 ft by 120 ft workspace");
}

const sourceViewport = {
  pixelsPerFoot: DEFAULT_LAYOUT_STAGE_PIXELS_PER_FOOT,
  zoom: 1,
  panXFeet: 30,
  panYFeet: 20
};
const sourceSnapshot = JSON.stringify(sourceViewport);
const pannedGrid = buildLayoutGridViewModel({
  workspaceBoundsFeet: DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET,
  viewportSizePixels: DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS,
  viewport: sourceViewport,
  gridSpacingFeet: 1,
  majorEveryFeet: 5
});

if (JSON.stringify(sourceViewport) !== sourceSnapshot) {
  throw new Error("grid generation must not mutate the source viewport");
}

if (
  pannedGrid.visibleBoundsFeet.xFeet !== 30 ||
  pannedGrid.visibleBoundsFeet.yFeet !== 20 ||
  pannedGrid.visibleBoundsFeet.widthFeet !== 90 ||
  pannedGrid.visibleBoundsFeet.heightFeet !== 60
) {
  throw new Error("panned grid must use the visible viewport intersection");
}

try {
  buildLayoutGridViewModel({
    workspaceBoundsFeet: { ...DEFAULT_LAYOUT_WORKSPACE_BOUNDS_FEET, widthFeet: 0 },
    viewportSizePixels: DEFAULT_LAYOUT_STAGE_VIEWPORT_PIXELS,
    viewport: {
      pixelsPerFoot: 10,
      zoom: 1,
      panXFeet: 0,
      panYFeet: 0
    }
  });
  throw new Error("grid view model must reject invalid workspace dimensions");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("workspaceBoundsFeet.widthFeet")) {
    throw error;
  }
}
