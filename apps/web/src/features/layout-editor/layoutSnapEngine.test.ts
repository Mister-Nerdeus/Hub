import {
  DEFAULT_SNAP_SIZE_FEET,
  FINE_SNAP_SIZE_FEET,
  snapFeet,
  snapMoveDeltaFeet,
  snapPointFeet,
  snapRectFeet,
  snapResizeDeltaFeet,
  snapSizeFeetForMode
} from "./layoutSnapEngine";

if (DEFAULT_SNAP_SIZE_FEET !== 1) {
  throw new Error("default snap size must be 1 foot");
}

if (FINE_SNAP_SIZE_FEET !== 0.5) {
  throw new Error("fine snap size must be 0.5 foot");
}

if (snapSizeFeetForMode("default") !== 1 || snapSizeFeetForMode("fine") !== 0.5) {
  throw new Error("snap modes must resolve to deterministic snap sizes");
}

if (snapFeet(2.49) !== 2 || snapFeet(2.5) !== 3) {
  throw new Error("default snap must round positive feet deterministically");
}

if (snapFeet(2.24, FINE_SNAP_SIZE_FEET) !== 2 || snapFeet(2.25, FINE_SNAP_SIZE_FEET) !== 2.5) {
  throw new Error("fine snap must round fractional feet deterministically");
}

if (snapFeet(-2.24, FINE_SNAP_SIZE_FEET) !== -2 || snapFeet(-2.25, FINE_SNAP_SIZE_FEET) !== -2.5) {
  throw new Error("negative feet must snap deterministically");
}

const pointFeet = { xFeet: 2.25, yFeet: -2.25 };
const pointCopy = { ...pointFeet };
const snappedPoint = snapPointFeet(pointFeet, FINE_SNAP_SIZE_FEET);
if (snappedPoint.xFeet !== 2.5 || snappedPoint.yFeet !== -2.5) {
  throw new Error("snapPointFeet must snap x/y feet");
}
if (JSON.stringify(pointFeet) !== JSON.stringify(pointCopy)) {
  throw new Error("snapPointFeet must not mutate source points");
}

const rectFeet = { xFeet: 1.25, yFeet: -1.25, widthFeet: 10.24, heightFeet: 8.75 };
const rectCopy = { ...rectFeet };
const snappedRect = snapRectFeet(rectFeet, FINE_SNAP_SIZE_FEET);
if (
  snappedRect.xFeet !== 1.5 ||
  snappedRect.yFeet !== -1.5 ||
  snappedRect.widthFeet !== 10 ||
  snappedRect.heightFeet !== 9
) {
  throw new Error("snapRectFeet must snap positions and dimensions");
}
if (JSON.stringify(rectFeet) !== JSON.stringify(rectCopy)) {
  throw new Error("snapRectFeet must not mutate source rectangles");
}

const snappedDelta = snapResizeDeltaFeet({ deltaWidthFeet: 1.24, deltaHeightFeet: -1.25 }, FINE_SNAP_SIZE_FEET);
if (snappedDelta.deltaWidthFeet !== 1 || snappedDelta.deltaHeightFeet !== -1.5) {
  throw new Error("resize deltas must snap deterministically");
}

const moveDelta = { deltaXFeet: 1.24, deltaYFeet: -1.25 };
const moveDeltaCopy = { ...moveDelta };
const snappedMoveDelta = snapMoveDeltaFeet(moveDelta, FINE_SNAP_SIZE_FEET);
if (snappedMoveDelta.deltaXFeet !== 1 || snappedMoveDelta.deltaYFeet !== -1.5) {
  throw new Error("move deltas must snap deterministically");
}
if (JSON.stringify(moveDelta) !== JSON.stringify(moveDeltaCopy)) {
  throw new Error("snapMoveDeltaFeet must not mutate source deltas");
}

try {
  snapFeet(1, 0);
  throw new Error("snapFeet must reject invalid snap sizes");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("snapSizeFeet")) {
    throw error;
  }
}
