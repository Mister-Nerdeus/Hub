import { defaultPlanFixtures } from "../../fixtures/defaultPlans";
import { createDuplicateFloorplanViewModel } from "./duplicateFloorplanViewModel";

for (const fixture of defaultPlanFixtures) {
  const viewModel = createDuplicateFloorplanViewModel(fixture.plan.planId);
  if (viewModel.parentDefaultPlanId !== fixture.plan.planId) {
    throw new Error(`duplicate view model parent mismatch for ${fixture.plan.planId}`);
  }
  if (viewModel.copy.readOnly !== false) {
    throw new Error(`duplicate view model copy must be editable for ${fixture.plan.planId}`);
  }
  if (viewModel.copy.parentDefaultPlanId !== fixture.plan.planId) {
    throw new Error(`duplicate copy must record parent default plan for ${fixture.plan.planId}`);
  }
  if (viewModel.copy.plan.planId === fixture.plan.planId) {
    throw new Error(`duplicate copy must receive a new planId for ${fixture.plan.planId}`);
  }
  if (viewModel.copy.plan.rooms.length !== fixture.plan.rooms.length) {
    throw new Error(`duplicate copy must preserve rooms for ${fixture.plan.planId}`);
  }
}

const serialized = JSON.stringify(
  createDuplicateFloorplanViewModel(defaultPlanFixtures[0]?.plan.planId ?? "")
);
for (const fragment of [
  `.${"docx"}`,
  `docs/${"floorplans"}`,
  `sourceDocument${"Path"}`,
  "sourceFilename",
  "ER Layout_plan"
]) {
  if (serialized.includes(fragment)) {
    throw new Error(`duplicate view model must not expose ${fragment}`);
  }
}
