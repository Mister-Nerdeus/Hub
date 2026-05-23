import { validatePlanContract } from "@nerdeus/shared";

import { planErPodPhase2 } from "../../fixtures/planErPodPhase2";
import { createDefaultPlanBuilderDefaultsFormState, buildDefaults } from "./planBuilderDefaultsFormState";
import { tryGeneratePlanFromDefaults, validatePlanDraft } from "./planBuilderValidation";

const validPlan = validatePlanContract(planErPodPhase2);

const validDraft = validatePlanDraft(validPlan);
if (!validDraft.ok) {
  throw new Error("valid plan draft must return ok true");
}

const invalidDraft = validatePlanDraft({ ...validPlan, rooms: "bad" });
if (invalidDraft.ok || invalidDraft.error.length === 0) {
  throw new Error("invalid plan draft must expose a visible error");
}

const validDefaults = buildDefaults(createDefaultPlanBuilderDefaultsFormState());
const generated = tryGeneratePlanFromDefaults(validDefaults);
if (!generated.ok || generated.value.rooms.length === 0) {
  throw new Error("valid defaults must generate a valid plan result");
}

const invalidDefaults = {
  ...validDefaults,
  roomDefaults: { ...validDefaults.roomDefaults, roomCount: 0 }
};
const invalidGenerated = tryGeneratePlanFromDefaults(invalidDefaults);
if (invalidGenerated.ok || invalidGenerated.error.length === 0) {
  throw new Error("invalid defaults must expose a visible error");
}
