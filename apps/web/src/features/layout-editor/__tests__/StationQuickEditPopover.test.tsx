import type { EditableStationGeometry } from "@nerdeus/shared";
import { StationQuickEditPopover } from "../StationQuickEditPopover";
import { buildStationQuickEdit } from "../stationQuickEditViewModel";

const station: EditableStationGeometry = {
  objectType: "station",
  id: "station-01",
  label: "Station 01",
  xFeet: 4,
  yFeet: 5,
  widthFeet: 8,
  heightFeet: 4,
  stationType: "nurse_station"
};

const editable = buildStationQuickEdit({ station, readOnly: false, presentation: false });
if (editable.status !== "ready" || editable.stationType !== "nurse_station") {
  throw new Error("station quick edit should expose selected station type");
}
if (editable.presentationStyle !== "standard") {
  throw new Error("station quick edit should expose standard presentation state");
}

const readOnly = buildStationQuickEdit({ station, readOnly: true, presentation: true });
if (!readOnly.readOnly || readOnly.presentationStyle !== "presentation") {
  throw new Error("station quick edit should preserve read-only and presentation state");
}

const calls: string[] = [];
const element = StationQuickEditPopover({
  viewModel: editable,
  onStationTypeChange: () => calls.push("type"),
  onPresentationStyle: () => calls.push("style"),
  onMoveResize: () => calls.push("resize")
});

if (element.type !== "div") {
  throw new Error("StationQuickEditPopover must render station controls");
}
if (element.props["data-station-quick-edit"] !== "ready") {
  throw new Error("StationQuickEditPopover must expose ready DOM assertion data");
}

const children = element.props.children;
children[2].props.children[0].props.onClick();
if (calls.at(-1) !== "style") throw new Error("presentation style callback missing");
children[2].props.children[1].props.onClick();
if (calls.at(-1) !== "resize") throw new Error("move resize callback missing");
