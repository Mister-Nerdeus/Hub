import { DefaultPlanEditCopyControls } from "./DefaultPlanEditCopyControls";

let duplicatedPlanId: string | null = null;
const element = DefaultPlanEditCopyControls({
  planId: "default-er-layout-plan-1",
  readOnly: true,
  onDuplicateForEditing: (planId) => {
    duplicatedPlanId = planId;
  }
});

if (element.type !== "section") {
  throw new Error("DefaultPlanEditCopyControls must render a section");
}
if (duplicatedPlanId != null) {
  throw new Error("DefaultPlanEditCopyControls must not duplicate during render");
}
