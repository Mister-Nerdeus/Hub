import {
  cleanupActiveFloorplanAfterSavedDelete,
  createEmptyActiveFloorplanState,
  openDefaultFloorplan,
  openSavedFloorplan
} from "../activeFloorplanState";
import { createDuplicateFloorplanViewModel } from "../duplicateFloorplanViewModel";
import { createSavedFloorplanStore } from "../savedFloorplanStore";

const store = createSavedFloorplanStore();
const activeSaved = store.save(createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy);
const inactiveSaved = store.save(createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy);

const activeState = openSavedFloorplan(createEmptyActiveFloorplanState(), activeSaved);
const cleaned = cleanupActiveFloorplanAfterSavedDelete(activeState, activeSaved.recordId);
if (cleaned.activeFloorplan !== null || cleaned.sequence !== 0) {
  throw new Error("deleting the active saved floorplan must clear active state");
}

const preserved = cleanupActiveFloorplanAfterSavedDelete(activeState, inactiveSaved.recordId);
if (preserved.activeFloorplan?.recordId !== activeSaved.recordId) {
  throw new Error("deleting an inactive saved floorplan must preserve active state");
}

const canonicalState = openDefaultFloorplan(createEmptyActiveFloorplanState(), "default-er-layout-plan-1");
const canonicalAfterDelete = cleanupActiveFloorplanAfterSavedDelete(canonicalState, activeSaved.recordId);
if (canonicalAfterDelete.activeFloorplan?.planId !== "default-er-layout-plan-1") {
  throw new Error("saved copy deletion must not affect the canonical default floorplan");
}
