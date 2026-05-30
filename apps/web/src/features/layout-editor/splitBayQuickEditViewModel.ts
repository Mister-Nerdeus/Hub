import type { EditableSplitBayDividerStyle, EditableSplitBayGeometry } from "@nerdeus/shared";

export type SplitBayQuickEditViewModel = {
  status: "missing" | "ready";
  splitBayId: string | null;
  label: string;
  bedPositionRoomIds: readonly [string, string] | null;
  dividerStyle: EditableSplitBayDividerStyle | null;
  readOnly: boolean;
};

export function buildSplitBayQuickEdit(input: {
  splitBay: EditableSplitBayGeometry | null;
  readOnly: boolean;
}): SplitBayQuickEditViewModel {
  if (input.splitBay == null) {
    return {
      status: "missing",
      splitBayId: null,
      label: "No split bay selected",
      bedPositionRoomIds: null,
      dividerStyle: null,
      readOnly: true
    };
  }
  return {
    status: "ready",
    splitBayId: input.splitBay.splitBayId,
    label: input.splitBay.label,
    bedPositionRoomIds: input.splitBay.bedPositionRoomIds,
    dividerStyle: input.splitBay.dividerStyle,
    readOnly: input.readOnly
  };
}
