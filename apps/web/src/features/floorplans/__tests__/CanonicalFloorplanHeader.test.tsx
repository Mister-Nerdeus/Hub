import { createEmptyActiveFloorplanState, createActiveFloorplanSummaryViewModel } from "../activeFloorplanState";
import { CanonicalFloorplanHeader } from "../CanonicalFloorplanHeader";
import { createCanonicalFloorplanHeaderViewModel } from "../canonicalFloorplanHeaderViewModel";

const viewModel = createCanonicalFloorplanHeaderViewModel({
  activeFloorplan: createActiveFloorplanSummaryViewModel(createEmptyActiveFloorplanState()),
  savedFloorplans: []
});

if (viewModel.title !== "Canonical ER Pod Floorplan") {
  throw new Error("canonical floorplan header title must be explicit");
}
if (viewModel.ratioLayeringCopy !== "4:1 / 3:1 scenarios use this same floorplan.") {
  throw new Error("canonical header must explain ratio scenarios use the same floorplan");
}
if (!viewModel.exactCadNonClaim.includes("Not exact CAD")) {
  throw new Error("canonical header must avoid exact CAD parity claims");
}
if (!viewModel.staffingComplianceNonClaim.includes("Not staffing compliance certification")) {
  throw new Error("canonical header must avoid staffing compliance certification claims");
}

const element = CanonicalFloorplanHeader({ viewModel });
if (textContent(element).includes("approved") || textContent(element).includes("certifies")) {
  throw new Error("canonical header must not claim manual approval or certification");
}

type TestElement = { props?: { children?: unknown } };

function textContent(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node == null || typeof node !== "object") return "";
  const children = (node as TestElement).props?.children;
  return (Array.isArray(children) ? children : [children]).map(textContent).join("");
}
