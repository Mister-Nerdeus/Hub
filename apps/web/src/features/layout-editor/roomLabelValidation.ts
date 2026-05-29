export type RoomLabelValidationResult =
  | { status: "accepted"; value: string }
  | { status: "rejected"; reason: string };

const FORBIDDEN_PATTERNS: readonly [RegExp, string][] = [
  [/\bmrn\b|\bmedical record\b/i, "Record identifier wording is not allowed."],
  [/\bDOB\b|\bdate of birth\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/i, "Birth-date style wording is not allowed."],
  [/\b\d{3}-\d{2}-\d{4}\b/u, "Government identifier style wording is not allowed."],
  [/\b\d{3}[-.]\d{3}[-.]\d{4}\b/u, "Contact detail style wording is not allowed."],
  [/\bdiagnosis\b|\bchief complaint\b|\bclinical note\b|\bmedication\b/i, "Clinical note style wording is not allowed."],
  [/\bpatient\b|\bvisitor\b|\bencounter\b|\bchart\b|\bvisit\b/i, "Patient-identifying workflow wording is not allowed."]
];

export function validateRoomOperationalLabel(value: string): RoomLabelValidationResult {
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (normalized.length === 0) {
    return { status: "rejected", reason: "Operational label is required." };
  }
  if (normalized.length > 48 || normalized.split(/\s+/u).length > 8) {
    return { status: "rejected", reason: "Use a short operational label." };
  }
  for (const [pattern, reason] of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) {
      return { status: "rejected", reason };
    }
  }
  return { status: "accepted", value: normalized };
}

export function validateRoomOperationalNumber(value: string): RoomLabelValidationResult {
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (normalized.length === 0) {
    return { status: "rejected", reason: "Room number is required." };
  }
  return validateRoomOperationalLabel(normalized);
}
