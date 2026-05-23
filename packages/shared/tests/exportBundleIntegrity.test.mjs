import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildExportBundleIntegrity,
  canonicalizeReportExportBundle,
  hashCanonicalJson,
  validateExportBundleIntegrity
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const exportFixturesDir = join(fixturesDir, "export");
const invalidFixturesDir = join(fixturesDir, "invalid");

function readExportFixture(name) {
  return JSON.parse(readFileSync(join(exportFixturesDir, name), "utf8"));
}

function readInvalidFixture(name) {
  return JSON.parse(readFileSync(join(invalidFixturesDir, name), "utf8"));
}

test("canonical JSON and integrity hash are reproducible", () => {
  const bundle = readExportFixture("report-export-bundle-basic.json");
  const firstCanonical = canonicalizeReportExportBundle(bundle);
  const secondCanonical = canonicalizeReportExportBundle(bundle);
  const firstIntegrity = buildExportBundleIntegrity(bundle);
  const secondIntegrity = buildExportBundleIntegrity(bundle);

  assert.equal(firstCanonical, secondCanonical);
  assert.equal(firstIntegrity.canonicalJsonHash, secondIntegrity.canonicalJsonHash);
  assert.equal(firstIntegrity.canonicalJsonLength, firstCanonical.length);
});

test("canonical JSON sorts object keys recursively and preserves array order", () => {
  const bundle = readExportFixture("report-export-bundle-basic.json");
  const reorderedBundle = reverseObjectKeys(bundle);
  const changedArrayOrder = {
    ...bundle,
    limitations: [...bundle.limitations].reverse()
  };

  assert.equal(
    canonicalizeReportExportBundle(reorderedBundle),
    canonicalizeReportExportBundle(bundle)
  );
  assert.notEqual(
    canonicalizeReportExportBundle(changedArrayOrder),
    canonicalizeReportExportBundle(bundle)
  );
});

test("hashCanonicalJson emits lowercase sha256 hex", () => {
  const canonicalJson = canonicalizeReportExportBundle(
    readExportFixture("report-export-bundle-basic.json")
  );
  const expected = createHash("sha256").update(canonicalJson).digest("hex");

  assert.equal(hashCanonicalJson(canonicalJson), expected);
  assert.match(hashCanonicalJson(canonicalJson), /^[0-9a-f]{64}$/);
});

test("valid integrity fixture matches the source bundle", () => {
  const bundle = readExportFixture("report-export-bundle-basic.json");
  const integrity = validateExportBundleIntegrity(
    readExportFixture("report-export-bundle-integrity-basic.json"),
    bundle
  );

  assert.equal(integrity.exportId, bundle.exportId);
  assert.equal(integrity.algorithm, "sha256");
});

test("changed bundle content changes the integrity hash", () => {
  const bundle = readExportFixture("report-export-bundle-basic.json");
  const changedBundle = {
    ...bundle,
    label: `${bundle.label} changed`
  };

  assert.notEqual(
    buildExportBundleIntegrity(bundle).canonicalJsonHash,
    buildExportBundleIntegrity(changedBundle).canonicalJsonHash
  );
});

test("bad hash fixture is rejected with bundle context", () => {
  assert.throws(
    () =>
      validateExportBundleIntegrity(
        readInvalidFixture("export-bundle-integrity-bad-hash.json"),
        readExportFixture("report-export-bundle-basic.json")
      ),
    /canonicalJsonHash/
  );
});

test("mismatched exportId fixture is rejected with bundle context", () => {
  assert.throws(
    () =>
      validateExportBundleIntegrity(
        readInvalidFixture("export-bundle-integrity-mismatched-export-id.json"),
        readExportFixture("report-export-bundle-basic.json")
      ),
    /exportId/
  );
});

test("tamper-proof security claims are rejected", () => {
  const integrity = readExportFixture("report-export-bundle-integrity-basic.json");
  integrity.limitations = [
    ...integrity.limitations,
    "This integrity proof is tamper-proof."
  ];

  assert.throws(() => validateExportBundleIntegrity(integrity), /tamper-proof/);
});

function reverseObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map(reverseObjectKeys);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => right.localeCompare(left))
      .map((key) => [key, reverseObjectKeys(value[key])])
  );
}
