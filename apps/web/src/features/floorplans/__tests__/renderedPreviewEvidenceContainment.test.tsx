import { DeveloperEvidencePanel } from "../DeveloperEvidencePanel";
import { RenderedPlanPreviewPanel } from "../RenderedPlanPreviewPanel";
import { createDeveloperEvidenceViewModel } from "../developerEvidenceViewModel";
import { createRenderedPlanPreviewViewModel } from "../renderedPlanPreviewViewModel";

const preview = createRenderedPlanPreviewViewModel();
const previewPayload = JSON.stringify(preview);
if (/[a-f0-9]{64}/u.test(previewPayload)) {
  throw new Error("operator rendered preview view model must not expose raw hashes");
}
if (!previewPayload.includes("Evidence verified") || !previewPayload.includes("Metadata verified")) {
  throw new Error("operator rendered preview must expose safe verification labels");
}

const developer = createDeveloperEvidenceViewModel("developer");
if (!/[a-f0-9]{64}/u.test(JSON.stringify(developer))) {
  throw new Error("developer evidence must retain raw hashes");
}

const previewElement = RenderedPlanPreviewPanel({ viewModel: preview });
if (/[a-f0-9]{64}/u.test(JSON.stringify(previewElement))) {
  throw new Error("operator rendered preview component must not render raw hashes");
}

const developerElement = DeveloperEvidencePanel({ viewModel: developer });
if (!/[a-f0-9]{64}/u.test(JSON.stringify(developerElement))) {
  throw new Error("developer evidence component must render hashes in developer mode");
}
