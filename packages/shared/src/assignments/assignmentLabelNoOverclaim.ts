export const ASSIGNMENT_LABEL_FORBIDDEN_TERMS = [
  "recommended",
  "recommendation",
  "best",
  "optimal",
  "optimized",
  "optimizer",
  "score",
  "burden",
  "workload",
  "balanced",
  "fairness",
  "safer",
  "unsafe",
  "clinical safety",
  "staffing compliance",
  "patient outcome",
  "simulation",
  "risk score",
  "acuity safe"
] as const;

export function validateAssignmentLabelNoOverclaim(value: string, label: string): string {
  const normalized = value.toLowerCase();
  const finding = ASSIGNMENT_LABEL_FORBIDDEN_TERMS.find((term) => normalized.includes(term));
  if (finding != null) {
    throw new Error(`${label} must not contain assignment overclaim language`);
  }
  return value;
}
