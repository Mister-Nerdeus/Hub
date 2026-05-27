import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEMO_PIN_COOLDOWN_SECONDS,
  DEMO_PIN_LOCKOUT_SECONDS,
  DEMO_PIN_WRONG_ATTEMPTS_BEFORE_LOCKOUT,
  createDemoPinAttemptState,
  getDemoPinAttemptAvailability,
  submitDemoPinAttempt
} from "../dist/index.js";

test("access attempt state starts open for submission but not app access", () => {
  const state = createDemoPinAttemptState();
  assert.equal(state.wrongAttemptCount, 0);
  assert.equal(state.lastAttemptAtMs, null);
  assert.equal(state.cooldownUntilMs, null);
  assert.equal(state.lockoutUntilMs, null);
  assert.equal(getDemoPinAttemptAvailability(state, 1000).canSubmit, true);
});

test("wrong attempts are counted in local demo state", () => {
  const result = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 1000);
  assert.equal(result.status, "wrong_pin");
  assert.equal(result.unlocked, false);
  assert.equal(result.state.wrongAttemptCount, 1);
  assert.equal(result.state.lastAttemptAtMs, 1000);
});

test("correct internal code unlocks and resets attempt state", () => {
  const wrong = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 1000);
  const afterCooldown = wrong.state.cooldownUntilMs + 1;
  const result = submitDemoPinAttempt(wrong.state, "2026", afterCooldown);
  assert.equal(result.status, "unlocked");
  assert.equal(result.unlocked, true);
  assert.equal(result.state.wrongAttemptCount, 0);
  assert.equal(result.state.cooldownUntilMs, null);
  assert.equal(result.state.lockoutUntilMs, null);
});

test("policy constants match the batch contract", () => {
  assert.equal(DEMO_PIN_COOLDOWN_SECONDS, 15);
  assert.equal(DEMO_PIN_WRONG_ATTEMPTS_BEFORE_LOCKOUT, 3);
  assert.equal(DEMO_PIN_LOCKOUT_SECONDS, 180);
});
