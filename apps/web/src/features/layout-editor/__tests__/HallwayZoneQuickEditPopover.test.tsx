import type { EditableHallwayGeometry, EditableZoneGeometry } from "@nerdeus/shared";
import { HallwayZoneQuickEditPopover } from "../HallwayZoneQuickEditPopover";
import { buildHallwayZoneQuickEdit } from "../hallwayZoneQuickEditViewModel";

const hallway: EditableHallwayGeometry = {
  objectType: "hallway",
  id: "hallway-01",
  label: "Main Hallway",
  xFeet: 0,
  yFeet: 0,
  widthFeet: 20,
  heightFeet: 4
};
const zone: EditableZoneGeometry = {
  objectType: "zone",
  id: "zone-provider",
  label: "Provider / Pharmacy",
  xFeet: 2,
  yFeet: 2,
  widthFeet: 8,
  heightFeet: 8,
  zoneType: "provider_pharmacy"
};

const hallwayViewModel = buildHallwayZoneQuickEdit({
  hallway,
  zone: null,
  readOnly: false,
  validationWarningCount: 0
});
if (hallwayViewModel.status !== "hallway" || hallwayViewModel.arrowDirectionHint !== "horizontal") {
  throw new Error("hallway quick edit should expose horizontal arrow hint");
}

const zoneViewModel = buildHallwayZoneQuickEdit({
  hallway: null,
  zone,
  readOnly: true,
  validationWarningCount: 2
});
if (zoneViewModel.status !== "zone" || zoneViewModel.zoneType !== "provider_pharmacy") {
  throw new Error("zone quick edit should expose zone type");
}
if (zoneViewModel.validationStatus !== "2 validation warnings") {
  throw new Error("zone quick edit should expose validation status");
}
const genericZoneViewModel = buildHallwayZoneQuickEdit({
  hallway: null,
  zone: {
    ...zone,
    id: "zone-main-hallways",
    label: "Main Hallway Network",
    zoneType: "operational"
  },
  readOnly: false,
  validationWarningCount: 0
});
if (genericZoneViewModel.canAddSupportAccessPoint) {
  throw new Error("generic operational zones must not expose support access authoring");
}

const calls: string[] = [];
const element = HallwayZoneQuickEditPopover({
  viewModel: hallwayViewModel,
  onLabelChange: () => calls.push("label"),
  onZoneTypeChange: () => calls.push("zone-type"),
  onTogglePresentationVisibility: () => calls.push("visibility")
});

if (element.type !== "div") {
  throw new Error("HallwayZoneQuickEditPopover must render controls");
}
if (element.props["data-hallway-zone-quick-edit"] !== "hallway") {
  throw new Error("HallwayZoneQuickEditPopover must expose selected object state");
}
element.props.children[0].props.children[1].props.onChange({ currentTarget: { value: "Main Hall" } });
if (calls.at(-1) !== "label") {
  throw new Error("hallway label callback missing");
}
element.props.children[3].props.onClick();
if (calls.at(-1) !== "visibility") {
  throw new Error("presentation visibility callback missing");
}
