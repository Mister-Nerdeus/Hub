import {
  formatLayoutValidationSeverity,
  formatLayoutValidationSource
} from "./layoutValidationSeverityDisplay";
import type {
  LayoutValidationWarningSeverity,
  LayoutValidationWarningSource
} from "./layoutValidationWarningContract";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

const severityCases: Array<[LayoutValidationWarningSeverity, string]> = [
  ["info", "Info"],
  ["warning", "Warning"],
  ["blocking", "Blocking"]
];

assert.deepEqual(
  severityCases.map(([severity]) => formatLayoutValidationSeverity(severity)),
  severityCases.map(([, label]) => label)
);

const sourceCases: Array<[LayoutValidationWarningSource, string]> = [
  ["bounds", "Bounds"],
  ["collision", "Collision"],
  ["resize", "Resize"],
  ["door_sync", "Door sync"],
  ["path_sync", "Path sync"],
  ["inspector_edit", "Inspector edit"],
  ["unknown", "Unknown"]
];

assert.deepEqual(
  sourceCases.map(([source]) => formatLayoutValidationSource(source)),
  sourceCases.map(([, label]) => label)
);

assert.equal(formatLayoutValidationSource("audit"), "Audit");
assert.equal(formatLayoutValidationSource("delta_preview"), "Delta preview");
