import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildOperationalDeltaComparison,
  validateOperationalDeltaComparison
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, "outcomes", name), "utf8"));
}

function buildMetricSet(base, modified) {
  const metricTemplate = {
    schemaVersion: "1.0.0",
    label: "",
    group: "unit",
    unit: "count",
    source: "comparison_delta",
    scope: "comparison",
    limitations: ["Operational-only metric proxy for contrast only."]
  };
  return {
    baselineMetrics: [
      {
        ...metricTemplate,
        metricId: "nurse-walk-time",
        label: "Nurse walk time",
        value: base.nurseWalkMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "patient-wait-idle-proxy",
        label: "Patient wait / idle proxy",
        value: base.patientWaitIdleMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "task-time",
        label: "Task time",
        value: base.taskTimeMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "queue-delay",
        label: "Queue delay",
        value: base.queueDelayMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "unit-saturation",
        label: "Unit saturation",
        value: base.unitSaturationPercent,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "room-turnover-pressure",
        label: "Room turnover pressure",
        value: base.roomTurnoverPressure,
        directionality: "higher_is_better"
      },
      {
        ...metricTemplate,
        metricId: "nurse-strain-proxy",
        label: "Nurse strain proxy",
        value: base.nurseStrainProxy,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "layout-friction",
        label: "Layout friction",
        value: base.layoutFrictionScore,
        directionality: "lower_is_better"
      }
    ],
    modifiedMetrics: [
      {
        ...metricTemplate,
        metricId: "nurse-walk-time",
        label: "Nurse walk time",
        value: modified.nurseWalkMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "patient-wait-idle-proxy",
        label: "Patient wait / idle proxy",
        value: modified.patientWaitIdleMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "task-time",
        label: "Task time",
        value: modified.taskTimeMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "queue-delay",
        label: "Queue delay",
        value: modified.queueDelayMinutes,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "unit-saturation",
        label: "Unit saturation",
        value: modified.unitSaturationPercent,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "room-turnover-pressure",
        label: "Room turnover pressure",
        value: modified.roomTurnoverPressure,
        directionality: "higher_is_better"
      },
      {
        ...metricTemplate,
        metricId: "nurse-strain-proxy",
        label: "Nurse strain proxy",
        value: modified.nurseStrainProxy,
        directionality: "lower_is_better"
      },
      {
        ...metricTemplate,
        metricId: "layout-friction",
        label: "Layout friction",
        value: modified.layoutFrictionScore,
        directionality: "lower_is_better"
      }
    ]
  };
}

test("buildOperationalDeltaComparison output includes baseline, modified, deltas, and deterministic percent change", () => {
  const fixture = readFixture("operational-delta-comparison-basic.json");
  const output = buildOperationalDeltaComparison({
    comparisonId: "layout-change-example",
    baselineLabel: "3:1 original layout",
    modifiedLabel: "4:1 modified layout",
    baselineMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "nurse-walk-time",
        label: "Nurse walk time",
        group: "unit",
        unit: "count",
        value: 312,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "patient-wait-idle-proxy",
        label: "Patient wait / idle proxy",
        group: "patient_flow",
        unit: "minutes",
        value: 140,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "task-time",
        label: "Task time",
        group: "task",
        unit: "minutes",
        value: 38,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "queue-delay",
        label: "Queue delay",
        group: "patient_flow",
        unit: "minutes",
        value: 12,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "unit-saturation",
        label: "Unit saturation",
        group: "unit",
        unit: "percent",
        value: 74,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "room-turnover-pressure",
        label: "Room turnover pressure",
        group: "room",
        unit: "percent",
        value: 58,
        directionality: "higher_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "nurse-strain-proxy",
        label: "Nurse strain proxy",
        group: "nurse",
        unit: "score",
        value: 44,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "layout-friction",
        label: "Layout friction",
        group: "layout",
        unit: "score",
        value: 33,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      }
    ],
    modifiedMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "nurse-walk-time",
        label: "Nurse walk time",
        group: "unit",
        unit: "count",
        value: 248,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "patient-wait-idle-proxy",
        label: "Patient wait / idle proxy",
        group: "patient_flow",
        unit: "minutes",
        value: 160,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "task-time",
        label: "Task time",
        group: "task",
        unit: "minutes",
        value: 36,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "queue-delay",
        label: "Queue delay",
        group: "patient_flow",
        unit: "minutes",
        value: 18,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "unit-saturation",
        label: "Unit saturation",
        group: "unit",
        unit: "percent",
        value: 69,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "room-turnover-pressure",
        label: "Room turnover pressure",
        group: "room",
        unit: "percent",
        value: 64,
        directionality: "higher_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "nurse-strain-proxy",
        label: "Nurse strain proxy",
        group: "nurse",
        unit: "score",
        value: 39,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "layout-friction",
        label: "Layout friction",
        group: "layout",
        unit: "score",
        value: 45,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for layout and scenario contrast."]
      }
    ]
  });
  assert.deepEqual(output, fixture);
  assert.equal(output.deltas.every((delta) => typeof delta.directionality === "string"), true);
});

test("validateOperationalDeltaComparison rejects forbidden wording", () => {
  const output = readFixture("operational-delta-comparison-basic.json");
  const poisoned = {
    ...output,
    limitations: ["safe staffing recommendation"]
  };
  assert.throws(() => validateOperationalDeltaComparison(poisoned), /must avoid operational-only forbidden wording/);
});

test("buildOperationalDeltaComparison computes deterministic zero-baseline percent change", () => {
  const output = buildOperationalDeltaComparison({
    comparisonId: "baseline-zero-demo",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "ad_hoc_zero_baseline",
        label: "Ad hoc zero baseline",
        group: "comparison",
        unit: "count",
        value: 0,
        directionality: "higher_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for deterministic math checks."]
      }
    ],
    modifiedMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "ad_hoc_zero_baseline",
        label: "Ad hoc zero baseline",
        group: "comparison",
        unit: "count",
        value: 12,
        directionality: "higher_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only metric proxy for deterministic math checks."]
      }
    ]
  });
  assert.equal(output.deltas[0].percentChange, 100);
  assert.equal(output.deltas[0].direction, "improved");
});

test("buildOperationalDeltaComparison rejects metric-ID mismatches", () => {
  const { baselineMetrics, modifiedMetrics } = buildMetricSet(
    {
      nurseWalkMinutes: 310,
      patientWaitIdleMinutes: 130,
      taskTimeMinutes: 32,
      queueDelayMinutes: 9,
      unitSaturationPercent: 70,
      roomTurnoverPressure: 50,
      nurseStrainProxy: 38,
      layoutFrictionScore: 24
    },
    {
      nurseWalkMinutes: 250,
      patientWaitIdleMinutes: 125,
      taskTimeMinutes: 29,
      queueDelayMinutes: 10,
      unitSaturationPercent: 68,
      roomTurnoverPressure: 52,
      nurseStrainProxy: 33,
      layoutFrictionScore: 20
    }
  );
  modifiedMetrics[0].metricId = "nurse-walk-time-moved";
  assert.throws(
    () =>
      buildOperationalDeltaComparison({
        comparisonId: "layout-mismatch",
        baselineLabel: "baseline",
        modifiedLabel: "modified",
        baselineMetrics,
        modifiedMetrics
      }),
    /metricId mismatch/
  );
});

test("buildOperationalDeltaComparison enforces directionality and direction results", () => {
  const output = buildOperationalDeltaComparison({
    comparisonId: "directionality-baseline",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "queue-delay",
        label: "Queue delay",
        group: "patient_flow",
        unit: "minutes",
        value: 12,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only directionality check."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "room-turnover-pressure",
        label: "Room turnover pressure",
        group: "room",
        unit: "percent",
        value: 50,
        directionality: "higher_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only directionality check."]
      }
    ],
    modifiedMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "queue-delay",
        label: "Queue delay",
        group: "patient_flow",
        unit: "minutes",
        value: 8,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only directionality check."]
      },
      {
        schemaVersion: "1.0.0",
        metricId: "room-turnover-pressure",
        label: "Room turnover pressure",
        group: "room",
        unit: "percent",
        value: 60,
        directionality: "higher_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only directionality check."]
      }
    ]
  });

  const directions = output.deltas.map((delta) => [delta.metricId, delta.directionality, delta.direction]);
  assert.deepEqual(directions, [
    ["queue-delay", "lower_is_better", "improved"],
    ["room-turnover-pressure", "lower_is_better", "worse"]
  ]);
});

test("buildOperationalDeltaComparison rejects metrics with different directionality", () => {
  const sharedArgs = {
    comparisonId: "directionality-mismatch",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "ad_hoc_directionality_check",
        label: "Ad hoc directionality check",
        group: "comparison",
        unit: "count",
        value: 12,
        directionality: "lower_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only directionality validation only."]
      }
    ],
    modifiedMetrics: [
      {
        schemaVersion: "1.0.0",
        metricId: "ad_hoc_directionality_check",
        label: "Ad hoc directionality check",
        group: "comparison",
        unit: "count",
        value: 14,
        directionality: "higher_is_better",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only directionality validation only."]
      }
    ]
  };
  assert.throws(
    () => buildOperationalDeltaComparison(sharedArgs),
    /metric directionality must match/
  );
});
