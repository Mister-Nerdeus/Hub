import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const intakeScript = readFileSync(join(repoRoot, "scripts/check-human-review-intake.mjs"), "utf8");
const hardeningScript = readFileSync(join(repoRoot, "scripts/check-human-review-governance-hardening.mjs"), "utf8");

test("human review evidence gates reject missing command outputs instead of creating placeholders", () => {
  assert.doesNotMatch(intakeScript, /writeText\(outputPath,\s*`Pending captured output for:/u);
  assert.match(intakeScript, /missing-command-output\.json/u);
  assert.match(intakeScript, /Required command output must be captured/u);
  assert.match(intakeScript, /statSync\(abs\(outputPath\)\)\.size === 0/u);
  assert.ok(intakeScript.indexOf("writeIssueCloseoutAndIndex();") < intakeScript.indexOf("writeGateOutput();"));
  assert.match(hardeningScript, /placeholdersAllowed: false/u);
  assert.match(hardeningScript, /skippedCurrentGateOutput/u);
  assert.match(hardeningScript, /statSync\(abs\(outputPath\)\)\.size === 0/u);
  assert.doesNotMatch(hardeningScript, /readJson\(mapPath\)\.commands/u);
});
