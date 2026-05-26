import { assertSafeArtifactHref, buildReviewArtifactAction } from "../reviewArtifactLinks";

const packet = buildReviewArtifactAction("plan-2", "review-packet", "Open review packet");
const template = buildReviewArtifactAction("plan-2", "review-template", "Open review template");
const rendered = buildReviewArtifactAction("plan-2", "rendered-preview", "View rendered preview");
const evidence = buildReviewArtifactAction("plan-2", "developer-evidence", "View evidence");

for (const action of [packet, template, rendered, evidence]) {
  if (!action.safeHref.startsWith("/")) throw new Error("safe artifact href must be app-relative");
  if (action.safeHref.toLowerCase().includes("source") || action.safeHref.toLowerCase().endsWith([".", "docx"].join(""))) {
    throw new Error("safe artifact href must not expose source or DOCX artifacts");
  }
}

for (const href of [`../docs/manual-review/plan.${"docx"}`, `file:///private/source.${"docx"}`, "/private/source.png", "/promotion/enable"]) {
  try {
    assertSafeArtifactHref(href);
    throw new Error(`unsafe href accepted: ${href}`);
  } catch (error) {
    if (!(error instanceof Error) || !/unsafe review artifact/u.test(error.message)) {
      throw error;
    }
  }
}
