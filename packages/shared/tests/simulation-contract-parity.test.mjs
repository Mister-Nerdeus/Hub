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
  .filter((name) => name.endsWith(".json"))
  .sort();

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function expectedResult(name) {
  return name === "valid-minimal.json" ? "accept" : "reject";
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
  assert.equal(fixtureNames.length, 11);
});

test("TypeScript validator accepts and rejects parity fixtures as expected", () => {
  const results = fixtureNames.map((name) => ({
    fixture: basename(name),
    expected: expectedResult(name),
    typescript: validateFixture(name)
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
