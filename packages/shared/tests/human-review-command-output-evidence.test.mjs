import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const intakeScript = readFileSync(join(repoRoot, "scripts/check-human-review-intake.mjs"), "utf8");
const hardeningScript = readFileSync(join(repoRoot, "scripts/check-human-review-governance-hardening.mjs"), "utf8");

test("human review evidence gates reject missing command outputs instead of creating placeholders", () => {
  assert.doesNotMatch(intakeScript, /Pending captured output for:/u);
  assert.match(intakeScript, /missing-command-output\.json/u);
  assert.match(intakeScript, /Required command output must be captured/u);
  assert.match(hardeningScript, /placeholdersAllowed: false/u);
});
