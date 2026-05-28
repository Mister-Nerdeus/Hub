import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoomLoadStarterContract,
  buildScenarioCapacityIntegration,
  deterministicDryRunSeedContract,
  dryRunTaskTemplates,
  generateDryRunTaskInstances,
  typicalActivityProfile,
  validateDryRunTaskInstanceSet
} from "../dist/index.js";

function buildFixture() {
  const capacity = buildScenarioCapacityIntegration();
  const roomLoad = buildRoomLoadStarterContract(capacity, 4);
  const generated = generateDryRunTaskInstances({
    roomLoad,
    activityProfile: typicalActivityProfile,
    seedContract: deterministicDryRunSeedContract,
    templates: dryRunTaskTemplates,
    capacity
  });
  return { capacity, roomLoad, generated };
}

test("generates dry-run task instances from occupied room-load assumptions", () => {
  const { capacity, generated } = buildFixture();
  const validated = validateDryRunTaskInstanceSet(generated, { capacity });

  assert.equal(validated.source, "room-load starter synthetic input");
  assert.equal(validated.instances.length, 8);
  assert.ok(
    validated.instances.every((instance) =>
      capacity.assignmentEligibleBedPositionIds.includes(instance.loadableBedPositionId)
    )
  );
});

test("dry-run task generation is deterministic for the same seed", () => {
  const { capacity, roomLoad } = buildFixture();
  const input = {
    roomLoad,
    activityProfile: typicalActivityProfile,
    seedContract: deterministicDryRunSeedContract,
    templates: dryRunTaskTemplates,
    capacity
  };

  assert.deepEqual(generateDryRunTaskInstances(input), generateDryRunTaskInstances(input));
});

test("dry-run task generation changes with a different seed", () => {
  const { capacity, roomLoad } = buildFixture();
  const input = {
    roomLoad,
    activityProfile: typicalActivityProfile,
    seedContract: deterministicDryRunSeedContract,
    templates: dryRunTaskTemplates,
    capacity
  };
  const changed = {
    ...input,
    seedContract: { ...deterministicDryRunSeedContract, seedValue: "dry-run-seed-v0-alt" }
  };

  assert.notDeepEqual(generateDryRunTaskInstances(input), generateDryRunTaskInstances(changed));
});

test("dry-run task validation rejects excluded spaces and duplicate task IDs", () => {
  const { capacity, generated } = buildFixture();

  assert.throws(
    () =>
      validateDryRunTaskInstanceSet(
        {
          ...generated,
          instances: [
            { ...generated.instances[0], loadableBedPositionId: capacity.excludedObjectIds[0] }
          ]
        },
        { capacity }
      ),
    /eligible/
  );

  assert.throws(
    () =>
      validateDryRunTaskInstanceSet(
        {
          ...generated,
          instances: [
            generated.instances[0],
            { ...generated.instances[1], taskInstanceId: generated.instances[0].taskInstanceId }
          ]
        },
        { capacity }
      ),
    /duplicate/
  );
});

test("dry-run generated task instances remain placeholders only", () => {
  const { capacity, generated } = buildFixture();
  const validated = validateDryRunTaskInstanceSet(generated, { capacity });

  assert.ok(validated.instances.every((instance) => instance.clinicalClaim === false));
  assert.ok(validated.instances.every((instance) => instance.outcomePredictionClaim === false));
  assert.ok(validated.instances.every((instance) => instance.optimizerStatus === "not_started"));
  assert.equal(validated.usesRawRoomCounts, false);
  assert.equal(validated.usesStorageOrSupportForTasks, false);
});
