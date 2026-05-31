// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { EditorCommandBar } from "../EditorCommandBar";
import { buildEditorCommandBarViewModel } from "../editorCommandBarViewModel";

declare const process: { cwd(): string };

const viewModel = buildEditorCommandBarViewModel({
  hasActiveFloorplan: true,
  activeCopyName: "ER Pod Main Layout",
  activeRecordId: "saved-default-er-layout-plan-1-001",
  activePlanId: "default-er-layout-plan-1",
  activeSourceLabel: "Saved version",
  localRecoveryDraftLabel: "No local recovery draft for this floorplan",
  lastNamedCopySaveLabel: "No floorplan save this session",
  reloadProofLabel: "Not verified this session",
  isDirty: true,
  readOnly: false,
  undoDisabled: false,
  redoDisabled: true,
  validationSummary: "2 validation warnings",
  validationDisabled: false,
  saveStatus: "Floorplan not saved this session"
});

if (viewModel.saveStatusLabel !== "Not saved since changes") {
  throw new Error("command bar should truthfully expose active floorplan save status for dirty edits");
}
if (viewModel.activeRecordIdLabel !== "saved-default-er-layout-plan-1-001") {
  throw new Error("command bar should expose active saved record identity in advanced status");
}
if (viewModel.dirtyStateLabel !== "Editor state: changed") {
  throw new Error("command bar should expose dirty state");
}
if (viewModel.changedNotSavedWarningLabel == null) {
  throw new Error("command bar should warn when editor changes are not saved to the active floorplan");
}
if (viewModel.addObjectDisabled) {
  throw new Error("editor creation shortcuts should be enabled for editable layouts");
}

const calls: string[] = [];
const element = EditorCommandBar({
  layoutLabel: "proof-layout",
  hasActiveFloorplan: true,
  activeCopyName: "ER Pod Main Layout",
  activeRecordId: "saved-default-er-layout-plan-1-001",
  activePlanId: "default-er-layout-plan-1",
  activeSourceLabel: "Saved version",
  localRecoveryDraftLabel: "No local recovery draft for this floorplan",
  lastNamedCopySaveLabel: "No floorplan save this session",
  reloadProofLabel: "Not verified this session",
  hasLocalRecoveryDraft: true,
  readOnly: false,
  isDirty: true,
  undoDisabled: false,
  redoDisabled: true,
  jsonStatus: "ready",
  saveStatus: "Floorplan not saved this session",
  validationSummary: "2 validation warnings",
  validationDisabled: false,
  inspectorCollapsed: false,
  onUndo: () => {
    calls.push("undo");
  },
  onRedo: () => {
    calls.push("redo");
  },
  onRestoreDraft: () => {
    calls.push("restore-draft");
  },
  onResetDraft: () => {
    calls.push("reset-draft");
  },
  onSaveWorkingCopy: () => {
    calls.push("save-working-copy");
  },
  onSaveAsNewCopy: () => {
    calls.push("save-as-new-copy");
  },
  onDoneEditing: () => {
    calls.push("done-editing");
  },
  onExportJson: () => {
    calls.push("export");
  },
  onImportJson: () => {
    calls.push("import");
  },
  onValidate: () => {
    calls.push("validate");
  },
  onResetView: () => {
    calls.push("reset-view");
  },
  onAddObject: () => {
    calls.push("add-object");
  },
  onAddRoom: () => {
    calls.push("add-room");
  },
  onAddDoor: () => {
    calls.push("add-door");
  },
  onAddSplitRoom: () => {
    calls.push("add-split-room");
  },
  onAddNurseStation: () => {
    calls.push("add-nurse-station");
  },
  onToggleInspector: () => {
    calls.push("toggle-inspector");
  }
});

if (element.type !== "section") {
  throw new Error("EditorCommandBar must render a section");
}
if (element.props["data-editor-command-bar"] !== "consolidated") {
  throw new Error("EditorCommandBar must expose consolidated DOM assertion data");
}

const buttons = collectButtons(element.props.children);
const labels = buttons.map((button) => buttonText(button)).filter(Boolean);

for (const label of ["Save Floorplan", "Done Editing", "Add Room", "Add Door", "Add Split Room", "Add Nurse Station"]) {
  if (!labels.includes(label)) {
    throw new Error(`normal EditorCommandBar toolbar missing ${label}`);
  }
}

for (const label of ["Undo", "Redo", "Save as New Version", "Restore Local Draft", "Reset Local Draft", "Import JSON", "Export JSON Backup", "Add Object", "Validate", "Reset View", "Hide Inspector"]) {
  if (!labels.includes(label)) {
    throw new Error(`advanced EditorCommandBar tools missing ${label}`);
  }
}

const saveButton = findButton(buttons, "Save Floorplan");
clickButton(saveButton, "Save Floorplan");
if (calls.at(-1) !== "save-working-copy") {
  throw new Error("Save Floorplan command should call the save callback");
}

const doneButton = findButton(buttons, "Done Editing");
clickButton(doneButton, "Done Editing");
if (calls.at(-1) !== "done-editing") {
  throw new Error("Done Editing command should call the done callback");
}

const validateButton = findButton(buttons, "Validate");
clickButton(validateButton, "Validate");
if (calls.at(-1) !== "validate") {
  throw new Error("Validate command should call the validation callback");
}

const addRoomButton = findButton(buttons, "Add Room");
clickButton(addRoomButton, "Add Room");
if (calls.at(-1) !== "add-room") {
  throw new Error("Add Room command should call the room callback");
}

const addDoorButton = findButton(buttons, "Add Door");
clickButton(addDoorButton, "Add Door");
if (calls.at(-1) !== "add-door") {
  throw new Error("Add Door command should call the door callback");
}

const addSplitRoomButton = findButton(buttons, "Add Split Room");
clickButton(addSplitRoomButton, "Add Split Room");
if (calls.at(-1) !== "add-split-room") {
  throw new Error("Add Split Room command should call the split-room callback");
}

const addNurseStationButton = findButton(buttons, "Add Nurse Station");
clickButton(addNurseStationButton, "Add Nurse Station");
if (calls.at(-1) !== "add-nurse-station") {
  throw new Error("Add Nurse Station command should call the nurse station callback");
}

const addObjectButton = findButton(buttons, "Add Object");
clickButton(addObjectButton, "Add Object");
if (calls.at(-1) !== "add-object") {
  throw new Error("Advanced Add Object shortcut should call the object callback");
}

const repoRoot = resolve(process.cwd(), "../..");
const commandBarSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/layout-editor/EditorCommandBar.tsx"),
  "utf8"
);

for (const forbidden of ["PIN", "pin gate", "auth", "security"]) {
  if (commandBarSource.includes(forbidden)) {
    throw new Error(`EditorCommandBar should not contain ${forbidden}`);
  }
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

type TestElement = {
  type?: unknown;
  props?: {
    children?: unknown;
    disabled?: boolean;
    onClick?: (() => void) | null;
  };
};

function collectButtons(node: unknown): TestElement[] {
  const buttons: TestElement[] = [];
  for (const child of asArray(node)) {
    if (child == null || typeof child !== "object") continue;
    const element = child as TestElement;
    if (element.type === "button") {
      buttons.push(element);
    }
    if (typeof element.type === "function") {
      buttons.push(...collectButtons(element.type(element.props ?? {})));
    }
    buttons.push(...collectButtons(element.props?.children));
  }
  return buttons;
}

function buttonText(button: TestElement): string {
  return flattenText(button.props?.children).join("");
}

function flattenText(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (typeof node === "number") return [String(node)];
  if (node == null || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(flattenText);
  if (typeof node === "object") return flattenText((node as TestElement).props?.children);
  return [];
}

function findButton(buttons: TestElement[], label: string): Required<TestElement> {
  const button = buttons.find((candidate) => buttonText(candidate) === label);
  if (button == null || button.props == null) {
    throw new Error(`EditorCommandBar missing button ${label}`);
  }
  return button as Required<TestElement>;
}

function clickButton(button: Required<TestElement>, label: string): void {
  if (typeof button.props.onClick !== "function") {
    throw new Error(`EditorCommandBar button ${label} should have an action`);
  }
  button.props.onClick();
}
