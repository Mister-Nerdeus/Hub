import type { Plan1NurseProfile, PlanContract } from "@nerdeus/shared";
import { validatePlan1NurseProfiles } from "@nerdeus/shared";

import syntheticNursesFixture from "../../../../../packages/shared/fixtures/assignments/plan-1/synthetic-nurses.json" with { type: "json" };

export function getDefaultPlan1SyntheticNurseProfiles(plan: PlanContract): Plan1NurseProfile[] {
  return validatePlan1NurseProfiles(syntheticNursesFixture.nurses, plan);
}
