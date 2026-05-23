import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildReportExportBundle,
  validateReportExportBundleContract
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

test("report export bundle fixture validates against TypeScript contract", () => {
  const bundle = validateReportExportBundleContract(
    readExportFixture("report-export-bundle-basic.json")
  );

  assert.equal(bundle.exportType, "operational_report_bundle");
  assert.equal(bundle.reports.length, 2);
  assert.equal(bundle.comparison?.comparisonType, "manual_scenario_comparison");
});

test("buildReportExportBundle creates deterministic validated output", () => {
  const fixture = readExportFixture("report-export-bundle-basic.json");
  const bundle = buildReportExportBundle({
    exportId: "report-export-bundle-basic",
    label: "Operational-only report export bundle proof",
    reports: fixture.reports,
    comparison: fixture.comparison
  });

  assert.deepEqual(bundle, fixture);
  assert.doesNotThrow(() => validateReportExportBundleContract(bundle));
});

test("buildReportExportBundle supports bundles without a comparison", () => {
  const fixture = readExportFixture("report-export-bundle-basic.json");
  const bundle = buildReportExportBundle({
    exportId: "report-export-bundle-basic",
    label: "Operational-only report export bundle proof",
    reports: fixture.reports
  });

  assert.equal(bundle.comparison, null);
  assert.doesNotThrow(() => validateReportExportBundleContract(bundle));
});

test("report export bundle contract accepts omitted optional comparison", () => {
  const fixture = readExportFixture("report-export-bundle-basic.json");
  delete fixture.comparison;

  const bundle = validateReportExportBundleContract(fixture);

  assert.equal(bundle.comparison, null);
});

test("report export bundle contract accepts null optional comparison", () => {
  const fixture = readExportFixture("report-export-bundle-basic.json");
  fixture.comparison = null;

  const bundle = validateReportExportBundleContract(fixture);

  assert.equal(bundle.comparison, null);
});

test("buildReportExportBundle rejects empty reports", () => {
  assert.throws(
    () =>
      buildReportExportBundle({
        exportId: "report-export-bundle-basic",
        label: "Operational-only report export bundle proof",
        reports: []
      }),
    /reports/
  );
});

test("invalid report export bundle fixtures are rejected by TypeScript contract", () => {
  for (const fixtureName of [
    "export-bundle-missing-report.json",
    "export-bundle-comparison-mismatch.json",
    "export-bundle-safety-claim.json"
  ]) {
    assert.throws(() => validateReportExportBundleContract(readInvalidFixture(fixtureName)));
  }
});

test("buildReportExportBundle rejects comparison/report mismatches", () => {
  const fixture = readExportFixture("report-export-bundle-basic.json");
  fixture.comparison.items[1].reportId = "missing-operational-report";
  fixture.comparison.reportIds[1] = "missing-operational-report";

  assert.throws(
    () =>
      buildReportExportBundle({
        exportId: "report-export-bundle-basic",
        label: "Operational-only report export bundle proof",
        reports: fixture.reports,
        comparison: fixture.comparison
      }),
    /included reports/
  );
});

test("report export bundle contract rejects string numeric summary values", () => {
  const fixture = readExportFixture("report-export-bundle-basic.json");
  fixture.comparison.summary.reportCount = "2";

  assert.throws(() => validateReportExportBundleContract(fixture), /integer/);
});
