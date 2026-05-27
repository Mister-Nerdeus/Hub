import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEMO_PIN_COOLDOWN_MS,
  createDemoPinAttemptState,
  getDemoPinAttemptAvailability,
  submitDemoPinAttempt
} from "../dist/index.js";

test("wrong access code creates a 15-second cooldown", () => {
  const now = 10_000;
  const wrong = submitDemoPinAttempt(createDemoPinAttemptState(), "1111", now);
  assert.equal(wrong.status, "wrong_pin");
  assert.equal(wrong.state.cooldownUntilMs, now + DEMO_PIN_COOLDOWN_MS);
  assert.equal(getDemoPinAttemptAvailability(wrong.state, now + DEMO_PIN_COOLDOWN_MS - 1).reason, "cooldown");
});

test("correct access code cannot bypass active cooldown", () => {
  const now = 20_000;
  const wrong = submitDemoPinAttempt(createDemoPinAttemptState(), "1111", now);
  const blocked = submitDemoPinAttempt(wrong.state, "2026", now + 5_000);
  assert.equal(blocked.status, "cooldown_blocked");
  assert.equal(blocked.unlocked, false);
  assert.equal(blocked.state.wrongAttemptCount, 1);
});

test("correct access code works after cooldown expires", () => {
  const now = 30_000;
  const wrong = submitDemoPinAttempt(createDemoPinAttemptState(), "1111", now);
  const unlocked = submitDemoPinAttempt(wrong.state, "2026", now + DEMO_PIN_COOLDOWN_MS + 1);
  assert.equal(unlocked.status, "unlocked");
  assert.equal(unlocked.unlocked, true);
});
