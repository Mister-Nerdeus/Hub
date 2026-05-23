import { createOperationalOutcomeDashboardViewModel } from "./operationalOutcomeDashboardViewModel";
import {
  operationalOutcomeDashboardProofFixture,
  type OperationalOutcomeDashboardProofFixture
} from "../../fixtures/outcomes/operationalOutcomeDashboardProof";

const viewModel = createOperationalOutcomeDashboardViewModel();

if (viewModel.sourcePackage !== "@nerdeus/shared" || viewModel.sourceDataId.length === 0) {
  throw new Error("dashboard view model must retain the shared source data identity");
}

if (viewModel.metricCards.length !== 8) {
  throw new Error("dashboard must render all operational metric cards");
}

const requiredMetricLabels = [
  "Nurse walk time",
  "Patient wait idle proxy",
  "Task time",
  "Queue delay",
  "Unit saturation",
  "Room turnover pressure",
  "Nurse strain proxy",
  "Layout friction"
];

for (const label of requiredMetricLabels) {
  if (viewModel.metricCards.every((metric) => metric.label !== label)) {
    throw new Error(`missing metric card: ${label}`);
  }
}

if (viewModel.ratioDelta.deltas.length !== 8) {
  throw new Error("ratio delta comparison missing all metric deltas");
}

if (viewModel.ratioDelta !== operationalOutcomeDashboardProofFixture.ratioDelta) {
  throw new Error("ratio delta comparison must come from the shared dashboard proof fixture");
}

if (viewModel.pressureBands.every((tile) => tile.band !== "critical")) {
  throw new Error("pressure band contrast must include a critical case");
}

if (!viewModel.metricCards.some((metric) => metric.ratioDeltaPercent !== 0)) {
  throw new Error("ratio delta comparison must include percent visibility");
}

for (const direction of viewModel.ratioDelta.deltas.map((delta) => delta.direction)) {
  if (!["improved", "worse", "unchanged"].includes(direction)) {
    throw new Error(`invalid delta direction: ${direction}`);
  }
}

const limitationsText = viewModel.limitations.join(" ").toLowerCase();
if (limitationsText.includes("safe") || limitationsText.includes("unsafe") || limitationsText.includes("clinical") || limitationsText.includes("satisfaction")) {
  throw new Error("dashboard limitations must avoid unsafe language");
}

const prohibited = ["safe", "unsafe", "clinical", "satisfaction", "recommendation"];
const textOutput = JSON.stringify(viewModel).toLowerCase();
if (prohibited.some((word) => textOutput.includes(word))) {
  throw new Error("dashboard output must not include forbidden non-operational wording");
}

const rejectionFixture: OperationalOutcomeDashboardProofFixture = {
  ...operationalOutcomeDashboardProofFixture,
  limitations: ["safe staffing suggestion"]
};
let rejectionThrown = false;
try {
  createOperationalOutcomeDashboardViewModel(rejectionFixture);
} catch {
  rejectionThrown = true;
}

if (!rejectionThrown) {
  throw new Error("forbidden wording not rejected");
}
