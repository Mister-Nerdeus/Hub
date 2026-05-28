export type CanvasPanTargetKind =
  | "background"
  | "room"
  | "door"
  | "resize-handle"
  | "station"
  | "hallway"
  | "zone"
  | "popup"
  | "toolbar"
  | "selected-object";

export type CanvasPanTargetDescriptor = {
  targetKind: CanvasPanTargetKind;
};

export type CanvasPanDeltaInput = {
  deltaClientX: number;
  deltaClientY: number;
  pixelsPerFoot: number;
  zoom: number;
};

export function canStartCanvasPan(target: CanvasPanTargetDescriptor): boolean {
  return target.targetKind === "background" || target.targetKind === "hallway" || target.targetKind === "zone";
}

export function canvasPointerDeltaToPanFeet({
  deltaClientX,
  deltaClientY,
  pixelsPerFoot,
  zoom
}: CanvasPanDeltaInput) {
  const denominator = requirePositive(pixelsPerFoot, "pixelsPerFoot") * requirePositive(zoom, "zoom");
  return {
    deltaXFeet: roundPanFeet(-deltaClientX / denominator),
    deltaYFeet: roundPanFeet(-deltaClientY / denominator)
  };
}

export function isCanvasPanBackgroundTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest("[data-canvas-pan-blocker='true']") != null) {
    return false;
  }
  if (target.closest(".layout-editor-stage__room") != null) return false;
  if (target.closest(".layout-editor-stage__door") != null) return false;
  if (target.closest(".layout-editor-stage__resize-handle") != null) return false;
  if (target.closest(".layout-editor-stage__station") != null) return false;
  if (target.closest(".canvas-object-popover") != null) return false;
  if (target.closest(".editor-command-bar") != null) return false;
  if (target.closest(".layout-viewport-toolbar") != null) return false;
  return target.closest([
    "[data-canvas-pan-background='true']",
    ".layout-editor-stage__grid",
    ".layout-editor-stage__grid-line",
    ".layout-editor-stage__workspace-boundary",
    ".layout-editor-stage__hallway",
    ".layout-editor-stage__zone"
  ].join(", ")) != null;
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
  return value;
}

function roundPanFeet(value: number): number {
  return Number(value.toFixed(6));
}
