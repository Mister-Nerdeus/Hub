import { createScenarioComparisonProofViewModel } from "./scenarioComparisonViewModel";
import {
  phase7ComparisonProofFixture,
  type Phase7ComparisonProofFixture
} from "../../fixtures/phase7ComparisonProof";

const viewModel = createScenarioComparisonProofViewModel();

if (!viewModel.label.toLowerCase().includes("operational-only")) {
  throw new Error("comparison proof must label outputs operational-only");
}

if (viewModel.baseline == null || !viewModel.baseline.isBaseline) {
  throw new Error("baseline section missing");
}

if (viewModel.baseline.reportId !== viewModel.comparison.baselineReportId) {
  throw new Error("baseline section must use comparison baseline report");
}

if (viewModel.comparisonRows.length < 2) {
  throw new Error("comparison rows missing");
}

if (viewModel.comparisonRows.at(0)?.reportId !== viewModel.comparison.baselineReportId) {
  throw new Error("comparison rows must keep baseline first");
}

if (viewModel.exportBundle.exportType !== "operational_report_bundle") {
  throw new Error("export bundle preview missing");
}

if (!viewModel.exportJsonPreview.includes("\"operational_report_bundle\"")) {
  throw new Error("export JSON preview missing");
}

if (viewModel.limitations.length === 0) {
  throw new Error("limitations missing");
}

const limitationText = viewModel.limitations.join(" ").toLowerCase();
if (!limitationText.includes("operational-only")) {
  throw new Error("operational-only language missing");
}

if (!limitationText.includes("no optimizer")) {
  throw new Error("limitations must include no optimizer language");
}

if (!limitationText.includes("no scenario recommendation")) {
  throw new Error("limitations must include no recommendation language");
}

if (!limitationText.includes("no clinical safety claim")) {
  throw new Error("limitations must include no clinical safety claim language");
}

if (viewModel.exportPreview.reportCount !== 2) {
  throw new Error("export bundle preview must include report count");
}

const recommendationFixture = structuredClone(
  phase7ComparisonProofFixture
) as Phase7ComparisonProofFixture;
recommendationFixture.comparisonLabel = "Recommended scenario comparison";

let rejectedRecommendationLanguage = false;
try {
  createScenarioComparisonProofViewModel(recommendationFixture);
} catch {
  rejectedRecommendationLanguage = true;
}

if (!rejectedRecommendationLanguage) {
  throw new Error("recommendation language not blocked");
}
