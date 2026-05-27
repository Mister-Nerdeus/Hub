import { LegacyFloorplanReferenceList } from "../LegacyFloorplanReferenceList";
import { createFloorplanLibraryViewModel } from "../floorplanLibraryViewModel";

type TestElement = {
  type?: unknown;
  props?: {
    children?: unknown;
  } & Record<string, unknown>;
};

const viewModel = createFloorplanLibraryViewModel();
const element = LegacyFloorplanReferenceList({ floorplans: viewModel.legacyDefaultFloorplans }) as TestElement;
const text = textContent(element);

if (!text.includes("Legacy fixtures are retained for verification only.")) {
  throw new Error("legacy reference list must explain verification-only containment");
}
if (!text.includes("The product uses one canonical floorplan.")) {
  throw new Error("legacy reference list must reinforce one canonical product floorplan");
}
for (const planId of [
  "default-er-layout-plan-2",
  "default-er-layout-plan-3",
  "default-er-layout-plan-4",
  "default-er-layout-plan-5"
]) {
  if (!text.includes(planId)) {
    throw new Error(`${planId} must be visible in developer/reference evidence`);
  }
}
if (text.includes("default-er-layout-plan-1")) {
  throw new Error("legacy reference list must not include the canonical Plan 1 entry");
}

function textContent(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node == null || typeof node !== "object") return "";
  const children = (node as TestElement).props?.children;
  return (Array.isArray(children) ? children : [children]).map(textContent).join("");
}
