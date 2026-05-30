import { AddObjectMenu } from "../AddObjectMenu";
import { buildAddObjectMenuViewModel } from "../addObjectMenuViewModel";

const viewModel = buildAddObjectMenuViewModel();
const labels = viewModel.items.map((item) => item.label);
for (const label of [
  "Patient Care Room",
  "Storage Room",
  "Solid Wall / Blocked Area",
  "Door",
  "Nurse Station / Nurse Desk",
  "Hallway",
  "Zone",
  "Label",
  "Provider/Pharmacy Area",
  "EMS Entry marker",
  "Split Bay"
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
if (selected.at(-1) !== "patient_care_room") {
  throw new Error("Patient Care Room menu item should enter room placement mode");
}
buttons[8].props.onClick();
if (selected.at(-1) !== "provider_pharmacy") {
  throw new Error("Provider/Pharmacy Area menu item should be selectable");
}
