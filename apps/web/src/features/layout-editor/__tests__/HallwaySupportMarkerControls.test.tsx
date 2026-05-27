import type { EditableHallwayGeometry, EditableZoneGeometry } from "@nerdeus/shared";
import { HallwayArrowEditor } from "../HallwayArrowEditor";
import { buildHallwayArrowEditorViewModel } from "../hallwayArrowEditorViewModel";
import { SupportMarkerEditor } from "../SupportMarkerEditor";
import { buildSupportMarkerEditorViewModel, validateSupportMarkerLabel } from "../supportMarkerEditorViewModel";

const hallway: EditableHallwayGeometry = {
  objectType: "hallway",
  id: "hall-01",
  label: "Hall 01",
  xFeet: 0,
  yFeet: 0,
  widthFeet: 30,
  heightFeet: 6
};
const arrowViewModel = buildHallwayArrowEditorViewModel({ hallway, readOnly: false });
if (arrowViewModel.status !== "ready" || !arrowViewModel.hintCopy.includes("presentation hints only")) {
  throw new Error("hallway arrow editor should expose presentation-hint copy");
}
const calls: string[] = [];
const arrowElement = HallwayArrowEditor({
  viewModel: arrowViewModel,
  onReverse: () => calls.push("reverse"),
  onHide: () => calls.push("hide"),
  onShow: () => calls.push("show")
});
arrowElement.props.children[2].props.onClick();
arrowElement.props.children[3].props.onClick();
if (calls.join(",") !== "reverse,hide") throw new Error("arrow controls should reverse and hide");

const zone: EditableZoneGeometry = {
  objectType: "zone",
  id: "zone-ems",
  label: "EMS Entry",
  zoneType: "ems_entry",
  xFeet: 0,
  yFeet: 0,
  widthFeet: 10,
  heightFeet: 10
};
const markerViewModel = buildSupportMarkerEditorViewModel({ zone, readOnly: false });
if (markerViewModel.markerKindLabel !== "EMS Entry marker" || markerViewModel.validationMessage !== "Operational label accepted.") {
  throw new Error("support marker editor should expose marker kind and text validation");
}
if (validateSupportMarkerLabel("medical record marker") !== "Label rejected by operational text guard.") {
  throw new Error("support marker labels must reject PHI-like text");
}
const markerElement = SupportMarkerEditor({
  viewModel: markerViewModel,
  onLabelChange: (label) => calls.push(label),
  onTogglePresentationVisibility: () => calls.push("visibility")
});
markerElement.props.children[1].props.children[1].props.onChange({ currentTarget: { value: "Provider Pharmacy" } });
markerElement.props.children[2].props.onClick();
if (calls.at(-2) !== "Provider Pharmacy" || calls.at(-1) !== "visibility") {
  throw new Error("support marker controls should edit label and presentation visibility");
}
