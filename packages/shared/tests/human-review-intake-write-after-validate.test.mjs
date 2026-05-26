import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const script = readFileSync(join(repoRoot, "scripts/check-human-review-intake.mjs"), "utf8");

test("human review intake writes canonical manifest only after validation succeeds", () => {
  const validateIndex = script.indexOf("validateCandidateManifest();");
  const failureIndex = script.indexOf("if (failures.length > 0)");
  const writeIndex = script.indexOf("writeCanonicalArtifacts();");
  assert.ok(validateIndex > 0);
  assert.ok(failureIndex > validateIndex);
  assert.ok(writeIndex > failureIndex);
  assert.doesNotMatch(script, /writeJson\(intakeManifestPath,\s*manifest\);[\s\S]*runStage\(\);/u);
});
