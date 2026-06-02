import {
  canonicalErPodGeometryFixture,
  type ActiveFloorplanContract
} from "@nerdeus/shared";
import { selectManualAssignmentLayout } from "../manualAssignmentDemoMode";

const activeNoSplitFloorplan: ActiveFloorplanContract = {
  schemaVersion: "1.0.0",
  activeFloorplanId: "active-floorplan-proof",
  activeFloorplanVersionId: "active-no-split-version",
  displayName: "Active no split proof",
  sourceKind: "saved_version",
  workflowStatus: "ready_for_assignment",
  editableLayout: {
    ...canonicalErPodGeometryFixture,
    layoutId: "active-no-split-layout",
    splitRooms: []
  },
  savedAt: "2026-06-02T00:00:00.000Z",
  hasUnsavedChanges: false,
  selectedForAssignment: true
};

const activeSplitFloorplan: ActiveFloorplanContract = {
  ...activeNoSplitFloorplan,
  activeFloorplanVersionId: "active-split-version",
  displayName: "Active split proof",
  editableLayout: {
    ...canonicalErPodGeometryFixture,
    layoutId: "active-split-layout"
  }
};

if (selectManualAssignmentLayout({ activeFloorplan: activeNoSplitFloorplan }).layout.layoutId !== "active-no-split-layout") {
  throw new Error("active floorplan with zero split rooms must be used");
}

if (selectManualAssignmentLayout({ activeFloorplan: activeSplitFloorplan }).layout.layoutId !== "active-split-layout") {
  throw new Error("active floorplan with split rooms must be used");
}

const demoSelection = selectManualAssignmentLayout({
  activeFloorplan: activeNoSplitFloorplan,
  fixtureMode: "canonical_demo"
});
if (demoSelection.layout.layoutId !== canonicalErPodGeometryFixture.layoutId || demoSelection.visibleLabel == null) {
  throw new Error("canonical demo mode must be explicit and visible");
}

const noActiveSelection = selectManualAssignmentLayout({ activeFloorplan: null });
if (noActiveSelection.layout.layoutId !== canonicalErPodGeometryFixture.layoutId || noActiveSelection.reason !== "no_active_floorplan") {
  throw new Error("canonical fixture fallback is allowed only when no active floorplan exists");
}
