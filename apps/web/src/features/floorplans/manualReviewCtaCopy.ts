export const manualReviewAllowedScope = [
  "Inspect operational layout plausibility",
  "Compare rendered preview readability",
  "Check route/export readiness evidence"
] as const;

export const manualReviewForbiddenScope = [
  "Do not record approval in this demo",
  "Do not authorize promotion",
  "Do not certify clinical safety or staffing compliance",
  "Do not treat samples or templates as review records"
] as const;

export const manualReviewPromotionDisabledCopy =
  "Promotion remains disabled until a later explicit promotion-review batch accepts structured human review records.";
