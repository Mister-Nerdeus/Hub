import { createManualReviewCtaViewModel } from "../manualReviewCtaViewModel";

const viewModel = createManualReviewCtaViewModel();
if (viewModel.plans.length !== 4) throw new Error("manual review CTA must include Plans 2 through 5");
const serialized = JSON.stringify(viewModel);
if (/approval complete|approved for promotion|promotion complete/iu.test(serialized)) {
  throw new Error("manual review CTA must not imply approval or completed promotion");
}
if (!serialized.includes("Promotion blocked")) throw new Error("manual review CTA must keep promotion blocked visible");
