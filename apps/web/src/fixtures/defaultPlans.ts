import type { DefaultSavedPlanFixtureContract, PlanContract } from "@nerdeus/shared";

import defaultErLayoutPlan1 from "../../../../packages/shared/fixtures/default-plans/default-er-layout-plan-1.json" with { type: "json" };
import defaultErLayoutPlan2 from "../../../../packages/shared/fixtures/default-plans/default-er-layout-plan-2.json" with { type: "json" };
import defaultErLayoutPlan3 from "../../../../packages/shared/fixtures/default-plans/default-er-layout-plan-3.json" with { type: "json" };
import defaultErLayoutPlan4 from "../../../../packages/shared/fixtures/default-plans/default-er-layout-plan-4.json" with { type: "json" };
import defaultErLayoutPlan5 from "../../../../packages/shared/fixtures/default-plans/default-er-layout-plan-5.json" with { type: "json" };

export type DefaultPlanFixtureReference = {
  planId: string;
  fixturePath: string;
};

export const defaultPlanFixtureReferences: DefaultPlanFixtureReference[] = [
  {
    planId: "default-er-layout-plan-1",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json"
  },
  {
    planId: "default-er-layout-plan-2",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-2.json"
  },
  {
    planId: "default-er-layout-plan-3",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-3.json"
  },
  {
    planId: "default-er-layout-plan-4",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-4.json"
  },
  {
    planId: "default-er-layout-plan-5",
    fixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-5.json"
  }
];

export const defaultPlanFixtures: DefaultSavedPlanFixtureContract[] = [
  defaultErLayoutPlan1,
  defaultErLayoutPlan2,
  defaultErLayoutPlan3,
  defaultErLayoutPlan4,
  defaultErLayoutPlan5
] as DefaultSavedPlanFixtureContract[];

const defaultPlan1Fixture = defaultPlanFixtures.find(
  (fixture) => fixture.plan.planId === "default-er-layout-plan-1"
);
if (defaultPlan1Fixture == null) {
  throw new Error("default-er-layout-plan-1 fixture must be available for render proof");
}

export const defaultPlan1RenderProofFixture = defaultPlan1Fixture;

export const defaultFloorplanLibraryFixtures: DefaultSavedPlanFixtureContract[] = defaultPlanFixtures;

export const defaultPlanRenderProofPlans: PlanContract[] = defaultPlanFixtures.map(
  (fixture) => fixture.plan
);

export const defaultRoutePreviewProofFixtures: DefaultSavedPlanFixtureContract[] = defaultPlanFixtures;
