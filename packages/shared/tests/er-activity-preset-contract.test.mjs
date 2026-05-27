import assert from "node:assert/strict";
import test from "node:test";

import {
  boardingPressureErActivityPreset,
  busyErActivityPreset,
  erActivityPresetFixtures,
  steadyErActivityPreset,
  surgeErActivityPreset,
  traumaSpikeErActivityPreset,
  validateErActivityPresetContract
} from "../dist/index.js";

test("ER activity preset fixtures validate as operational presets", () => {
  for (const preset of erActivityPresetFixtures) {
    assert.equal(validateErActivityPresetContract(preset).syntheticDataOnly, true);
  }
  assert.equal(steadyErActivityPreset.presetId, "steady");
  assert.equal(busyErActivityPreset.presetId, "busy");
  assert.equal(surgeErActivityPreset.presetId, "surge");
  assert.equal(traumaSpikeErActivityPreset.presetId, "trauma_spike");
  assert.equal(boardingPressureErActivityPreset.presetId, "boarding_pressure");
});

test("unsupported ER activity preset values fail", () => {
  assert.throws(
    () => validateErActivityPresetContract({ ...busyErActivityPreset, presetId: "unsupported" }),
    /presetId/
  );
  assert.throws(
    () => validateErActivityPresetContract({ ...busyErActivityPreset, arrivalPressureLevel: "extreme" }),
    /arrivalPressureLevel/
  );
});
