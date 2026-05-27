import { createDuplicateFloorplanViewModel } from "../duplicateFloorplanViewModel";
import { createFloorplanLibraryViewModel } from "../floorplanLibraryViewModel";
import { createSavedFloorplanStore } from "../savedFloorplanStore";
import {
  canDeleteSavedFloorplan,
  createDeleteSavedFloorplanDialogViewModel
} from "../deleteSavedFloorplanViewModel";
import { DeleteSavedFloorplanDialog } from "../DeleteSavedFloorplanDialog";

const store = createSavedFloorplanStore();
const saved = store.save(createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy);
const library = createFloorplanLibraryViewModel(undefined, store.list());
const canonical = library.floorplans.find((floorplan) => floorplan.defaultClassification === "canonical-default");
const savedCard = library.floorplans.find((floorplan) => floorplan.recordId === saved.recordId);

if (canonical == null || savedCard == null) {
  throw new Error("delete dialog test requires canonical and saved cards");
}
if (canDeleteSavedFloorplan(canonical)) {
  throw new Error("canonical default floorplan must not be delete-capable");
}
if (!canDeleteSavedFloorplan(savedCard)) {
  throw new Error("saved editable copy must be delete-capable");
}

const viewModel = createDeleteSavedFloorplanDialogViewModel(savedCard);
if (
  viewModel.title !== "Delete this saved floorplan copy?" ||
  viewModel.irreversibleCopy !== "This cannot be undone." ||
  viewModel.canonicalUnaffectedCopy !== "The canonical floorplan will not be changed."
) {
  throw new Error("delete dialog copy must match the safety confirmation copy");
}

let confirmedRecordId: string | null = null;
let cancelled = false;
const element = DeleteSavedFloorplanDialog({
  viewModel,
  onCancel: () => { cancelled = true; },
  onConfirm: (recordId) => { confirmedRecordId = recordId; }
});
const buttons = collectButtons(element);
buttons[0]?.props?.onClick?.();
buttons[1]?.props?.onClick?.();

if (!cancelled || confirmedRecordId !== saved.recordId) {
  throw new Error("delete dialog must expose cancel and confirm actions");
}

try {
  createDeleteSavedFloorplanDialogViewModel(canonical);
  throw new Error("canonical default delete dialog should be blocked");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("Only editable saved")) {
    throw error;
  }
}

type TestElement = {
  type?: unknown;
  props?: {
    children?: unknown;
    onClick?: () => void;
  };
};

function collectButtons(node: unknown): TestElement[] {
  if (Array.isArray(node)) return node.flatMap(collectButtons);
  if (node == null || typeof node !== "object") return [];
  const elementNode = node as TestElement;
  const current = elementNode.type === "button" ? [elementNode] : [];
  const children = elementNode.props?.children;
  return current.concat((Array.isArray(children) ? children : [children]).flatMap(collectButtons));
}
