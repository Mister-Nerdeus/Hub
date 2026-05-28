import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManualAssignmentScenarioBridgeInput,
  buildNurseRuntimeStatesFromManualBridge,
  buildScenarioCapacityIntegration,
  fourToOneRatioPreset,
  validateNurseRuntimeStateSet
} from "../dist/index.js";

function buildFixture() {
  const capacity = buildScenarioCapacityIntegration();
  const bridge = buildManualAssignmentScenarioBridgeInput(capacity, fourToOneRatioPreset);
  const states = buildNurseRuntimeStatesFromManualBridge(bridge, {
    ratioPreset: fourToOneRatioPreset
  });
  return { capacity, bridge, states };
}

test("nurse runtime states validate from manual assignment bridge input", () => {
  const { capacity, bridge, states } = buildFixture();
  const validated = validateNurseRuntimeStateSet(states, { capacity });

  assert.equal(validated.manualAssignmentBridgeId, bridge.bridgeId);
  assert.ok(validated.states.length > 0);
  assert.ok(validated.states.every((state) => state.ratioPresetId === "four_to_one"));
});

test("nurse runtime states use synthetic labels and ids only", () => {
  const { capacity, states } = buildFixture();
  const validated = validateNurseRuntimeStateSet(states, { capacity });

  assert.ok(validated.states.every((state) => /^Synthetic Nurse [A-Z]$/.test(state.syntheticNurseLabel)));
  assert.ok(validated.states.every((state) => /^synthetic-nurse-\d{2}$/.test(state.syntheticNurseId)));
});

test("nurse runtime state rejects excluded spaces", () => {
  const { capacity, states } = buildFixture();

  assert.throws(
    () =>
      validateNurseRuntimeStateSet(
        {
          ...states,
          states: [
            {
              ...states.states[0],
              assignedBedPositionIds: [capacity.excludedObjectIds[0]]
            }
          ]
        },
        { capacity }
      ),
    /selector-eligible|exclude/
  );
});

test("nurse runtime state rejects non-synthetic labels and recommendations", () => {
  const { capacity, states } = buildFixture();

  assert.throws(
    () =>
      validateNurseRuntimeStateSet(
        {
          ...states,
          states: [{ ...states.states[0], syntheticNurseLabel: "Nurse Jane" }]
        },
        { capacity }
      ),
    /synthetic nurse labels/
  );
  assert.throws(
    () =>
      validateNurseRuntimeStateSet(
        {
          ...states,
          recommendationStatus: "started"
        },
        { capacity }
      ),
    /recommendationStatus/
  );
});
