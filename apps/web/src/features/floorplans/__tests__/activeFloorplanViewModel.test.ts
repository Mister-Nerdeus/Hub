import {
  createEmptyActiveFloorplanState,
  openDefaultFloorplan
} from "../activeFloorplanState";
import { createOperationalActiveFloorplanViewModel } from "../activeFloorplanViewModel";

const empty = createOperationalActiveFloorplanViewModel(createEmptyActiveFloorplanState());
if (empty.hasActiveFloorplan || empty.editorLaunchLabel !== "Open a floorplan first") {
  throw new Error("empty active floorplan state should not imply active editor launch");
}

const activeState = openDefaultFloorplan(createEmptyActiveFloorplanState(), "default-er-layout-plan-2");
const active = createOperationalActiveFloorplanViewModel(activeState);
if (!active.hasActiveFloorplan || active.promotionStatusLabel !== "Promotion blocked") {
  throw new Error("active floorplan summary must preserve promotion block");
}
