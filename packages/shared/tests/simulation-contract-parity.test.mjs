import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validateSimulationRunContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(
  new URL("../fixtures/simulation-contract-parity/", import.meta.url)
);

const fixtureNames = readdirSync(fixturesDir)
  .filter((name) => name.endsWith(".json") && name !== "manifest.json")
  .sort();

const manifest = JSON.parse(readFileSync(join(fixturesDir, "manifest.json"), "utf8"));
const manifestEntries = [...manifest.fixtures].sort((left, right) =>
  left.fixture < right.fixture ? -1 : left.fixture > right.fixture ? 1 : 0
);

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function validateFixture(name) {
  try {
    validateSimulationRunContract(readFixture(name));
    return "accept";
  } catch {
    return "reject";
  }
}

test("simulation contract parity fixtures have the expected count", () => {
  assert.equal(manifestEntries.length, 11);
  assert.deepEqual(
    manifestEntries.map((entry) => entry.fixture),
    fixtureNames
  );
});

test("TypeScript validator accepts and rejects parity fixtures as expected", () => {
  const results = manifestEntries.map((entry) => ({
    fixture: basename(entry.fixture),
    expected: entry.expected,
    typescript: validateFixture(entry.fixture)
  }));

  assert.deepEqual(
    results.map((result) => [result.fixture, result.typescript]),
    results.map((result) => [result.fixture, result.expected])
  );
});

test("identity-like key fixture rejection uses the simulation boundary", () => {
  const keyFixtures = fixtureNames.filter(
    (name) => name !== "valid-minimal.json" && name !== "invalid-recommended-text.json"
  );

  for (const name of keyFixtures) {
    assert.throws(
      () => validateSimulationRunContract(readFixture(name)),
      /simulation output/,
      `${name} should be rejected by forbidden-key validation`
    );
  }
});
