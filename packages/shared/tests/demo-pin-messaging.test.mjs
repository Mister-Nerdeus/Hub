import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEMO_PIN_COOLDOWN_MS,
  createDemoPinAttemptState,
  submitDemoPinAttempt
} from "../dist/index.js";

test("workspace access attempt messages are professional", () => {
  const empty = submitDemoPinAttempt(createDemoPinAttemptState(), "", 1_000);
  assert.equal(empty.message, "Workspace access is required to continue.");

  const wrong = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 2_000);
  assert.equal(wrong.message, "Access code not accepted. Try again in 15 seconds.");

  const cooldown = submitDemoPinAttempt(wrong.state, "0000", 3_000);
  assert.equal(cooldown.message, "Please wait 14 seconds before trying again.");

  const second = submitDemoPinAttempt(wrong.state, "0000", 2_000 + DEMO_PIN_COOLDOWN_MS + 1);
  const third = submitDemoPinAttempt(second.state, "0000", 2_000 + DEMO_PIN_COOLDOWN_MS * 2 + 2);
  assert.equal(third.message, "Too many attempts. Try again in 3 minutes.");

  const unlocked = submitDemoPinAttempt(createDemoPinAttemptState(), "2026", 4_000);
  assert.equal(unlocked.message, "Workspace access granted for this session.");
});
