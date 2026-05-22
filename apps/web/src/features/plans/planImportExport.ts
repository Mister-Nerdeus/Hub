import { validatePlanContract, type PlanContract } from "@nerdeus/shared";

export function serializePlanForExport(plan: PlanContract): string {
  const validated = validatePlanContract(plan);
  return `${JSON.stringify(validated, null, 2)}\n`;
}

export function parsePlanImport(rawJson: string): PlanContract {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON");
  }
  return validatePlanContract(parsed);
}
