import {
  validateManualAssignmentNurse,
  type ManualAssignmentNurse
} from "@nerdeus/shared";

export type NurseProfileCardViewModel = {
  nurseId: string;
  displayLabel: string;
  color: string;
  role: string;
  targetPatientCount: number;
  maxPatientCount: number;
  assignedPatientCount: number;
  qualificationLabels: string[];
  activeLabel: "Active" | "Inactive";
};

export function createNurseProfileViewModel(
  nurses: ManualAssignmentNurse[],
  assignedPatientCounts: Record<string, number> = {}
): NurseProfileCardViewModel[] {
  return nurses.map((nurse) => {
    const validated = validateManualAssignmentNurse(nurse);
    return {
      nurseId: validated.nurseId,
      displayLabel: validated.displayLabel,
      color: validated.color,
      role: validated.role,
      targetPatientCount: validated.targetPatientCount,
      maxPatientCount: validated.maxPatientCount,
      assignedPatientCount: assignedPatientCounts[validated.nurseId] ?? 0,
      qualificationLabels: qualificationLabels(validated),
      activeLabel: validated.active ? "Active" : "Inactive"
    };
  });
}

function qualificationLabels(nurse: ManualAssignmentNurse): string[] {
  return [
    nurse.traumaQualified ? "Trauma" : null,
    nurse.psychQualified ? "Psych" : null,
    nurse.chargeQualified ? "Charge" : null
  ].filter((label): label is string => label != null);
}
