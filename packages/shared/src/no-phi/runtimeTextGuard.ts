export const NO_PHI_RUNTIME_REJECTION_CODE = "NO_PHI_RUNTIME_REJECTION";

type RuntimeTextRule = {
  reason: string;
  pattern: RegExp;
};

const RUNTIME_TEXT_RULES: RuntimeTextRule[] = [
  {
    reason: "record identifier language",
    pattern: /\b(?:m\s*r\s*n|medical record|record number|chart(?: id| number)?|visit(?: id| number)?|encounter(?: id| number)?|lab(?: id| number| accession)|date of birth|d\s*o\s*b|birth date|born on)\b/i
  },
  {
    reason: "government identifier language",
    pattern: /\b(?:s\s*s\s*n|social security|driver'?s license|passport(?: id| number)?|government id|state id|national id)\b/i
  },
  {
    reason: "contact location or insurance language",
    pattern: /\b(?:phone(?: number)?|telephone|email(?: address)?|home address|street address|mailing address|zip code|insurance(?: id| number| member| policy)?|policy number|member id)\b/i
  },
  {
    reason: "visit workflow identifier language",
    pattern: /\b(?:discharge(?: summary| instructions| paperwork| disposition)?|lab result|chart export|encounter record|visit record)\b/i
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
