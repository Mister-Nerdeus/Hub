import assert from "node:assert/strict";
import { test } from "node:test";

import { demoPinSessionPolicy } from "../dist/index.js";

test("workspace access session policy is session-only and stores no access-code input", () => {
  assert.equal(demoPinSessionPolicy.storageKind, "sessionStorage");
  assert.equal(demoPinSessionPolicy.persistence, "current_browser_session_only");
  assert.equal(demoPinSessionPolicy.demoOnly, true);
  assert.equal(demoPinSessionPolicy.productionAuthentication, false);
  assert.equal(demoPinSessionPolicy.realSecurity, false);
  assert.equal(demoPinSessionPolicy.phiProtection, false);
  assert.deepEqual([...demoPinSessionPolicy.storedFields], ["unlocked", "unlockedAtMs"]);
  assert.equal(demoPinSessionPolicy.forbiddenStoredFields.includes("pin"), true);
  assert.equal(demoPinSessionPolicy.forbiddenStoredFields.includes("authToken"), true);
});
