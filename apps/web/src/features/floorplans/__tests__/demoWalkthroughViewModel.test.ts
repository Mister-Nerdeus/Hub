import { createDemoWalkthroughViewModel } from "../demoWalkthroughViewModel";

const viewModel = createDemoWalkthroughViewModel();
for (const label of ["Floorplans", "Review Candidates", "Preview", "Review Packet", "Manual Review Helper", "Developer/Evidence"]) {
  if (!viewModel.steps.some((step) => step.label === label)) {
    throw new Error(`demo walkthrough missing ${label}`);
  }
}
if (!JSON.stringify(viewModel).includes("Promotion remains blocked")) {
  throw new Error("demo walkthrough must keep promotion blocked visible");
}
