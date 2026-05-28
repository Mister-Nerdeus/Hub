import {
  CANVAS_PAN_ACTIVATION_THRESHOLD_PX,
  canStartCanvasPan,
  canvasPointerDeltaToPanFeet,
  hasCanvasPanPassedMovementThreshold
} from "../layoutCanvasPan";

if (CANVAS_PAN_ACTIVATION_THRESHOLD_PX < 3 || CANVAS_PAN_ACTIVATION_THRESHOLD_PX > 5) {
  throw new Error("background pan activation threshold should remain 3-5 px");
}

if (hasCanvasPanPassedMovementThreshold(1, 1)) {
  throw new Error("tiny movement should not activate background pan");
}

if (!hasCanvasPanPassedMovementThreshold(4, 0)) {
  throw new Error("threshold crossing should activate background pan");
}

const thresholdDelta = canvasPointerDeltaToPanFeet({
  deltaClientX: 8,
  deltaClientY: -4,
  pixelsPerFoot: 8,
  zoom: 1
});
if (thresholdDelta.deltaXFeet !== -1 || thresholdDelta.deltaYFeet !== 0.5) {
  throw new Error("threshold-crossed drag should pan with normal delta conversion");
}

if (canStartCanvasPan({ targetKind: "room" }) || canStartCanvasPan({ targetKind: "door" }) || canStartCanvasPan({ targetKind: "resize-handle" })) {
  throw new Error("room, door, and handle interactions must not start background pan");
}

if (!canStartCanvasPan({ targetKind: "background" })) {
  throw new Error("background pan remains available, including read-only floorplan viewing");
}
