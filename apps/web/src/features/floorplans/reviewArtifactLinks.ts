import type { OperationalDemoPlanId } from "@nerdeus/shared";

export type ReviewArtifactKind =
  | "review-packet"
  | "review-template"
  | "rendered-preview"
  | "developer-evidence";

export type ReviewArtifactAction = {
  label: string;
  kind: ReviewArtifactKind;
  safeArtifactId: string;
  safeHref: string;
};

const PLAN_IDS = new Set<string>(["plan-2", "plan-3", "plan-4", "plan-5"]);

export function buildReviewArtifactAction(
  planId: OperationalDemoPlanId,
  kind: ReviewArtifactKind,
  label: string
): ReviewArtifactAction {
  if (!PLAN_IDS.has(planId)) {
    throw new Error(`unsupported review artifact plan: ${planId}`);
  }
  const safeArtifactId = `${planId}:${kind}`;
  const safeHref = safeHrefFor(planId, kind);
  assertSafeArtifactHref(safeHref);
  return { label, kind, safeArtifactId, safeHref };
}

export function assertSafeArtifactHref(href: string): void {
  const lowered = href.toLowerCase();
  if (
    href.length === 0 ||
    href.startsWith("http:") ||
    href.startsWith("https:") ||
    href.startsWith("file:") ||
    href.startsWith("/") === false ||
    href.includes("\\") ||
    href.includes("..") ||
    /^[a-z]:/iu.test(href) ||
    lowered.includes("private") ||
    lowered.includes("source") ||
    lowered.endsWith([".", "docx"].join("")) ||
    lowered.includes("promotion")
  ) {
    throw new Error(`unsafe review artifact href: ${href}`);
  }
}

function safeHrefFor(planId: OperationalDemoPlanId, kind: ReviewArtifactKind): string {
  if (kind === "review-packet") {
    return `/plan-builder-review-flow/review-packets/${planId}-review-packet.html`;
  }
  if (kind === "review-template") {
    return `/plan-builder-review-flow/review-templates/${planId}-review-record-template.json`;
  }
  if (kind === "rendered-preview") {
    return `/plan-builder-review-flow/rendered-plans/${planId}-rendered-review.png`;
  }
  return `/?section=developer-evidence#${planId}-evidence`;
}
