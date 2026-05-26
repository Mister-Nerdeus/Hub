import { manualAssignmentNurseColorPalette } from "@nerdeus/shared";

export const nurseColorTokens = [
  { id: "blue", label: "Nurse Blue", value: manualAssignmentNurseColorPalette.blue },
  { id: "green", label: "Nurse Green", value: manualAssignmentNurseColorPalette.green },
  { id: "purple", label: "Nurse Purple", value: manualAssignmentNurseColorPalette.purple },
  { id: "orange", label: "Nurse Orange", value: manualAssignmentNurseColorPalette.orange }
] as const;
