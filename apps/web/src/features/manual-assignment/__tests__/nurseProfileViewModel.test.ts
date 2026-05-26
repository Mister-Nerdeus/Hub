import { manualAssignmentDemoNurses, manualAssignmentPlaceholderCounts } from "../manualAssignmentDemoState";
import { nurseColorTokens } from "../nurseColors";
import { createNurseProfileViewModel } from "../nurseProfileViewModel";

const viewModel = createNurseProfileViewModel(manualAssignmentDemoNurses, manualAssignmentPlaceholderCounts);

if (viewModel.length !== 4) {
  throw new Error("nurse profile view model must include four synthetic display profiles");
}

if (!viewModel.some((nurse) => nurse.displayLabel === "Nurse Blue" && nurse.qualificationLabels.includes("Trauma"))) {
  throw new Error("Nurse Blue must expose trauma qualification");
}

if (!viewModel.every((nurse) => nurse.maxPatientCount >= nurse.targetPatientCount)) {
  throw new Error("nurse target counts must not exceed max patient counts");
}

if (nurseColorTokens.length !== 4 || !nurseColorTokens.every((token) => /^#[0-9a-f]{6}$/i.test(token.value))) {
  throw new Error("nurse color palette must expose four hex colors");
}
