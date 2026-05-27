import { StationShape } from "../StationShape";
import type { StationShapeViewModel } from "../stationShapeViewModel";

const viewModel: StationShapeViewModel = {
  objectType: "station",
  objectId: "station-primary",
  ariaLabel: "nurse station station-primary",
  hitTargetKey: "station:station-primary",
  label: "Primary nurse station",
  stationType: "nurse_station",
  xPixels: 10,
  yPixels: 20,
  widthPixels: 120,
  heightPixels: 60,
  labelX: 70,
  labelY: 50,
  presentationStyle: "curved_desk",
  presentationPath: "M 10 60 Q 70 20 130 60 L 130 72 Q 70 40 10 72 Z",
  labelPlate: {
    xPixels: 28,
    yPixels: 24,
    widthPixels: 84,
    heightPixels: 20,
    textX: 70,
    textY: 34,
    label: "Nurses station"
  }
};

const selected: string[] = [];
const presentation = StationShape({
  viewModel,
  presentation: true,
  onSelect: (objectType, objectId) => selected.push(`${objectType}:${objectId}`)
});

const presentationText = textContent(presentation);
if (!presentationText.includes("Nurses station")) {
  throw new Error("presentation station must render the label plate text");
}
if (findByClass(presentation, "layout-editor-stage__station-presentation") == null) {
  throw new Error("presentation station must render the curved desk path");
}
if (findByClass(presentation, "layout-editor-stage__station-label-plate") == null) {
  throw new Error("presentation station must render the label plate");
}
if (findByClass(presentation, "layout-editor-stage__station-hit-target") == null) {
  throw new Error("presentation station must preserve a stable hit target");
}
presentation.props?.onClick?.();
presentation.props?.onKeyDown?.({ key: "Enter", preventDefault: () => undefined });
if (selected.length !== 2) {
  throw new Error("station selection must remain clickable and keyboard accessible");
}

const editMode = StationShape({ viewModel, presentation: false });
if (findByClass(editMode, "layout-editor-stage__station-presentation") != null) {
  throw new Error("edit mode must keep rectangular station geometry");
}
if (!textContent(editMode).includes("Primary nurse station")) {
  throw new Error("edit mode must preserve the editable station label");
}

const rectangularPresentation = StationShape({
  viewModel: {
    ...viewModel,
    objectId: "station-desk",
    stationType: "desk",
    presentationStyle: "rectangle",
    labelPlate: {
      ...viewModel.labelPlate,
      label: "Desk"
    }
  },
  presentation: true
});
const rectangularPresentationShape = findByClass(rectangularPresentation, "layout-editor-stage__station-presentation");
if (rectangularPresentationShape?.type !== "rect") {
  throw new Error("rectangle presentation style must render a rectangle instead of the curved desk path");
}

type TestElement = {
  type?: unknown;
  props?: {
    children?: unknown;
    className?: string;
    onClick?: () => void;
    onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
  } & Record<string, unknown>;
};

function findByClass(node: unknown, className: string): TestElement | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findByClass(child, className);
      if (found != null) return found;
    }
    return null;
  }
  if (node == null || typeof node !== "object") return null;
  const element = node as TestElement;
  if (element.props?.className === className) return element;
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findByClass(child, className);
    if (found != null) return found;
  }
  return null;
}

function textContent(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node == null || typeof node !== "object") return "";
  const children = (node as TestElement).props?.children;
  return (Array.isArray(children) ? children : [children]).map(textContent).join("");
}
