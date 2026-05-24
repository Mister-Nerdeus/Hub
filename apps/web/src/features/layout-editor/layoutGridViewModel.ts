import {
  feetToPixels,
  pixelsToFeet,
  type LayoutViewportTransform
} from "./layoutCoordinateSystem";
import type {
  LayoutStageViewportPixels,
  LayoutWorkspaceBoundsFeet
} from "./layoutWorkspaceConfig";

export type LayoutGridLineOrientation = "vertical" | "horizontal";

export type LayoutGridLineViewModel = {
  id: string;
  orientation: LayoutGridLineOrientation;
  x1Pixels: number;
  y1Pixels: number;
  x2Pixels: number;
  y2Pixels: number;
  valueFeet: number;
  isMajor: boolean;
  label: string;
};

export type LayoutGridViewModel = {
  widthFeet: number;
  heightFeet: number;
  widthPixels: number;
  heightPixels: number;
  viewBox: string;
  visibleBoundsFeet: LayoutWorkspaceBoundsFeet;
  workspaceBoundary: {
    xPixels: number;
    yPixels: number;
    widthPixels: number;
    heightPixels: number;
  };
  gridSpacingFeet: number;
  majorEveryFeet: number;
  verticalLines: LayoutGridLineViewModel[];
  horizontalLines: LayoutGridLineViewModel[];
};

export type BuildLayoutGridViewModelInput = {
  workspaceBoundsFeet: LayoutWorkspaceBoundsFeet;
  viewportSizePixels: LayoutStageViewportPixels;
  viewport: LayoutViewportTransform;
  gridSpacingFeet?: number;
  majorEveryFeet?: number;
};

export function buildLayoutGridViewModel({
  workspaceBoundsFeet,
  viewportSizePixels,
  viewport,
  gridSpacingFeet = 1,
  majorEveryFeet = 5
}: BuildLayoutGridViewModelInput): LayoutGridViewModel {
  const workspaceBounds = normalizeWorkspaceBounds(workspaceBoundsFeet);
  const normalizedViewportSize = normalizeViewportSize(viewportSizePixels);
  const normalizedGridSpacingFeet = requirePositive(gridSpacingFeet, "gridSpacingFeet");
  const normalizedMajorEveryFeet = requirePositive(majorEveryFeet, "majorEveryFeet");
  const visibleBoundsFeet = visibleWorkspaceIntersection({
    workspaceBoundsFeet: workspaceBounds,
    viewportSizePixels: normalizedViewportSize,
    viewport
  });
  const workspaceBoundary = workspaceBoundaryPixels(workspaceBounds, viewport);

  return {
    widthFeet: workspaceBounds.widthFeet,
    heightFeet: workspaceBounds.heightFeet,
    widthPixels: normalizedViewportSize.widthPixels,
    heightPixels: normalizedViewportSize.heightPixels,
    viewBox: `0 0 ${roundPixels(normalizedViewportSize.widthPixels)} ${roundPixels(normalizedViewportSize.heightPixels)}`,
    visibleBoundsFeet,
    workspaceBoundary,
    gridSpacingFeet: normalizedGridSpacingFeet,
    majorEveryFeet: normalizedMajorEveryFeet,
    verticalLines: buildVerticalLines(
      visibleBoundsFeet,
      viewport,
      normalizedGridSpacingFeet,
      normalizedMajorEveryFeet
    ),
    horizontalLines: buildHorizontalLines(
      visibleBoundsFeet,
      viewport,
      normalizedGridSpacingFeet,
      normalizedMajorEveryFeet
    )
  };
}

function buildVerticalLines(
  visibleBoundsFeet: LayoutWorkspaceBoundsFeet,
  viewport: LayoutViewportTransform,
  gridSpacingFeet: number,
  majorEveryFeet: number
): LayoutGridLineViewModel[] {
  return buildFootValues(
    visibleBoundsFeet.xFeet,
    visibleBoundsFeet.xFeet + visibleBoundsFeet.widthFeet,
    gridSpacingFeet
  ).map((xFeet) => {
    const start = feetToPixels({ xFeet, yFeet: visibleBoundsFeet.yFeet }, viewport);
    const end = feetToPixels(
      { xFeet, yFeet: visibleBoundsFeet.yFeet + visibleBoundsFeet.heightFeet },
      viewport
    );
    return {
      id: `grid-x-${formatFeet(xFeet)}`,
      orientation: "vertical",
      x1Pixels: roundPixels(start.xPixels),
      y1Pixels: roundPixels(start.yPixels),
      x2Pixels: roundPixels(end.xPixels),
      y2Pixels: roundPixels(end.yPixels),
      valueFeet: xFeet,
      isMajor: isMajorLine(xFeet, majorEveryFeet),
      label: `${formatFeet(xFeet)} ft`
    };
  });
}

function buildHorizontalLines(
  visibleBoundsFeet: LayoutWorkspaceBoundsFeet,
  viewport: LayoutViewportTransform,
  gridSpacingFeet: number,
  majorEveryFeet: number
): LayoutGridLineViewModel[] {
  return buildFootValues(
    visibleBoundsFeet.yFeet,
    visibleBoundsFeet.yFeet + visibleBoundsFeet.heightFeet,
    gridSpacingFeet
  ).map((yFeet) => {
    const start = feetToPixels({ xFeet: visibleBoundsFeet.xFeet, yFeet }, viewport);
    const end = feetToPixels(
      { xFeet: visibleBoundsFeet.xFeet + visibleBoundsFeet.widthFeet, yFeet },
      viewport
    );
    return {
      id: `grid-y-${formatFeet(yFeet)}`,
      orientation: "horizontal",
      x1Pixels: roundPixels(start.xPixels),
      y1Pixels: roundPixels(start.yPixels),
      x2Pixels: roundPixels(end.xPixels),
      y2Pixels: roundPixels(end.yPixels),
      valueFeet: yFeet,
      isMajor: isMajorLine(yFeet, majorEveryFeet),
      label: `${formatFeet(yFeet)} ft`
    };
  });
}

function buildFootValues(minFeet: number, maxFeet: number, gridSpacingFeet: number): number[] {
  if (maxFeet < minFeet) {
    return [];
  }
  const values: number[] = [];
  const minStep = Math.ceil(minFeet / gridSpacingFeet);
  const maxStep = Math.floor(maxFeet / gridSpacingFeet);
  for (let step = minStep; step <= maxStep; step += 1) {
    const valueFeet = roundFeet(step * gridSpacingFeet);
    if (valueFeet >= minFeet && valueFeet <= maxFeet) {
      values.push(valueFeet);
    }
  }
  return values;
}

function visibleWorkspaceIntersection({
  workspaceBoundsFeet,
  viewportSizePixels,
  viewport
}: {
  workspaceBoundsFeet: LayoutWorkspaceBoundsFeet;
  viewportSizePixels: LayoutStageViewportPixels;
  viewport: LayoutViewportTransform;
}): LayoutWorkspaceBoundsFeet {
  const visibleTopLeft = pixelsToFeet({ xPixels: 0, yPixels: 0 }, viewport);
  const visibleBottomRight = pixelsToFeet(
    {
      xPixels: viewportSizePixels.widthPixels,
      yPixels: viewportSizePixels.heightPixels
    },
    viewport
  );
  const visibleLeftFeet = Math.min(visibleTopLeft.xFeet, visibleBottomRight.xFeet);
  const visibleTopFeet = Math.min(visibleTopLeft.yFeet, visibleBottomRight.yFeet);
  const visibleRightFeet = Math.max(visibleTopLeft.xFeet, visibleBottomRight.xFeet);
  const visibleBottomFeet = Math.max(visibleTopLeft.yFeet, visibleBottomRight.yFeet);
  const workspaceRightFeet = workspaceBoundsFeet.xFeet + workspaceBoundsFeet.widthFeet;
  const workspaceBottomFeet = workspaceBoundsFeet.yFeet + workspaceBoundsFeet.heightFeet;

  const xFeet = Math.max(workspaceBoundsFeet.xFeet, visibleLeftFeet);
  const yFeet = Math.max(workspaceBoundsFeet.yFeet, visibleTopFeet);
  const rightFeet = Math.min(workspaceRightFeet, visibleRightFeet);
  const bottomFeet = Math.min(workspaceBottomFeet, visibleBottomFeet);

  return {
    xFeet: roundFeet(xFeet),
    yFeet: roundFeet(yFeet),
    widthFeet: roundFeet(Math.max(0, rightFeet - xFeet)),
    heightFeet: roundFeet(Math.max(0, bottomFeet - yFeet))
  };
}

function workspaceBoundaryPixels(
  workspaceBoundsFeet: LayoutWorkspaceBoundsFeet,
  viewport: LayoutViewportTransform
): LayoutGridViewModel["workspaceBoundary"] {
  const topLeft = feetToPixels(workspaceBoundsFeet, viewport);
  const bottomRight = feetToPixels(
    {
      xFeet: workspaceBoundsFeet.xFeet + workspaceBoundsFeet.widthFeet,
      yFeet: workspaceBoundsFeet.yFeet + workspaceBoundsFeet.heightFeet
    },
    viewport
  );
  return {
    xPixels: roundPixels(topLeft.xPixels),
    yPixels: roundPixels(topLeft.yPixels),
    widthPixels: roundPixels(bottomRight.xPixels - topLeft.xPixels),
    heightPixels: roundPixels(bottomRight.yPixels - topLeft.yPixels)
  };
}

function normalizeWorkspaceBounds(boundsFeet: LayoutWorkspaceBoundsFeet): LayoutWorkspaceBoundsFeet {
  return {
    xFeet: requireFinite(boundsFeet.xFeet, "workspaceBoundsFeet.xFeet"),
    yFeet: requireFinite(boundsFeet.yFeet, "workspaceBoundsFeet.yFeet"),
    widthFeet: requirePositive(boundsFeet.widthFeet, "workspaceBoundsFeet.widthFeet"),
    heightFeet: requirePositive(boundsFeet.heightFeet, "workspaceBoundsFeet.heightFeet")
  };
}

function normalizeViewportSize(viewportSizePixels: LayoutStageViewportPixels): LayoutStageViewportPixels {
  return {
    widthPixels: requirePositive(viewportSizePixels.widthPixels, "viewportSizePixels.widthPixels"),
    heightPixels: requirePositive(viewportSizePixels.heightPixels, "viewportSizePixels.heightPixels")
  };
}

function isMajorLine(valueFeet: number, majorEveryFeet: number): boolean {
  const quotient = valueFeet / majorEveryFeet;
  return Math.abs(quotient - Math.round(quotient)) < 0.000001;
}

function formatFeet(valueFeet: number): string {
  return Number.isInteger(valueFeet) ? String(valueFeet) : valueFeet.toFixed(1);
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function roundPixels(value: number): number {
  return Number(value.toFixed(3));
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be a finite number greater than 0`);
  }
  return finite;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}
