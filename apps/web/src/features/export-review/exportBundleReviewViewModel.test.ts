import { createExportBundleReviewViewModel } from "./exportBundleReviewViewModel";
import {
  invalidPhase8ExportBundleJsonText,
  phase8ExportBundleJsonText
} from "../../fixtures/phase8ExportBundleReview";

const viewModel = createExportBundleReviewViewModel({
  validJsonText: phase8ExportBundleJsonText,
  invalidJsonText: invalidPhase8ExportBundleJsonText
});

if (viewModel.operationalOnlyLabel !== "Operational-only local export bundle review") {
  throw new Error("operational-only label missing");
}

if (!viewModel.validReview.ok) {
  throw new Error("valid bundle summary missing");
}

if (viewModel.validReview.summary.reportCount !== 2) {
  throw new Error("valid bundle report count missing");
}

if (viewModel.validReview.summary.scenarioIds.length === 0) {
  throw new Error("scenario IDs missing");
}

if (viewModel.validReview.summary.scenarioIds.join(",") !== "shift-scenario-basic,shift-scenario-surge") {
  throw new Error("scenario IDs must be deterministic");
}

if (viewModel.validReview.summary.reportIds.length === 0) {
  throw new Error("report IDs missing");
}

if (
  viewModel.validReview.summary.reportIds.join(",") !==
  "operational-summary-generated-task-set-basic,operational-summary-generated-task-set-surge"
) {
  throw new Error("report IDs must be deterministic");
}

if (!viewModel.validReview.summary.hasComparison) {
  throw new Error("comparison presence missing");
}

if (viewModel.validReview.summary.limitations.length === 0) {
  throw new Error("limitations missing");
}

if (viewModel.invalidReview.ok) {
  throw new Error("invalid bundle error path missing");
}

if (!viewModel.invalidReview.error.includes("Invalid report export bundle JSON")) {
  throw new Error("invalid bundle parse error missing");
}
