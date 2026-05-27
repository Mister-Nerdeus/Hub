import type { LayoutEditorValidationWarning } from "../layoutValidationWarningContract";
import { buildLayoutValidationPanelViewModel } from "../layoutValidationPanelViewModel";
import { ValidationDrawer } from "../ValidationDrawer";
import { buildValidationDrawerViewModel } from "../validationDrawerViewModel";

const warnings: LayoutEditorValidationWarning[] = [
  {
    code: "room_out_of_bounds_left",
    severity: "warning",
    source: "bounds",
    message: "Room extends beyond the layout left boundary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: true
  },
  {
    code: "room_overlap_station",
    severity: "warning",
    source: "collision",
    message: "Room overlaps station station-primary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: "station",
    relatedObjectId: "station-primary",
    isGenerated: true
  },
  {
    code: "door_sync_stale",
    severity: "info",
    source: "door_sync",
    message: "Door sync should be reviewed after this edit.",
    objectType: "door",
    objectId: "door-01",
    relatedObjectType: "room",
    relatedObjectId: "room-01",
    isGenerated: true
  }
];

const panelViewModel = buildLayoutValidationPanelViewModel({ warnings });
const drawerViewModel = buildValidationDrawerViewModel(panelViewModel);

if (drawerViewModel.warningCount !== panelViewModel.warningCount) {
  throw new Error("Validation drawer must preserve the panel warning count");
}
if (drawerViewModel.summaryWarnings.length !== 2) {
  throw new Error("Validation drawer summary should show the top two warnings");
}
if (drawerViewModel.fullWarningKeys.length !== panelViewModel.warnings.length) {
  throw new Error("Validation drawer must preserve every warning key");
}
if (drawerViewModel.groups.length !== 3) {
  throw new Error("Validation drawer should group warnings by source and object");
}

const drawer = ValidationDrawer({ viewModel: drawerViewModel });
if (drawer.type !== "section") {
  throw new Error("ValidationDrawer must render a section");
}
if (drawer.props["data-validation-drawer"] !== "compact-bottom") {
  throw new Error("ValidationDrawer must expose compact-bottom DOM assertion data");
}
if (drawer.props["data-warning-count"] !== 3) {
  throw new Error("ValidationDrawer must expose warning count DOM assertion data");
}

const details = drawer.props.children;
if (details.type !== "details") {
  throw new Error("ValidationDrawer should use a native expandable details element");
}
