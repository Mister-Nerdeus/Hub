import { createFourPatientComparisonViewModel } from "../fourPatientComparisonViewModel";

const viewModel = createFourPatientComparisonViewModel();
if (viewModel.rows.length !== 2) {
  throw new Error("four patient comparison must include two synthetic nurses");
}

if (!viewModel.rows.every((row) => row.assignedRoomCount === 4)) {
  throw new Error("four patient comparison must keep the same assigned room count");
}

const totals = viewModel.rows.map((row) => row.totalBurden);
if (new Set(totals).size !== 2) {
  throw new Error("four patient comparison must show different total burden");
}

if (!viewModel.warningCodes.includes("TRAUMA_QUALIFICATION_MISMATCH")) {
  throw new Error("four patient comparison must expose expected warning differences");
}
