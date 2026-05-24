import {
  duplicateDefaultPlan,
  type DefaultSavedPlanFixtureContract,
  type EditableFloorplanCopy
} from "@nerdeus/shared";

import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";

export type DuplicateFloorplanViewModel = {
  parentDefaultPlanId: string;
  editablePlanId: string;
  editableName: string;
  canDuplicate: boolean;
  copy: EditableFloorplanCopy;
};

export function createDuplicateFloorplanViewModel(
  parentDefaultPlanId: string,
  fixtures: DefaultSavedPlanFixtureContract[] = defaultFloorplanLibraryFixtures
): DuplicateFloorplanViewModel {
  const fixture = fixtures.find((candidate) => candidate.plan.planId === parentDefaultPlanId);
  if (fixture == null) {
    throw new Error(`Unknown default JSON floorplan: ${parentDefaultPlanId}`);
  }
  const editablePlanId = `editable-${fixture.plan.planId}`;
  const editableName = `${fixture.plan.name} Copy`;
  const copy = duplicateDefaultPlan(fixture, {
    planId: editablePlanId,
    name: editableName,
    createdAt: "2026-05-24T10:00:00Z"
  });

  return {
    parentDefaultPlanId,
    editablePlanId,
    editableName,
    canDuplicate: true,
    copy
  };
}
