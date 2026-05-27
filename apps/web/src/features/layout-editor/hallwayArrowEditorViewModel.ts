import type { EditableHallwayGeometry } from "@nerdeus/shared";

export type HallwayArrowEditorViewModel = {
  status: "missing" | "ready";
  hallwayId: string | null;
  directionLabel: string;
  visible: boolean;
  readOnly: boolean;
  hintCopy: string;
};

export function buildHallwayArrowEditorViewModel(input: {
  hallway: EditableHallwayGeometry | null;
  readOnly: boolean;
}): HallwayArrowEditorViewModel {
  if (input.hallway == null) {
    return {
      status: "missing",
      hallwayId: null,
      directionLabel: "No hallway selected",
      visible: false,
      readOnly: true,
      hintCopy: "Hallway arrows are presentation hints only."
    };
  }
  return {
    status: "ready",
    hallwayId: input.hallway.id,
    directionLabel: input.hallway.widthFeet >= input.hallway.heightFeet ? "left to right" : "top to bottom",
    visible: true,
    readOnly: input.readOnly,
    hintCopy: "Hallway arrows are presentation hints only."
  };
}
