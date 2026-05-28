import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDryRunQueuePlaceholder,
  buildRoomLoadStarterContract,
  buildScenarioCapacityIntegration,
  deterministicDryRunSeedContract,
  dryRunTaskTemplates,
  generateDryRunTaskInstances,
  typicalActivityProfile,
  validateDryRunQueuePlaceholder
} from "../dist/index.js";

function buildQueue() {
  const capacity = buildScenarioCapacityIntegration();
  const roomLoad = buildRoomLoadStarterContract(capacity, 4);
  const taskSet = generateDryRunTaskInstances({
    roomLoad,
    activityProfile: typicalActivityProfile,
    seedContract: deterministicDryRunSeedContract,
    templates: dryRunTaskTemplates,
    capacity
  });
  return buildDryRunQueuePlaceholder({ taskSet, seedContract: deterministicDryRunSeedContract });
}

test("dry-run queue placeholder validates", () => {
  const queue = validateDryRunQueuePlaceholder(buildQueue());

  assert.equal(queue.queuePlaceholderId, "dry-run-queue-placeholder-canonical-plan-1");
  assert.ok(queue.queuedTaskIds.length > 0);
  assert.equal(queue.syntheticDataOnly, true);
});

test("dry-run queue includes delayed task placeholders", () => {
  const queue = validateDryRunQueuePlaceholder(buildQueue());

  assert.ok(queue.delayedTaskIds.length > 0);
  assert.ok(queue.delayedTaskIds.every((taskId) => queue.queuedTaskIds.includes(taskId)));
  assert.ok(["placeholder_low", "placeholder_medium", "placeholder_high"].includes(queue.syntheticDelayBand));
});

test("dry-run queue order is deterministic", () => {
  assert.deepEqual(buildQueue().queuedTaskIds, buildQueue().queuedTaskIds);
});

test("dry-run queue rejects claims and external delayed task ids", () => {
  const queue = buildQueue();

  assert.throws(
    () => validateDryRunQueuePlaceholder({ ...queue, outcomeClaim: true }),
    /outcomeClaim/
  );
  assert.throws(
    () => validateDryRunQueuePlaceholder({ ...queue, delayedTaskIds: ["not-in-queue"] }),
    /queued/
  );
  assert.throws(
    () => validateDryRunQueuePlaceholder({ ...queue, staffingComplianceStatus: "started" }),
    /staffingComplianceStatus/
  );
});
