import { RoomShape } from "../RoomShape";
import type { RoomShapeViewModel } from "../roomShapeViewModel";
import { PresentationLegend } from "../PresentationLegend";

const baseViewModel: RoomShapeViewModel = {
  objectType: "room",
  objectId: "room-storage",
  ariaLabel: "storage room",
  hitTargetKey: "room:room-storage",
  label: "Storage",
  roomNumber: "Storage",
  roomType: "storage",
  xPixels: 10,
  yPixels: 20,
  widthPixels: 80,
  heightPixels: 60,
  labelX: 50,
  labelY: 50,
  assignmentColor: "#ff0000",
  assignmentLabel: "Nurse Blue",
  burdenLevel: "medium",
  warningState: "none",
  unassignedOccupied: false,
  presentationActive: true
};

const storage = RoomShape({ viewModel: baseViewModel });
if (storage.props["data-presentation-muted"] !== "true") {
  throw new Error("storage room must expose muted presentation DOM state");
}
const storageRect = children(storage)[0] as TestElement;
if (storageRect.props?.style?.fill !== "#b8c0ca") {
  throw new Error("storage room gray style must override assignment color");
}
const storageText = textContent(children(storage)[1]);
if (storageText !== "Storage") {
  throw new Error("storage room visible label must render as Storage");
}

const solidWall = RoomShape({
  viewModel: {
    ...baseViewModel,
    objectId: "room-solid-wall",
    roomType: "solid_wall",
    roomNumber: "Wall"
  }
});
const solidWallRect = children(solidWall)[0] as TestElement;
if (solidWall.props["data-presentation-muted"] !== "true") {
  throw new Error("solid wall must expose muted presentation DOM state");
}
if (solidWallRect.props?.style?.fill !== "#6f7782") {
  throw new Error("solid wall blocked gray style must override assignment color");
}
const solidWallText = textContent(children(solidWall)[1]);
if (solidWallText !== "Wall") {
  throw new Error("solid wall visible label must render as Wall");
}

const legend = PresentationLegend({
  assignmentItems: [{ label: "Nurse Blue", color: "#2563eb" }]
});
const legendText = textContent(legend);
if (!legendText.includes("Storage")) {
  throw new Error("presentation legend must include Storage");
}
if (!legendText.includes("Solid wall / blocked area")) {
  throw new Error("presentation legend must include solid wall blocked area");
}

type TestElement = {
  props: Record<string, any>;
};

function children(element: TestElement): unknown[] {
  const value = element.props.children;
  return Array.isArray(value) ? value : [value];
}

function textContent(node: unknown): string {
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node == null || typeof node !== "object") return "";
  const props = (node as TestElement).props ?? {};
  const value = props.children;
  return (Array.isArray(value) ? value : [value]).map(textContent).join("");
}
