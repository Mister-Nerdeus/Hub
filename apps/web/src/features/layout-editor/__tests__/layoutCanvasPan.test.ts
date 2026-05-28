import {
  canStartCanvasPan,
  canvasPointerDeltaToPanFeet,
  type CanvasPanTargetKind
} from "../layoutCanvasPan";

if (!canStartCanvasPan({ targetKind: "background" })) {
  throw new Error("background target should start canvas panning");
}

if (!canStartCanvasPan({ targetKind: "hallway" }) || !canStartCanvasPan({ targetKind: "zone" })) {
  throw new Error("hallway and zone targets should start canvas panning");
}

for (const targetKind of [
  "room",
  "door",
  "resize-handle",
  "station",
  "popup",
  "toolbar",
  "selected-object"
] satisfies CanvasPanTargetKind[]) {
  if (canStartCanvasPan({ targetKind })) {
    throw new Error(`${targetKind} should not start canvas panning`);
  }
}

const panDelta = canvasPointerDeltaToPanFeet({
  deltaClientX: 24,
  deltaClientY: -12,
  pixelsPerFoot: 12,
  zoom: 2
});
if (panDelta.deltaXFeet !== -1 || panDelta.deltaYFeet !== 0.5) {
  throw new Error("pointer delta should convert to inverse pan feet using zoom");
}

for (const invalid of [
  { pixelsPerFoot: 0, zoom: 1 },
  { pixelsPerFoot: 12, zoom: 0 },
  { pixelsPerFoot: Number.NaN, zoom: 1 }
]) {
  try {
    canvasPointerDeltaToPanFeet({
      deltaClientX: 1,
      deltaClientY: 1,
      ...invalid
    });
    throw new Error("invalid pan scale should fail");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("positive finite")) {
      throw error;
    }
  }
}
