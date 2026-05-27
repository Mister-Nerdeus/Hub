import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEMO_PIN_COOLDOWN_MS,
  DEMO_PIN_LOCKOUT_MS,
  createDemoPinAttemptState,
  getDemoPinAttemptAvailability,
  submitDemoPinAttempt
} from "../dist/index.js";

test("three wrong PIN attempts trigger a 3-minute lockout", () => {
  const first = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 1_000);
  const second = submitDemoPinAttempt(first.state, "0000", 1_000 + DEMO_PIN_COOLDOWN_MS + 1);
  const thirdAt = 1_000 + DEMO_PIN_COOLDOWN_MS * 2 + 2;
  const third = submitDemoPinAttempt(second.state, "0000", thirdAt);
  assert.equal(third.status, "lockout_blocked");
  assert.equal(third.state.wrongAttemptCount, 3);
  assert.equal(third.state.lockoutUntilMs, thirdAt + DEMO_PIN_LOCKOUT_MS);
});

test("attempts during lockout are rejected", () => {
  const first = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 1_000);
  const second = submitDemoPinAttempt(first.state, "0000", 1_000 + DEMO_PIN_COOLDOWN_MS + 1);
  const third = submitDemoPinAttempt(second.state, "0000", 1_000 + DEMO_PIN_COOLDOWN_MS * 2 + 2);
  const blocked = submitDemoPinAttempt(third.state, "2026", third.state.lockoutUntilMs - 1);
  assert.equal(blocked.status, "lockout_blocked");
  assert.equal(blocked.unlocked, false);
});

test("lockout expiration resets wrong-attempt count", () => {
  const first = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 1_000);
  const second = submitDemoPinAttempt(first.state, "0000", 1_000 + DEMO_PIN_COOLDOWN_MS + 1);
  const third = submitDemoPinAttempt(second.state, "0000", 1_000 + DEMO_PIN_COOLDOWN_MS * 2 + 2);
  const availability = getDemoPinAttemptAvailability(third.state, third.state.lockoutUntilMs + 1);
  assert.equal(availability.canSubmit, true);
  assert.equal(availability.normalizedState.wrongAttemptCount, 0);
  assert.equal(availability.normalizedState.lockoutUntilMs, null);
});
