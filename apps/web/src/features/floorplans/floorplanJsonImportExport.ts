import { validatePlanContract, type PlanContract } from "@nerdeus/shared";

const FORBIDDEN_FLOORPLAN_JSON_KEYS = [
  `sourceDocument${"Path"}`,
  `docx${"Binary"}`,
  "binaryData",
  "rawFileContent",
  "base64Content",
  "embeddedDocument"
];

export function exportFloorplanJson(plan: PlanContract): string {
  rejectPrivateDocumentPayload(plan, "floorplan");
  // validatePlanContract preserves authored splitBays in the exported operational JSON.
  const validated = validatePlanContract(plan);
  return `${JSON.stringify(validated, null, 2)}\n`;
}

export function importFloorplanJson(rawJson: string): PlanContract {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON");
  }
  rejectPrivateDocumentPayload(parsed, "floorplan");
  return validatePlanContract(parsed);
}

export function rejectPrivateDocumentPayload(value: unknown, label: string): void {
  if (value == null || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_FLOORPLAN_JSON_KEYS.includes(key)) {
      throw new Error(`${label}.${key} is not allowed in floorplan JSON import/export`);
    }
    rejectPrivateDocumentPayload(child, `${label}.${key}`);
  }
}
