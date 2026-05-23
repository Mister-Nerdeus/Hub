import { buildPlanGenerationPreview, type PlanContract, type PlanGenerationSummary } from "@nerdeus/shared";

import type { PlanBuilderValidationResult } from "./planBuilderValidation";

export type GeneratedPlanPreviewViewModel =
  | {
      ok: true;
      plan: PlanContract;
      summary: PlanGenerationSummary;
      error: null;
    }
  | {
      ok: false;
      plan: null;
      summary: null;
      error: string;
    };

export function createGeneratedPlanPreviewViewModel(defaults: unknown): GeneratedPlanPreviewViewModel {
  try {
    const preview = buildPlanGenerationPreview(defaults as never);
    return { ok: true, plan: preview.plan, summary: preview.summary, error: null };
  } catch (error) {
    return {
      ok: false,
      plan: null,
      summary: null,
      error: error instanceof Error ? error.message : "Unable to generate preview."
    };
  }
}

export function applyGeneratedPlanPreview(
  preview: GeneratedPlanPreviewViewModel,
  applyPlan: (plan: PlanContract) => void
): PlanBuilderValidationResult<PlanContract> {
  if (!preview.ok) {
    return { ok: false, value: null, error: preview.error };
  }
  applyPlan(preview.plan);
  return { ok: true, value: preview.plan, error: null };
}
