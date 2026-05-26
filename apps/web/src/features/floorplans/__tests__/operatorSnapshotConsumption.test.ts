// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createPlanBuilderLibraryViewModel } from "../planBuilderLibraryViewModel";

declare const process: { cwd(): string };

const source = readFileSync(resolve(process.cwd(), "src/features/floorplans/planBuilderLibraryViewModel.ts"), "utf8");
if (source.includes("createPlanBuilderReviewFlowViewModel")) {
  throw new Error("operator Plan Builder library must not import proof-flow view models");
}
if (source.includes("generated/planBuilderReviewFlowSnapshot")) {
  throw new Error("operator Plan Builder library must not import raw generated proof snapshot");
}

const viewModel = createPlanBuilderLibraryViewModel();
const serialized = JSON.stringify(viewModel);
if (/docs\/verification|docs\/manual-review|manual_review_required|simulation_ready|[a-f0-9]{64}/u.test(serialized)) {
  throw new Error("operator library view model must not expose raw paths, hashes, or raw enum labels");
}
if (!serialized.includes("Promotion blocked")) {
  throw new Error("operator library must keep promotion blocked visible");
}
