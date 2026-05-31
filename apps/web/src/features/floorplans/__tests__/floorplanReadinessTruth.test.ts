import { createActiveFloorplanContract, createEmptyActiveFloorplanState } from "../activeFloorplanState";
import { createFloorplanReadinessViewModel } from "../floorplanReadinessViewModel";

const baseContract = createActiveFloorplanContract(createEmptyActiveFloorplanState());
if (baseContract == null) {
  throw new Error("canonical active floorplan contract should be available for readiness checks");
}
const firstRoom = baseContract.editableLayout.rooms[0];
if (firstRoom == null) {
  throw new Error("canonical active floorplan contract should include rooms");
}

const baseReadiness = createFloorplanReadinessViewModel(baseContract);
const noSplitRooms = baseReadiness.items.find((item) => item.itemId === "split_rooms_reviewed");
if (noSplitRooms?.status !== "passed" || noSplitRooms.reason !== "No split rooms present.") {
  throw new Error("floorplans without split rooms should pass with an explicit no-split-room reason");
}
if (baseReadiness.simulationStatus === "ready_for_simulation") {
  throw new Error("floorplan-only readiness must not claim simulation readiness");
}
for (const itemId of ["assignment_set_ready", "scenario_context_ready", "scenario_assumptions_ready"]) {
  const item = baseReadiness.items.find((candidate) => candidate.itemId === itemId);
  if (item == null || item.status !== "needs_work") {
    throw new Error(`simulation readiness must require ${itemId}`);
  }
}

const invalidSplitRoomReadiness = createFloorplanReadinessViewModel({
  ...baseContract,
  editableLayout: {
    ...baseContract.editableLayout,
    splitBays: [
      {
        id: "split-bay-invalid",
        label: "Invalid",
        xFeet: 1,
        yFeet: 1,
        widthFeet: 10,
        heightFeet: 10,
        objectType: "split_bay",
        splitBayId: "split-bay-invalid",
        bedPositionRoomIds: ["missing-room", "room-02"],
        dividerStyle: "diagonal_down"
      }
    ]
  }
});
const invalidSplitRooms = invalidSplitRoomReadiness.items.find((item) => item.itemId === "split_rooms_reviewed");
if (invalidSplitRooms?.status !== "needs_work") {
  throw new Error("invalid split-room child references must fail readiness");
}

const invalidDividerStyleReadiness = createFloorplanReadinessViewModel({
  ...baseContract,
  editableLayout: {
    ...baseContract.editableLayout,
    splitBays: [
      {
        id: "split-bay-invalid-divider",
        label: "Invalid divider",
        xFeet: 1,
        yFeet: 1,
        widthFeet: 10,
        heightFeet: 10,
        objectType: "split_bay",
        splitBayId: "split-bay-invalid-divider",
        bedPositionRoomIds: ["room-01", "room-02"],
        dividerStyle: "unsupported-divider"
      } as any
    ]
  }
});
const invalidDividerSplitRooms = invalidDividerStyleReadiness.items.find((item) => item.itemId === "split_rooms_reviewed");
if (invalidDividerSplitRooms?.status !== "needs_work") {
  throw new Error("invalid split-room divider style must fail readiness");
}

const invalidChildRoomReadiness = createFloorplanReadinessViewModel({
  ...baseContract,
  editableLayout: {
    ...baseContract.editableLayout,
    rooms: [
      ...baseContract.editableLayout.rooms,
      {
        ...firstRoom,
        id: "room-storage-child",
        label: "Storage child",
        roomNumber: "Storage child",
        roomType: "storage"
      }
    ],
    splitBays: [
      {
        id: "split-bay-storage-child",
        label: "Storage child",
        xFeet: 1,
        yFeet: 1,
        widthFeet: 10,
        heightFeet: 10,
        objectType: "split_bay",
        splitBayId: "split-bay-storage-child",
        bedPositionRoomIds: [firstRoom.id, "room-storage-child"],
        dividerStyle: "diagonal_down"
      }
    ]
  }
});
const invalidChildSplitRooms = invalidChildRoomReadiness.items.find((item) => item.itemId === "split_rooms_reviewed");
if (invalidChildSplitRooms?.status !== "needs_work") {
  throw new Error("split-room child positions must be assignment-eligible room loads");
}
