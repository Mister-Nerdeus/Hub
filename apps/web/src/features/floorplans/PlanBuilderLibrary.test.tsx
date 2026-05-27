import { PlanBuilderLibrary } from "./PlanBuilderLibrary";
import { createPlanBuilderLibraryViewModel } from "./planBuilderLibraryViewModel";

type TestElement = {
  type?: unknown;
  props?: {
    children?: unknown;
    onClick?: () => void;
  };
};

const openedDefaults: string[] = [];
const element = PlanBuilderLibrary({
  viewModel: createPlanBuilderLibraryViewModel(),
  onOpenDefaultPlan: (planId) => openedDefaults.push(planId)
});

const buttons = collectButtons(element);
const defaultOpenButton = buttons.find((button) => textContent(button) === "Open Plan");
const activeLegacyButtons = buttons.filter((button) =>
  ["Open as Active Floorplan", "Open Saved Copy"].includes(textContent(button))
);

if (defaultOpenButton == null) {
  throw new Error("Plan Builder library must render an active floorplan button for canonical Plan 1");
}
if (activeLegacyButtons.length !== 0) {
  throw new Error("Plan Builder library must not render active floorplan buttons for legacy Plans 2-5");
}

defaultOpenButton.props?.onClick?.();

if (openedDefaults[0] !== "default-er-layout-plan-1") {
  throw new Error("default fixture action must open the default floorplan without mutation");
}

function collectButtons(node: unknown): TestElement[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectButtons);
  }
  if (node == null || typeof node !== "object") {
    return [];
  }
  const elementNode = node as TestElement;
  const current = elementNode.type === "button" ? [elementNode] : [];
  return current.concat(childrenOf(elementNode).flatMap(collectButtons));
}

function childrenOf(elementNode: TestElement): unknown[] {
  const children = elementNode.props?.children;
  return Array.isArray(children) ? children : [children];
}

function textContent(node: unknown): string {
  if (typeof node === "string") {
    return node;
  }
  if (node == null || typeof node !== "object") {
    return "";
  }
  return childrenOf(node as TestElement).map(textContent).join("");
}
