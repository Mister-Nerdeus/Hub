import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const script = readFileSync(join(repoRoot, "scripts/check-human-review-intake.mjs"), "utf8");

test("intake script uses shared promotion recheck builder", () => {
  assert.match(script, /buildHumanReviewPromotionRecheck/u);
  assert.doesNotMatch(script, /function\s+buildPromotionRecheck\b/u);
});
