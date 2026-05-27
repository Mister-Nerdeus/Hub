export type StationPresentationStyle = "rectangle" | "curved_desk";

export type StationRectPixels = {
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
};

export type StationLabelPlateViewModel = {
  xPixels: number;
  yPixels: number;
  widthPixels: number;
  heightPixels: number;
  textX: number;
  textY: number;
  label: string;
};

export function stationPresentationStyleForType(stationType: string): StationPresentationStyle {
  return stationType === "nurse_station" ? "curved_desk" : "rectangle";
}

export function buildCurvedDeskPresentationPath(rect: StationRectPixels): string {
  const { xPixels, yPixels, widthPixels, heightPixels } = rect;
  const leftX = round(xPixels);
  const rightX = round(xPixels + widthPixels);
  const centerX = round(xPixels + widthPixels / 2);
  const outerY = round(yPixels + heightPixels * 0.68);
  const innerY = round(yPixels + heightPixels * 0.86);
  const outerControlY = round(yPixels + heightPixels * 0.1);
  const innerControlY = round(yPixels + heightPixels * 0.38);

  return [
    `M ${leftX} ${outerY}`,
    `Q ${centerX} ${outerControlY} ${rightX} ${outerY}`,
    `L ${rightX} ${innerY}`,
    `Q ${centerX} ${innerControlY} ${leftX} ${innerY}`,
    "Z"
  ].join(" ");
}

export function createStationLabelPlate(rect: StationRectPixels & { label: string }): StationLabelPlateViewModel {
  const plateWidthPixels = Math.min(Math.max(rect.widthPixels * 0.62, 96), rect.widthPixels + 24);
  const plateHeightPixels = Math.max(18, Math.min(28, rect.heightPixels * 0.32));
  const xPixels = rect.xPixels + rect.widthPixels / 2 - plateWidthPixels / 2;
  const yPixels = rect.yPixels + rect.heightPixels * 0.08;
  return {
    xPixels: round(xPixels),
    yPixels: round(yPixels),
    widthPixels: round(plateWidthPixels),
    heightPixels: round(plateHeightPixels),
    textX: round(xPixels + plateWidthPixels / 2),
    textY: round(yPixels + plateHeightPixels / 2),
    label: rect.label
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
