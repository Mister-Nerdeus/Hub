import { LayoutToolPalette } from "./LayoutToolPalette";

const element = LayoutToolPalette({
  mode: "select",
  selectedRoomType: "patient_room",
  readOnly: false,
  onModeChange: () => undefined,
  onRoomTypeChange: () => undefined,
  onGenerateHallways: () => undefined
});

if (element.type !== "section") {
  throw new Error("LayoutToolPalette must render a section");
}

const readOnlyElement = LayoutToolPalette({
  mode: "select",
  selectedRoomType: "patient_room",
  readOnly: true,
  onCreateWorkingCopy: () => undefined,
  onModeChange: () => undefined,
  onRoomTypeChange: () => undefined,
  onGenerateHallways: () => undefined
});

if (!textContent(readOnlyElement).includes("Canonical fixture is read-only. Create a working copy to edit geometry.")) {
  throw new Error("read-only editor controls must explain why geometry controls are disabled");
}
if (!textContent(readOnlyElement).includes("Create working copy")) {
  throw new Error("read-only editor controls must expose a working-copy CTA");
}

type TestElement = {
  props: Record<string, any>;
};

function textContent(node: unknown): string {
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node == null || typeof node !== "object") return "";
  const props = (node as TestElement).props ?? {};
  const value = props.children;
  return (Array.isArray(value) ? value : [value]).map(textContent).join("");
}
