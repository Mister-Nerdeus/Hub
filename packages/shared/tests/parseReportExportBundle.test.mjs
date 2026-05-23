import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  parseReportExportBundleJson,
  summarizeReportExportBundle,
  validateReportExportBundleContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const exportFixturesDir = join(fixturesDir, "export");
const invalidFixturesDir = join(fixturesDir, "invalid");

function readText(path) {
  return readFileSync(path, "utf8");
}

function readExportFixture(name) {
  return readText(join(exportFixturesDir, name));
}

function readInvalidFixture(name) {
  return readText(join(invalidFixturesDir, name));
}

test("parseReportExportBundleJson parses and validates a report export bundle", () => {
  const bundle = parseReportExportBundleJson(readExportFixture("report-export-bundle-basic.json"));

  assert.equal(bundle.exportType, "operational_report_bundle");
  assert.doesNotThrow(() => validateReportExportBundleContract(bundle));
});

test("parseReportExportBundleJson rejects invalid JSON clearly", () => {
  assert.throws(
    () => parseReportExportBundleJson(readInvalidFixture("export-bundle-invalid-json.txt")),
    /Invalid report export bundle JSON/
  );
});

test("parseReportExportBundleJson rejects wrong schema version", () => {
  assert.throws(
    () =>
      parseReportExportBundleJson(
        readInvalidFixture("export-bundle-wrong-schema-version.json")
      ),
    /schemaVersion/
  );
});

test("summarizeReportExportBundle creates deterministic import summary", () => {
  const bundle = parseReportExportBundleJson(readExportFixture("report-export-bundle-basic.json"));
  const summary = summarizeReportExportBundle(bundle);

  assert.deepEqual(summary, JSON.parse(readExportFixture("report-export-bundle-import-summary.json")));
  assert.deepEqual(summary.scenarioIds, ["shift-scenario-basic", "shift-scenario-surge"]);
  assert.deepEqual(summary.reportIds, [
    "operational-summary-generated-task-set-basic",
    "operational-summary-generated-task-set-surge"
  ]);
});

test("summarizeReportExportBundle sorts IDs deterministically", () => {
  const bundle = parseReportExportBundleJson(readExportFixture("report-export-bundle-basic.json"));
  bundle.reports.reverse();
  const summary = summarizeReportExportBundle(bundle);

  assert.deepEqual(summary.scenarioIds, ["shift-scenario-basic", "shift-scenario-surge"]);
  assert.deepEqual(summary.reportIds, [
    "operational-summary-generated-task-set-basic",
    "operational-summary-generated-task-set-surge"
  ]);
});
