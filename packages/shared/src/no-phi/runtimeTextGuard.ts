export const NO_PHI_RUNTIME_REJECTION_CODE = "NO_PHI_RUNTIME_REJECTION";

type RuntimeTextRule = {
  reason: string;
  pattern: RegExp;
};

const RUNTIME_TEXT_RULES: RuntimeTextRule[] = [
  {
    reason: "record identifier language",
    pattern: /\b(?:m\s*r\s*n|medical record|record number|chart number|visit id|date of birth)\b/i
  },
  {
    reason: "identity-like placeholder name",
    pattern: /\b(?:john|jane)\s+(?:smith|doe)\b/i
  },
  {
    reason: "clinical-note or diagnosis language",
    pattern: /\b(?:diagnosis|chief complaint|clinical note|treatment plan|chest pain|patient identity|patient name)\b/i
  },
  {
    reason: "clinical safety or recommendation language",
    pattern: /\b(?:clinically safe|safe staffing|safety certification|certified safe|recommended|should choose|best scenario)\b/i
  }
];

export function validateOperationalRuntimeText(value: string, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${NO_PHI_RUNTIME_REJECTION_CODE}: ${label} must be text`);
  }
  for (const rule of RUNTIME_TEXT_RULES) {
    if (rule.pattern.test(value)) {
      throw new Error(
        `${NO_PHI_RUNTIME_REJECTION_CODE}: ${label} rejected for ${rule.reason}`
      );
    }
  }
  return value;
}

export function validateOptionalOperationalRuntimeText<T extends string | null | undefined>(
  value: T,
  label: string
): T {
  if (value == null) {
    return value;
  }
  validateOperationalRuntimeText(value, label);
  return value;
}
