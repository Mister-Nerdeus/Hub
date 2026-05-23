import { buildDefaults, createDefaultPlanBuilderDefaultsFormState } from "./planBuilderDefaultsFormState";
import { applyGeneratedPlanPreview, createGeneratedPlanPreviewViewModel } from "./generatedPlanPreviewViewModel";

const validDefaults = buildDefaults(createDefaultPlanBuilderDefaultsFormState());
const preview = createGeneratedPlanPreviewViewModel(validDefaults);
if (!preview.ok || preview.summary.roomCount !== validDefaults.roomDefaults.roomCount) {
  throw new Error("valid defaults must produce a generated plan preview summary");
}

const invalidPreview = createGeneratedPlanPreviewViewModel({
  ...validDefaults,
  roomDefaults: { ...validDefaults.roomDefaults, roomCount: 0 }
});
if (invalidPreview.ok || invalidPreview.error.length === 0) {
  throw new Error("invalid defaults must produce a visible preview error");
}

let appliedPlanId = "";
const applied = applyGeneratedPlanPreview(preview, (plan) => {
  appliedPlanId = plan.planId;
});
if (!applied.ok || appliedPlanId !== validDefaults.defaultsId) {
  throw new Error("apply must expose the generated plan through the callback");
}

const blockedApply = applyGeneratedPlanPreview(invalidPreview, () => {
  throw new Error("invalid preview must not apply");
});
if (blockedApply.ok) {
  throw new Error("invalid preview apply must return ok false");
}
