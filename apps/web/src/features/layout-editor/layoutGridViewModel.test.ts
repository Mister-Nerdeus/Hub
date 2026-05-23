import { buildLayoutGridViewModel } from "./layoutGridViewModel";

const grid = buildLayoutGridViewModel({
  widthFeet: 10,
  heightFeet: 6,
  viewport: {
    pixelsPerFoot: 10,
    zoom: 1,
    panXFeet: 0,
    panYFeet: 0
  },
  gridSpacingFeet: 2,
  majorEveryFeet: 4
});

if (grid.widthPixels !== 100 || grid.heightPixels !== 60) {
  throw new Error("grid view model must derive pixel frame from feet-to-pixel transform");
}

if (grid.viewBox !== "0 0 100 60") {
  throw new Error("grid view model must expose a deterministic SVG viewBox");
}

if (grid.verticalLines.length !== 6 || grid.horizontalLines.length !== 4) {
  throw new Error("grid view model must include deterministic vertical and horizontal foot lines");
}

const xFour = grid.verticalLines.find((line) => line.valueFeet === 4);
if (xFour == null || !xFour.isMajor || xFour.x1Pixels !== 40 || xFour.y2Pixels !== 60) {
  throw new Error("major vertical grid lines must use transformed pixel coordinates");
}

const ySix = grid.horizontalLines.find((line) => line.valueFeet === 6);
if (ySix == null || ySix.y1Pixels !== 60 || ySix.x2Pixels !== 100) {
  throw new Error("horizontal grid must include the layout bottom edge");
}

const transformedGrid = buildLayoutGridViewModel({
  widthFeet: 8,
  heightFeet: 4,
  viewport: {
    pixelsPerFoot: 12,
    zoom: 2,
    panXFeet: 1,
    panYFeet: 1
  },
  gridSpacingFeet: 1,
  majorEveryFeet: 4
});

if (transformedGrid.viewBox !== "-24 -24 192 96") {
  throw new Error("grid view model must preserve viewport pan and zoom in SVG coordinates");
}

try {
  buildLayoutGridViewModel({
    widthFeet: 0,
    heightFeet: 4,
    viewport: {
      pixelsPerFoot: 10,
      zoom: 1,
      panXFeet: 0,
      panYFeet: 0
    }
  });
  throw new Error("grid view model must reject invalid dimensions");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("widthFeet")) {
    throw error;
  }
}
