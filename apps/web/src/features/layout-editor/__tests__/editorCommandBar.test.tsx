// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { EditorCommandBar } from "../EditorCommandBar";
import { buildEditorCommandBarViewModel } from "../editorCommandBarViewModel";

declare const process: { cwd(): string };

const viewModel = buildEditorCommandBarViewModel({
  isDirty: true,
  readOnly: false,
  undoDisabled: false,
  redoDisabled: true,
  validationSummary: "2 validation warnings",
  validationDisabled: false
});

if (viewModel.saveStatusLabel !== "Save status placeholder") {
  throw new Error("command bar should expose a save status placeholder");
}
if (viewModel.dirtyStateLabel !== "Draft changed") {
  throw new Error("command bar should expose dirty state");
}
if (viewModel.addObjectDisabled) {
  throw new Error("Add Object shortcut should be enabled for editable layouts");
}
if (!viewModel.proceedDisabled || viewModel.proceedStatusLabel !== "Future step") {
  throw new Error("Proceed control must remain a disabled future placeholder");
}

const calls: string[] = [];
const element = EditorCommandBar({
  layoutLabel: "proof-layout",
  readOnly: false,
  isDirty: true,
  undoDisabled: false,
  redoDisabled: true,
  jsonStatus: "ready",
  validationSummary: "2 validation warnings",
  validationDisabled: false,
  inspectorCollapsed: false,
  onUndo: () => {
    calls.push("undo");
  },
  onRedo: () => {
    calls.push("redo");
  },
  onResetDraft: () => {
    calls.push("reset-draft");
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

const commandGroups = element.props.children.slice(0, 6);
const labels = commandGroups
  .flatMap((group: { props: { children: unknown | unknown[] } }) => asArray(group.props.children))
  .filter((child: { props?: { children?: string } }) => child?.props?.children != null)
  .map((child: { props: { children: string } }) => child.props.children);

for (const label of ["Undo", "Redo", "Reset draft", "Import JSON", "Export", "Add Object", "Validate", "Reset view", "Proceed later"]) {
  if (!labels.includes(label)) {
    throw new Error(`EditorCommandBar missing ${label}`);
  }
}

const validateButton = asArray(commandGroups[3].props.children)[0];
validateButton.props.onClick();
if (calls.at(-1) !== "validate") {
  throw new Error("Validate command should call the validation callback");
}

const addObjectButton = asArray(commandGroups[2].props.children)[0];
addObjectButton.props.onClick();
if (calls.at(-1) !== "add-object") {
  throw new Error("Add Object shortcut should call the object callback");
}

const proceedButton = asArray(commandGroups[5].props.children)[0];
if (proceedButton.props.disabled !== true || proceedButton.props.onClick != null) {
  throw new Error("Proceed placeholder must be disabled without an action");
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
