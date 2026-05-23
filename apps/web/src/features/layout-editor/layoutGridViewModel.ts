import { feetToPixels, type LayoutViewportTransform } from "./layoutCoordinateSystem";

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
  frame: {
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
  widthFeet: number;
  heightFeet: number;
  viewport: LayoutViewportTransform;
  gridSpacingFeet?: number;
  majorEveryFeet?: number;
};

export function buildLayoutGridViewModel({
  widthFeet,
  heightFeet,
  viewport,
  gridSpacingFeet = 1,
  majorEveryFeet = 5
}: BuildLayoutGridViewModelInput): LayoutGridViewModel {
  const normalizedWidthFeet = requirePositive(widthFeet, "widthFeet");
  const normalizedHeightFeet = requirePositive(heightFeet, "heightFeet");
  const normalizedGridSpacingFeet = requirePositive(gridSpacingFeet, "gridSpacingFeet");
  const normalizedMajorEveryFeet = requirePositive(majorEveryFeet, "majorEveryFeet");
  const topLeft = feetToPixels({ xFeet: 0, yFeet: 0 }, viewport);
  const bottomRight = feetToPixels(
    { xFeet: normalizedWidthFeet, yFeet: normalizedHeightFeet },
    viewport
  );
  const widthPixels = roundPixels(bottomRight.xPixels - topLeft.xPixels);
  const heightPixels = roundPixels(bottomRight.yPixels - topLeft.yPixels);

  return {
    widthFeet: normalizedWidthFeet,
    heightFeet: normalizedHeightFeet,
    widthPixels,
    heightPixels,
    viewBox: [
      roundPixels(topLeft.xPixels),
      roundPixels(topLeft.yPixels),
      widthPixels,
      heightPixels
    ].join(" "),
    frame: {
      xPixels: roundPixels(topLeft.xPixels),
      yPixels: roundPixels(topLeft.yPixels),
      widthPixels,
      heightPixels
    },
    gridSpacingFeet: normalizedGridSpacingFeet,
    majorEveryFeet: normalizedMajorEveryFeet,
    verticalLines: buildVerticalLines(
      normalizedWidthFeet,
      normalizedHeightFeet,
      viewport,
      normalizedGridSpacingFeet,
      normalizedMajorEveryFeet
    ),
    horizontalLines: buildHorizontalLines(
      normalizedWidthFeet,
      normalizedHeightFeet,
      viewport,
      normalizedGridSpacingFeet,
      normalizedMajorEveryFeet
    )
  };
}

function buildVerticalLines(
  widthFeet: number,
  heightFeet: number,
  viewport: LayoutViewportTransform,
  gridSpacingFeet: number,
  majorEveryFeet: number
): LayoutGridLineViewModel[] {
  return buildFootValues(widthFeet, gridSpacingFeet).map((xFeet) => {
    const start = feetToPixels({ xFeet, yFeet: 0 }, viewport);
    const end = feetToPixels({ xFeet, yFeet: heightFeet }, viewport);
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
  widthFeet: number,
  heightFeet: number,
  viewport: LayoutViewportTransform,
  gridSpacingFeet: number,
  majorEveryFeet: number
): LayoutGridLineViewModel[] {
  return buildFootValues(heightFeet, gridSpacingFeet).map((yFeet) => {
    const start = feetToPixels({ xFeet: 0, yFeet }, viewport);
    const end = feetToPixels({ xFeet: widthFeet, yFeet }, viewport);
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

function buildFootValues(maxFeet: number, gridSpacingFeet: number): number[] {
  const values: number[] = [];
  const maxSteps = Math.ceil(maxFeet / gridSpacingFeet);
  for (let step = 0; step <= maxSteps; step += 1) {
    const valueFeet = roundFeet(step * gridSpacingFeet);
    if (valueFeet <= maxFeet) {
      values.push(valueFeet);
    }
  }
  const lastValue = values.at(-1);
  if (lastValue !== maxFeet) {
    values.push(maxFeet);
  }
  return values;
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
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite number greater than 0`);
  }
  return value;
}
