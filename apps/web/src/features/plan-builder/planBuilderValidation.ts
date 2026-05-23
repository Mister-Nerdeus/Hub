import {
  generatePlanFromDefaults,
  validatePlanBuilderDefaultsContract,
  validatePlanContract,
  type PlanContract
} from "@nerdeus/shared";

export type PlanBuilderValidationResult<T> =
  | { ok: true; value: T; error: null }
  | { ok: false; value: null; error: string };

export function validatePlanDraft(plan: unknown): PlanBuilderValidationResult<PlanContract> {
  try {
    return { ok: true, value: validatePlanContract(plan), error: null };
  } catch (error) {
    return { ok: false, value: null, error: formatValidationError(error) };
  }
}

export function tryGeneratePlanFromDefaults(defaults: unknown): PlanBuilderValidationResult<PlanContract> {
  try {
    const validDefaults = validatePlanBuilderDefaultsContract(defaults);
    return { ok: true, value: generatePlanFromDefaults(validDefaults), error: null };
  } catch (error) {
    return { ok: false, value: null, error: formatValidationError(error) };
  }
}

export function applyValidatedPlanDraft(
  previous: PlanContract,
  next: unknown
): { plan: PlanContract; result: PlanBuilderValidationResult<PlanContract> } {
  const result = validatePlanDraft(next);
  return {
    plan: result.ok ? result.value : previous,
    result
  };
}

function formatValidationError(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : "Validation failed for plan builder input.";
}
