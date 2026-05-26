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
const openedReviewCandidates: string[] = [];
const element = PlanBuilderLibrary({
  viewModel: createPlanBuilderLibraryViewModel(),
  onOpenDefaultPlan: (planId) => openedDefaults.push(planId),
  onOpenReviewCandidate: (candidateId) => openedReviewCandidates.push(candidateId)
});

const buttons = collectButtons(element);
const defaultOpenButton = buttons.find((button) => textContent(button) === "Open Plan");
const reviewCandidateButton = buttons.find((button) => textContent(button) === "Open as Active Floorplan");

if (defaultOpenButton == null || reviewCandidateButton == null) {
  throw new Error("Plan Builder library must render actionable active floorplan buttons");
}

defaultOpenButton.props?.onClick?.();
reviewCandidateButton.props?.onClick?.();

if (openedDefaults[0] !== "default-er-layout-plan-1") {
  throw new Error("default fixture action must open the default floorplan without mutation");
}
if (openedReviewCandidates[0] !== "plan-2") {
  throw new Error("review candidate action must open the route-repaired candidate as active");
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
