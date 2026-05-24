export const DEFAULT_SNAP_SIZE_FEET = 1;
export const FINE_SNAP_SIZE_FEET = 0.5;

export const LAYOUT_SNAP_ENGINE_MODES = ["default", "fine"] as const;

export type LayoutSnapEngineMode = (typeof LAYOUT_SNAP_ENGINE_MODES)[number];

export type LayoutSnapPointFeet = {
  xFeet: number;
  yFeet: number;
};

export type LayoutSnapRectFeet = LayoutSnapPointFeet & {
  widthFeet: number;
  heightFeet: number;
};

export type LayoutResizeDeltaFeet = {
  deltaWidthFeet: number;
  deltaHeightFeet: number;
};

export type LayoutMoveDeltaFeet = {
  deltaXFeet: number;
  deltaYFeet: number;
};

export function snapFeet(
  valueFeet: number,
  snapSizeFeet = DEFAULT_SNAP_SIZE_FEET
): number {
  const value = requireFinite(valueFeet, "valueFeet");
  const snapSize = requirePositive(snapSizeFeet, "snapSizeFeet");
  const snapSteps = roundHalfAwayFromZero(value / snapSize);
  return normalizeSignedZero(roundFeet(snapSteps * snapSize));
}

export function snapSizeFeetForMode(snapMode: LayoutSnapEngineMode): number {
  switch (snapMode) {
    case "default":
      return DEFAULT_SNAP_SIZE_FEET;
    case "fine":
      return FINE_SNAP_SIZE_FEET;
  }
}

export function snapPointFeet<TPoint extends LayoutSnapPointFeet>(
  point: TPoint,
  snapSizeFeet = DEFAULT_SNAP_SIZE_FEET
): TPoint {
  return {
    ...point,
    xFeet: snapFeet(point.xFeet, snapSizeFeet),
    yFeet: snapFeet(point.yFeet, snapSizeFeet)
  };
}

export function snapRectFeet<TRect extends LayoutSnapRectFeet>(
  rect: TRect,
  snapSizeFeet = DEFAULT_SNAP_SIZE_FEET
): TRect {
  return {
    ...rect,
    xFeet: snapFeet(rect.xFeet, snapSizeFeet),
    yFeet: snapFeet(rect.yFeet, snapSizeFeet),
    widthFeet: snapFeet(rect.widthFeet, snapSizeFeet),
    heightFeet: snapFeet(rect.heightFeet, snapSizeFeet)
  };
}

export function snapResizeDeltaFeet<TDelta extends LayoutResizeDeltaFeet>(
  delta: TDelta,
  snapSizeFeet = DEFAULT_SNAP_SIZE_FEET
): TDelta {
  return {
    ...delta,
    deltaWidthFeet: snapFeet(delta.deltaWidthFeet, snapSizeFeet),
    deltaHeightFeet: snapFeet(delta.deltaHeightFeet, snapSizeFeet)
  };
}

export function snapMoveDeltaFeet<TDelta extends LayoutMoveDeltaFeet>(
  delta: TDelta,
  snapSizeFeet = DEFAULT_SNAP_SIZE_FEET
): TDelta {
  return {
    ...delta,
    deltaXFeet: snapFeet(delta.deltaXFeet, snapSizeFeet),
    deltaYFeet: snapFeet(delta.deltaYFeet, snapSizeFeet)
  };
}

function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(Math.abs(value)) : Math.round(value);
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
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
