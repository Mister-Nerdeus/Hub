import type { ManualAssignmentNurse } from "./manualAssignmentContracts.js";

export const manualAssignmentNurseColorPalette = {
  blue: "#2563eb",
  green: "#16a34a",
  purple: "#7c3aed",
  orange: "#ea580c"
} as const;

export const syntheticManualAssignmentNurseProfiles: ManualAssignmentNurse[] = [
  {
    nurseId: "nurse-blue",
    displayLabel: "Nurse Blue",
    color: manualAssignmentNurseColorPalette.blue,
    role: "primary",
    targetPatientCount: 4,
    maxPatientCount: 5,
    traumaQualified: true,
    psychQualified: false,
    chargeQualified: false,
    active: true,
    syntheticDataOnly: true
  },
  {
    nurseId: "nurse-green",
    displayLabel: "Nurse Green",
    color: manualAssignmentNurseColorPalette.green,
    role: "primary",
    targetPatientCount: 4,
    maxPatientCount: 5,
    traumaQualified: false,
    psychQualified: true,
    chargeQualified: false,
    active: true,
    syntheticDataOnly: true
  },
  {
    nurseId: "nurse-purple",
    displayLabel: "Nurse Purple",
    color: manualAssignmentNurseColorPalette.purple,
    role: "charge",
    targetPatientCount: 3,
    maxPatientCount: 4,
    traumaQualified: true,
    psychQualified: true,
    chargeQualified: true,
    active: true,
    syntheticDataOnly: true
  },
  {
    nurseId: "nurse-orange",
    displayLabel: "Nurse Orange",
    color: manualAssignmentNurseColorPalette.orange,
    role: "float",
    targetPatientCount: 3,
    maxPatientCount: 4,
    traumaQualified: false,
    psychQualified: false,
    chargeQualified: false,
    active: true,
    syntheticDataOnly: true
  }
];
