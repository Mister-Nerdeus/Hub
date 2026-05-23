import {
  OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS,
  operationalOutcomeDashboardProofData
} from "@nerdeus/shared";

import {
  adaptSharedOutcomeDashboardProofData,
  allOperationalOutcomeMetricIds,
  operationalOutcomeDashboardProofFixture
} from "./sharedOutcomeDashboardAdapter";

const adapted = adaptSharedOutcomeDashboardProofData(operationalOutcomeDashboardProofData);

if (
  operationalOutcomeDashboardProofFixture.sourcePackage !== "@nerdeus/shared" ||
  operationalOutcomeDashboardProofFixture.sourceDataId !== operationalOutcomeDashboardProofData.sourceDataId
) {
  throw new Error("dashboard fixture must be adapted from shared proof data instead of independent metric values");
}

if (JSON.stringify(adapted) !== JSON.stringify(operationalOutcomeDashboardProofFixture)) {
  throw new Error("dashboard fixture must equal the shared adapter output");
}

if (
  JSON.stringify(allOperationalOutcomeMetricIds) !==
  JSON.stringify([...OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS])
) {
  throw new Error("dashboard metric IDs must come from shared dashboard proof data");
}

const fixtureScenarios = [
  operationalOutcomeDashboardProofFixture.threeToOneLight,
  operationalOutcomeDashboardProofFixture.fourToOneLight,
  operationalOutcomeDashboardProofFixture.threeToOneSlammed,
  operationalOutcomeDashboardProofFixture.fourToOneSlammed
];

for (const scenario of fixtureScenarios) {
  const sharedScenario = operationalOutcomeDashboardProofData.scenarios.find(
    (candidate) =>
      candidate.ratioLabel === scenario.ratioLabel &&
      candidate.intensityLabel === scenario.intensityLabel
  );
  if (sharedScenario == null) {
    throw new Error(`missing shared scenario for ${scenario.scenarioLabel}`);
  }
  for (const metric of scenario.metrics) {
    const sharedMetric = sharedScenario.operationalMetrics.find(
      (candidate) => candidate.metricId === metric.metricId
    );
    if (sharedMetric == null || sharedMetric.value !== metric.value) {
      throw new Error(`metric ${metric.metricId} must be display-adapted from shared data`);
    }
  }
}
