import { buildFourPatientManualAssignmentComparison } from "@nerdeus/shared";

export type FourPatientComparisonViewModel = {
  rows: FourPatientComparisonRow[];
  warningCodes: string[];
};

export type FourPatientComparisonRow = {
  nurseId: string;
  label: string;
  assignedRoomCount: number;
  acuityBurden: number;
  specialBurden: number;
  walkingBurden: number;
  totalBurden: number;
};

export function createFourPatientComparisonViewModel(): FourPatientComparisonViewModel {
  const proof = buildFourPatientManualAssignmentComparison();
  const nurseLabels = new Map(proof.nurses.map((nurse) => [nurse.nurseId, nurse.displayLabel]));
  return {
    rows: proof.burdenScores.map((score) => ({
      nurseId: score.nurseId,
      label: nurseLabels.get(score.nurseId) ?? score.nurseId,
      assignedRoomCount: score.assignedRoomCount,
      acuityBurden: score.acuityBurden,
      specialBurden: score.specialBurden,
      walkingBurden: score.walkingBurden,
      totalBurden: score.totalBurden
    })),
    warningCodes: [...new Set(proof.warnings.map((warning) => warning.code))].sort()
  };
}
