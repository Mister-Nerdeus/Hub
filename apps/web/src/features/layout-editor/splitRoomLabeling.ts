export type SplitRoomBedSuffix = "A" | "B";

export function splitRoomBedLabels(parentRoomLabel: string): readonly [string, string] {
  return [
    splitRoomBedLabel(parentRoomLabel, "A"),
    splitRoomBedLabel(parentRoomLabel, "B")
  ];
}

export function splitRoomBedLabel(parentRoomLabel: string, suffix: SplitRoomBedSuffix): string {
  return `${normalizeSplitRoomParentLabel(parentRoomLabel)}${suffix}`;
}

export function isStableSplitRoomBedLabel(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9 -]*[AB]$/.test(value);
}

function normalizeSplitRoomParentLabel(parentRoomLabel: string): string {
  const trimmed = parentRoomLabel.trim();
  return trimmed.length === 0 ? "Room" : trimmed;
}
