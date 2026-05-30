import { buildSplitBayQuickEdit } from "../splitBayQuickEditViewModel";

const viewModel = buildSplitBayQuickEdit({
  splitBay: {
    objectType: "split_bay",
    id: "split-bay-room-04-room-05",
    splitBayId: "split-bay-room-04-room-05",
    label: "4/5",
    bedPositionRoomIds: ["room-04", "room-05"],
    xFeet: 0,
    yFeet: 0,
    widthFeet: 20,
    heightFeet: 10,
    dividerStyle: "vertical"
  },
  rooms: [
    room("room-04", "4", 0, 0),
    room("room-05", "5", 10, 0)
  ],
  readOnly: false
});

if (viewModel.unsplitButtonLabel !== "Unsplit 4/5") {
  throw new Error("split room quick edit should expose the initial Unsplit 4/5 action label");
}
if (viewModel.unsplitConfirmationTitle !== "Unsplit Split Room 4/5?") {
  throw new Error("split room quick edit should expose explicit unsplit confirmation title");
}
if (viewModel.unsplitPreservationCopy !== "This removes the split-room grouping but preserves Room 4 and Room 5.") {
  throw new Error("unsplit confirmation copy should state that child rooms remain");
}
if (viewModel.unsplitAssignmentCopy !== "Child assignments may remain if assignment state exists.") {
  throw new Error("unsplit confirmation copy should state assignment preservation semantics");
}
if (viewModel.unsplitStatusMessage !== "Split Room 4/5 removed. Rooms 4 and 5 remain available.") {
  throw new Error("unsplit status copy should confirm only the parent grouping was removed");
}

function room(id: string, number: string, xFeet: number, yFeet: number) {
  return {
    objectType: "room" as const,
    id,
    label: number,
    roomNumber: number,
    roomType: "standard" as const,
    capacityType: "single" as const,
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 10,
    heightFeet: 10
  };
}
