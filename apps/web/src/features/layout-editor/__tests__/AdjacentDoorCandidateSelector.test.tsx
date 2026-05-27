import type { EditableDoorGeometry, EditableRoomGeometry } from "@nerdeus/shared";
import { AdjacentDoorCandidateSelector } from "../AdjacentDoorCandidateSelector";
import { buildAdjacentDoorCandidateViewModel } from "../adjacentDoorCandidateViewModel";

const rooms = [room("owner", "Owner", 0, 10), room("target", "Target", 0, 0)];
const door: EditableDoorGeometry = {
  objectType: "door",
  id: "door-01",
  label: "Door 01",
  ownerKind: "room",
  ownerId: "owner",
  wall: "north",
  offsetFeet: 2,
  widthFeet: 4
};

const viewModel = buildAdjacentDoorCandidateViewModel({ door, rooms, readOnly: false });
if (viewModel.status !== "ready" || viewModel.candidates[0]?.roomId !== "target") {
  throw new Error("candidate selector should expose geometry-valid rooms");
}
if (viewModel.candidates[0].wall !== "south" || viewModel.candidates[0].previewOffsetFeet !== 2) {
  throw new Error("candidate selector should expose wall and preview offset");
}

const calls: string[] = [];
const element = AdjacentDoorCandidateSelector({
  viewModel,
  onSelectCandidate: (roomId) => calls.push(roomId)
});
if (element.props["data-adjacent-door-candidate-selector"] !== "ready") {
  throw new Error("selector should expose DOM assertion status");
}
element.props.children[0].props.children[1].props.onChange({ currentTarget: { value: "target" } });
if (calls.at(-1) !== "target") {
  throw new Error("selector should dispatch the user-selected candidate");
}

const noCandidate = buildAdjacentDoorCandidateViewModel({
  door,
  rooms: [rooms[0]!],
  readOnly: false
});
const noCandidateElement = AdjacentDoorCandidateSelector({
  viewModel: noCandidate,
  onSelectCandidate: () => calls.push("unexpected")
});
if (noCandidateElement.props.children[0].props.children[1].props.disabled !== true) {
  throw new Error("no-candidate selector should be disabled");
}

const readOnly = buildAdjacentDoorCandidateViewModel({ door, rooms, readOnly: true });
if (!AdjacentDoorCandidateSelector({ viewModel: readOnly, onSelectCandidate: () => undefined }).props.children[0].props.children[1].props.disabled) {
  throw new Error("read-only candidate selector must be protected");
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
