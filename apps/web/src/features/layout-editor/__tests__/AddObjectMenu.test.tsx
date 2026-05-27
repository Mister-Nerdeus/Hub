import { AddObjectMenu } from "../AddObjectMenu";
import { buildAddObjectMenuViewModel } from "../addObjectMenuViewModel";

const viewModel = buildAddObjectMenuViewModel();
const labels = viewModel.items.map((item) => item.label);
for (const label of [
  "Room",
  "Door",
  "Nurse Station / Nurse Desk",
  "Hallway",
  "Zone",
  "Label",
  "Provider/Pharmacy Area",
  "EMS Entry marker"
]) {
  if (!labels.includes(label)) {
    throw new Error(`Add Object menu missing ${label}`);
  }
}

const selected: string[] = [];
const element = AddObjectMenu({
  viewModel,
  readOnly: false,
  onSelect: (itemId) => selected.push(itemId)
});

if (element.type !== "section") {
  throw new Error("AddObjectMenu must render a section");
}
if (element.props["data-add-object-menu"] !== "open") {
  throw new Error("AddObjectMenu must expose open DOM assertion data");
}

const buttons = element.props.children;
buttons[0].props.onClick();
if (selected.at(-1) !== "room") {
  throw new Error("Room menu item should enter room placement mode");
}
buttons[6].props.onClick();
if (selected.at(-1) !== "provider_pharmacy") {
  throw new Error("Provider/Pharmacy Area menu item should be selectable");
}
