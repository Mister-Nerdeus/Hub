export type LayoutViewportTransform = {
  pixelsPerFoot: number;
  zoom: number;
  panXFeet?: number;
  panYFeet?: number;
};

export type LayoutPointFeet = {
  xFeet: number;
  yFeet: number;
};

export type LayoutPointPixels = {
  xPixels: number;
  yPixels: number;
};

export type LayoutRectFeet = LayoutPointFeet & {
  widthFeet: number;
  heightFeet: number;
};

export type LayoutRectPixels = LayoutPointPixels & {
  widthPixels: number;
  heightPixels: number;
};

type NormalizedViewportTransform = Required<LayoutViewportTransform>;

export function feetToPixels(
  point: LayoutPointFeet,
  viewport: LayoutViewportTransform
): LayoutPointPixels {
  const normalized = normalizeViewport(viewport);
  const scale = normalized.pixelsPerFoot * normalized.zoom;
  return {
    xPixels: (requireFinite(point.xFeet, "point.xFeet") - normalized.panXFeet) * scale,
    yPixels: (requireFinite(point.yFeet, "point.yFeet") - normalized.panYFeet) * scale
  };
}

export function pixelsToFeet(
  point: LayoutPointPixels,
  viewport: LayoutViewportTransform
): LayoutPointFeet {
  const normalized = normalizeViewport(viewport);
  const scale = normalized.pixelsPerFoot * normalized.zoom;
  return {
    xFeet: requireFinite(point.xPixels, "point.xPixels") / scale + normalized.panXFeet,
    yFeet: requireFinite(point.yPixels, "point.yPixels") / scale + normalized.panYFeet
  };
}

export function rectFeetToPixels(
  rect: LayoutRectFeet,
  viewport: LayoutViewportTransform
): LayoutRectPixels {
  const normalized = normalizeViewport(viewport);
  const origin = feetToPixels(rect, normalized);
  const scale = normalized.pixelsPerFoot * normalized.zoom;
  return {
    ...origin,
    widthPixels: requireFinite(rect.widthFeet, "rect.widthFeet") * scale,
    heightPixels: requireFinite(rect.heightFeet, "rect.heightFeet") * scale
  };
}

export function rectPixelsToFeet(
  rect: LayoutRectPixels,
  viewport: LayoutViewportTransform
): LayoutRectFeet {
  const normalized = normalizeViewport(viewport);
  const origin = pixelsToFeet(rect, normalized);
  const scale = normalized.pixelsPerFoot * normalized.zoom;
  return {
    ...origin,
    widthFeet: requireFinite(rect.widthPixels, "rect.widthPixels") / scale,
    heightFeet: requireFinite(rect.heightPixels, "rect.heightPixels") / scale
  };
}

export function roundtripPointWithinSnapPrecision(
  point: LayoutPointFeet,
  viewport: LayoutViewportTransform,
  snapPrecisionFeet: number
): boolean {
  const snapPrecision = requirePositive(snapPrecisionFeet, "snapPrecisionFeet");
  const roundtrip = pixelsToFeet(feetToPixels(point, viewport), viewport);
  const toleranceFeet = Math.max(Number.EPSILON * 16, snapPrecision / 1_000_000);
  return (
    Math.abs(roundtrip.xFeet - point.xFeet) <= toleranceFeet &&
    Math.abs(roundtrip.yFeet - point.yFeet) <= toleranceFeet
  );
}

function normalizeViewport(viewport: LayoutViewportTransform): NormalizedViewportTransform {
  return {
    pixelsPerFoot: requirePositive(viewport.pixelsPerFoot, "pixelsPerFoot"),
    zoom: requirePositive(viewport.zoom, "zoom"),
    panXFeet: requireFinite(viewport.panXFeet ?? 0, "panXFeet"),
    panYFeet: requireFinite(viewport.panYFeet ?? 0, "panYFeet")
  };
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
