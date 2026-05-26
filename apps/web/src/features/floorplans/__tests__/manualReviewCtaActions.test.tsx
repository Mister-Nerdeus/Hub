import { ManualReviewCtaPanel } from "../ManualReviewCtaPanel";
import { createManualReviewCtaViewModel } from "../manualReviewCtaViewModel";

type TestElement = {
  type?: unknown;
  props?: {
    children?: unknown;
    onClick?: () => void;
    "data-artifact-href"?: string;
  };
};

const viewModel = createManualReviewCtaViewModel();
if (viewModel.plans.some((plan) => plan.actions.length === 0)) {
  throw new Error("manual review CTA must not expose no-op action groups");
}
if (viewModel.plans.some((plan) => plan.actions.some((action) => /promotion/iu.test(action.label) || /promotion/iu.test(action.safeHref)))) {
  throw new Error("manual review CTA actions must not include promotion actions");
}

const opened: string[] = [];
const originalWindow = globalThis.window;
Object.defineProperty(globalThis, "window", {
  value: { open: (href: string) => opened.push(href) },
  configurable: true
});

const element = ManualReviewCtaPanel({ viewModel });
const buttons = collectButtons(element);
const packetButton = buttons.find((button) => textContent(button) === "Open review packet");
packetButton?.props?.onClick?.();

Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });

if (opened.length !== 1 || !(opened[0] ?? "").includes("/plan-builder-review-flow/review-packets/")) {
  throw new Error("manual review CTA packet action must open a safe artifact href");
}
if (buttons.some((button) => button.props?.["data-artifact-href"] == null)) {
  throw new Error("manual review CTA buttons must carry safe artifact hrefs");
}

function collectButtons(node: unknown): TestElement[] {
  if (Array.isArray(node)) return node.flatMap(collectButtons);
  if (node == null || typeof node !== "object") return [];
  const elementNode = node as TestElement;
  const current = elementNode.type === "button" ? [elementNode] : [];
  return current.concat(childrenOf(elementNode).flatMap(collectButtons));
}

function childrenOf(elementNode: TestElement): unknown[] {
  const children = elementNode.props?.children;
  return Array.isArray(children) ? children : [children];
}

function textContent(node: unknown): string {
  if (typeof node === "string") return node;
  if (node == null || typeof node !== "object") return "";
  return childrenOf(node as TestElement).map(textContent).join("");
}
