import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

test("route repair final gate exposes validate-only mutation proof", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/check-corrected-plan-route-repair.mjs", "--stage", "final", "--issue", "321"],
    { cwd: repoRoot, encoding: "utf8" }
  );
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "passed");
  assert.equal(output.stage, "final");
});
