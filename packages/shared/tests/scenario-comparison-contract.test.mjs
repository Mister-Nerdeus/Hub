import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_ER_POD_FLOORPLAN_ID,
  fourToOneAssignmentScenarioTemplate,
  fourToOneScenarioSeedFixture,
  outcomeMetricPlaceholderSet,
  threeToOneAssignmentScenarioTemplate,
  threeToOneScenarioSeedFixture,
  validateAssignmentScenarioTemplateContract,
  validateOutcomeMetricPlaceholderSet,
  validateScenarioSeedContract
} from "../dist/index.js";

test("scenario comparison inputs stay on one floorplan and placeholder outcomes", () => {
  const fourSeed = validateScenarioSeedContract(fourToOneScenarioSeedFixture);
  const threeSeed = validateScenarioSeedContract(threeToOneScenarioSeedFixture);
  const fourTemplate = validateAssignmentScenarioTemplateContract(fourToOneAssignmentScenarioTemplate);
  const threeTemplate = validateAssignmentScenarioTemplateContract(threeToOneAssignmentScenarioTemplate);
  const placeholders = validateOutcomeMetricPlaceholderSet(outcomeMetricPlaceholderSet);

  assert.equal(fourSeed.canonicalFloorplanId, CANONICAL_ER_POD_FLOORPLAN_ID);
  assert.equal(threeSeed.canonicalFloorplanId, CANONICAL_ER_POD_FLOORPLAN_ID);
  assert.equal(fourTemplate.canonicalFloorplanId, CANONICAL_ER_POD_FLOORPLAN_ID);
  assert.equal(threeTemplate.canonicalFloorplanId, CANONICAL_ER_POD_FLOORPLAN_ID);
  assert.ok(placeholders.metrics.every((metric) => metric.computed === false));
});
