import type { EditableRoomGeometry } from "@nerdeus/shared";

export function buildAddSplitBayAction(input: {
  sequence: number;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
}) {
  const padded = String(input.sequence).padStart(3, "0");
  const splitBayId = `authored-split-bay-${padded}`;
  const roomA = buildBedPositionRoom(`${splitBayId}-a`, `Split Bay ${padded} A`, input.xFeet, input.yFeet, input.widthFeet / 2, input.heightFeet);
  const roomB = buildBedPositionRoom(`${splitBayId}-b`, `Split Bay ${padded} B`, input.xFeet + input.widthFeet / 2, input.yFeet, input.widthFeet / 2, input.heightFeet);
  return {
    type: "addSplitBay" as const,
    splitBayId,
    label: `Split Bay ${padded}`,
    roomA,
    roomB
  };
}

function buildBedPositionRoom(
  id: string,
  label: string,
  xFeet: number,
  yFeet: number,
  widthFeet: number,
  heightFeet: number
): EditableRoomGeometry {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: label.replace("Split Bay ", ""),
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet,
    heightFeet
  };
}
