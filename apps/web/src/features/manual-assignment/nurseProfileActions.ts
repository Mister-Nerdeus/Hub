import {
  validateAssignmentSetContract,
  type AssignmentSetContract,
  type NurseProfileContract
} from "@nerdeus/shared";

const nurseProfileColors = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#0f766e", "#64748b"];

export function addNurseProfile(
  assignmentSet: AssignmentSetContract,
  nowIso = new Date().toISOString()
): AssignmentSetContract {
  const index = assignmentSet.nurseProfiles.length + 1;
  return validateAssignmentSetContract({
    ...assignmentSet,
    nurseProfiles: [
      ...assignmentSet.nurseProfiles,
      {
        schemaVersion: "1.0.0",
        nurseProfileId: `nurse-${String(index).padStart(2, "0")}`,
        displayLabel: `Nurse ${index}`,
        color: nurseProfileColors[(index - 1) % nurseProfileColors.length] ?? "#64748b",
        role: "primary",
        targetPatientCount: 4,
        maxPatientCount: 5,
        traumaQualified: false,
        psychQualified: false,
        chargeQualified: false,
        active: true
      } satisfies NurseProfileContract
    ],
    updatedAt: nowIso
  });
}

export function updateNurseProfile(
  assignmentSet: AssignmentSetContract,
  nurseProfile: NurseProfileContract,
  nowIso = new Date().toISOString()
): AssignmentSetContract {
  return validateAssignmentSetContract({
    ...assignmentSet,
    nurseProfiles: assignmentSet.nurseProfiles.map((candidate) =>
      candidate.nurseProfileId === nurseProfile.nurseProfileId ? nurseProfile : candidate
    ),
    updatedAt: nowIso
  });
}

export function deactivateNurseProfile(
  assignmentSet: AssignmentSetContract,
  nurseProfileId: string,
  nowIso = new Date().toISOString()
): AssignmentSetContract {
  return validateAssignmentSetContract({
    ...assignmentSet,
    nurseProfiles: assignmentSet.nurseProfiles.map((candidate) =>
      candidate.nurseProfileId === nurseProfileId ? { ...candidate, active: false } : candidate
    ),
    updatedAt: nowIso
  });
}

export function listInactiveNurseAssignmentRoomIds(
  assignmentSet: AssignmentSetContract
): string[] {
  const inactiveNurseIds = new Set(
    assignmentSet.nurseProfiles
      .filter((nurse) => !nurse.active)
      .map((nurse) => nurse.nurseProfileId)
  );
  return Object.entries(assignmentSet.assignmentsByRoomId)
    .filter(([, nurseId]) => inactiveNurseIds.has(nurseId))
    .map(([roomId]) => roomId)
    .sort();
}
