import type { EditableRoomGeometry } from "@nerdeus/shared";
import { layoutEditorReducer } from "../layoutEditorReducer";
import { RoomAlignmentControls } from "../RoomAlignmentControls";
import { buildRoomAlignmentViewModel } from "../roomAlignmentViewModel";
import { createLayoutEditorState } from "../layoutEditorState";

const rooms = [room("reference", "Reference", 5, 3), room("target", "Target", 20, 20)];
const viewModel = buildRoomAlignmentViewModel({ selectedRoom: rooms[1]!, rooms, readOnly: false });
if (viewModel.status !== "ready" || viewModel.referenceRoomId !== "reference") {
  throw new Error("room alignment controls should expose selected room and reference");
}
const calls: string[] = [];
RoomAlignmentControls({ viewModel, onApply: (actionId) => calls.push(actionId) }).props.children[1].props.children[0].props.onClick();
if (calls.at(-1) !== "alignTop") throw new Error("room alignment action should dispatch");

const state = createLayoutEditorState({
  editableLayout: {
    schemaVersion: "1.0.0",
    layoutId: "room-alignment-ui",
    units: "feet",
    rooms,
    doors: [],
    stations: [],
    hallways: [],
    zones: [],
    limitations: ["synthetic room alignment test"]
  },
  selectedObjectType: "room",
  selectedObjectId: "target"
});
const aligned = layoutEditorReducer(state, { type: "alignSelectedRoom", operation: "alignTop", referenceRoomId: "reference" });
if (aligned.editableLayout?.rooms.find((candidate) => candidate.id === "target")?.yFeet !== 3) {
  throw new Error("room alignment should update editable layout");
}
const undone = layoutEditorReducer(aligned, { type: "undoLayoutEdit" });
if (undone.editableLayout?.rooms.find((candidate) => candidate.id === "target")?.yFeet !== 20) {
  throw new Error("room alignment must participate in undo");
}

function room(id: string, label: string, xFeet: number, yFeet: number): EditableRoomGeometry {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 12,
    heightFeet: 10
  };
}
