import { defaultFloorplanLibraryFixtures } from "../../../fixtures/defaultPlans";
import {
  CANONICAL_FLOORPLAN_ID,
  classifyDefaultFloorplan,
  createCanonicalFloorplanProductViewModel
} from "../canonicalFloorplanViewModel";
import { createFloorplanLibraryViewModel } from "../floorplanLibraryViewModel";

const product = createCanonicalFloorplanProductViewModel();
if (product.canonicalPlanId !== CANONICAL_FLOORPLAN_ID) {
  throw new Error("Plan 1 must be the canonical product floorplan");
}
if (JSON.stringify(product.visibleDefaultPlanIds) !== JSON.stringify([CANONICAL_FLOORPLAN_ID])) {
  throw new Error("normal product mode must expose exactly one default plan");
}
if (product.legacyDefaultPlanIds.length !== 4) {
  throw new Error("Plans 2-5 must remain classified as legacy/reference fixtures");
}
if (!product.legacyContainmentCopy.includes("verification only")) {
  throw new Error("legacy containment copy must be explicit");
}

const classifications = Object.fromEntries(
  defaultFloorplanLibraryFixtures.map((fixture) => [fixture.plan.planId, classifyDefaultFloorplan(fixture)])
);
if (classifications["default-er-layout-plan-1"] !== "canonical-default") {
  throw new Error("Plan 1 must be classified canonical-default");
}
for (const planId of [
  "default-er-layout-plan-2",
  "default-er-layout-plan-3",
  "default-er-layout-plan-4",
  "default-er-layout-plan-5"
]) {
  if (classifications[planId] !== "legacy-default") {
    throw new Error(`${planId} must be classified legacy-default`);
  }
}

const library = createFloorplanLibraryViewModel();
if (library.floorplans.some((floorplan) => floorplan.defaultClassification === "legacy-default")) {
  throw new Error("normal product library must hide legacy defaults");
}
if (library.legacyDefaultFloorplans.length !== 4) {
  throw new Error("legacy fixtures must remain available for developer/reference evidence");
}
