import {
  buildAddObjectMenuViewModel,
  isRoomPlacementMenuItem,
  roomTypeForPlacementMenuItem
} from "../addObjectMenuViewModel";

const viewModel = buildAddObjectMenuViewModel();
const labels = viewModel.items.map((item) => item.label);

for (const label of ["Patient Care Room", "Storage Room", "Solid Wall / Blocked Area"]) {
  if (!labels.includes(label)) {
    throw new Error(`Add Object menu must expose explicit ${label} option`);
  }
}

if (labels.includes("Room")) {
  throw new Error("Add Object menu must not expose ambiguous generic Room as the primary placement path");
}

if (!isRoomPlacementMenuItem("patient_care_room") || roomTypeForPlacementMenuItem("patient_care_room") !== "patient_room") {
  throw new Error("Patient Care Room placement must create patient_room semantics");
}

if (!isRoomPlacementMenuItem("storage_room") || roomTypeForPlacementMenuItem("storage_room") !== "storage") {
  throw new Error("Storage Room placement must create storage semantics");
}

if (!isRoomPlacementMenuItem("solid_wall") || roomTypeForPlacementMenuItem("solid_wall") !== "solid_wall") {
  throw new Error("Solid Wall placement must create solid_wall semantics");
}
