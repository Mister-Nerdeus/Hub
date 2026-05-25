import {
  roundPlan1Number,
  type Plan1AssignmentWarning,
  type Plan1BurdenLevel,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile,
  type Plan1RoomLoad
} from "./plan1AssignmentCommon.js";
import type { Plan1AssignmentWalkingPreview } from "./assignmentWalkingPreview.js";

export const PLAN_1_BURDEN_SCORE_WEIGHTS = {
  occupiedRoom: 5,
  acuity: { low: 1, medium: 3, high: 6, critical: 10 },
  trauma: 8,
  isolation: 4,
  behavioralRisk: 4,
  sitter: 5,
  fallRisk: 2,
  burden: { none: 0, low: 1, medium: 3, high: 5 },
  turnover: 3,
  walkingDistanceDivisorFeet: 40,
  walkingTimeDivisorSeconds: 120,
  warningPenalty: { info: 1, warning: 5, blocking: 10 }
} as const;

export const PLAN_1_BURDEN_SCORE_LIMITATIONS = [
  "This is an operational comparison score only.",
  "Room count alone does not determine score.",
  "It is not a clinical safety score.",
  "It is not a staffing compliance recommendation.",
  "It is not a patient outcome prediction."
];

export type Plan1NurseBurdenScore = {
  nurseId: string;
  assignedOccupiedRoomCount: number;
  acuityLoadPoints: number;
  traumaLoadPoints: number;
  isolationLoadPoints: number;
  behavioralRiskPoints: number;
  sitterLoadPoints: number;
  fallRiskPoints: number;
  medicationBurdenPoints: number;
  procedureBurdenPoints: number;
  turnoverBurdenPoints: number;
  walkingDistancePoints: number;
  walkingTimePoints: number;
  warningPenaltyPoints: number;
  totalBurdenScore: number;
  limitations: string[];
};

export type Plan1AssignmentBurdenScore = {
  nurseScores: Plan1NurseBurdenScore[];
  totalBurdenScore: number;
  assumptions: typeof PLAN_1_BURDEN_SCORE_WEIGHTS;
  limitations: string[];
};

export function scorePlan1AssignmentBurden(input: {
  nurses: Plan1NurseProfile[];
  roomLoads: Plan1RoomLoad[];
  assignments: Plan1ManualAssignmentRecord[];
  walkingPreviews: Plan1AssignmentWalkingPreview[];
  warnings: Plan1AssignmentWarning[];
}): Plan1AssignmentBurdenScore {
  const loadByRoomId = new Map(input.roomLoads.map((load) => [load.roomId, load]));
  const walkingByNurseId = new Map(input.walkingPreviews.map((preview) => [preview.nurseId, preview]));
  const warningsByNurseId = new Map<string, Plan1AssignmentWarning[]>();
  for (const warning of input.warnings) {
    for (const nurseId of warning.nurseIds.length === 0 ? input.nurses.map((nurse) => nurse.nurseId) : warning.nurseIds) {
      const current = warningsByNurseId.get(nurseId) ?? [];
      current.push(warning);
      warningsByNurseId.set(nurseId, current);
    }
  }

  const nurseScores = input.nurses.map((nurse) => {
    const assignedRoomIds = input.assignments
      .filter((assignment) => assignment.nurseId === nurse.nurseId && assignment.assignmentType === "primary")
      .map((assignment) => assignment.roomId);
    const assignedLoads = assignedRoomIds
      .map((roomId) => loadByRoomId.get(roomId))
      .filter((load): load is Plan1RoomLoad => load != null && load.occupied);
    const walking = walkingByNurseId.get(nurse.nurseId);
    const assignedOccupiedRoomCount = assignedLoads.length;
    const acuityLoadPoints = sum(assignedLoads.map((load) => PLAN_1_BURDEN_SCORE_WEIGHTS.acuity[load.acuityLevel]));
    const traumaLoadPoints = sum(assignedLoads.map((load) => (load.traumaActive ? PLAN_1_BURDEN_SCORE_WEIGHTS.trauma : 0)));
    const isolationLoadPoints = sum(assignedLoads.map((load) => (load.isolationActive ? PLAN_1_BURDEN_SCORE_WEIGHTS.isolation : 0)));
    const behavioralRiskPoints = sum(assignedLoads.map((load) => (load.behavioralRisk ? PLAN_1_BURDEN_SCORE_WEIGHTS.behavioralRisk : 0)));
    const sitterLoadPoints = sum(assignedLoads.map((load) => (load.sitterRequired ? PLAN_1_BURDEN_SCORE_WEIGHTS.sitter : 0)));
    const fallRiskPoints = sum(assignedLoads.map((load) => (load.fallRisk ? PLAN_1_BURDEN_SCORE_WEIGHTS.fallRisk : 0)));
    const medicationBurdenPoints = sum(assignedLoads.map((load) => burdenPoints(load.medicationBurden)));
    const procedureBurdenPoints = sum(assignedLoads.map((load) => burdenPoints(load.procedureBurden)));
    const turnoverBurdenPoints = sum(assignedLoads.map((load) => (load.turnoverExpected ? PLAN_1_BURDEN_SCORE_WEIGHTS.turnover : 0)));
    const walkingDistancePoints = roundPlan1Number((walking?.totalApproxDistanceFeet ?? 0) / PLAN_1_BURDEN_SCORE_WEIGHTS.walkingDistanceDivisorFeet);
    const walkingTimePoints = roundPlan1Number((walking?.totalApproxTravelSeconds ?? 0) / PLAN_1_BURDEN_SCORE_WEIGHTS.walkingTimeDivisorSeconds);
    const warningPenaltyPoints = sum(
      (warningsByNurseId.get(nurse.nurseId) ?? []).map(
        (warning) => PLAN_1_BURDEN_SCORE_WEIGHTS.warningPenalty[warning.severity]
      )
    );
    const totalBurdenScore = roundPlan1Number(
      assignedOccupiedRoomCount * PLAN_1_BURDEN_SCORE_WEIGHTS.occupiedRoom +
        acuityLoadPoints +
        traumaLoadPoints +
        isolationLoadPoints +
        behavioralRiskPoints +
        sitterLoadPoints +
        fallRiskPoints +
        medicationBurdenPoints +
        procedureBurdenPoints +
        turnoverBurdenPoints +
        walkingDistancePoints +
        walkingTimePoints +
        warningPenaltyPoints
    );
    return {
      nurseId: nurse.nurseId,
      assignedOccupiedRoomCount,
      acuityLoadPoints,
      traumaLoadPoints,
      isolationLoadPoints,
      behavioralRiskPoints,
      sitterLoadPoints,
      fallRiskPoints,
      medicationBurdenPoints,
      procedureBurdenPoints,
      turnoverBurdenPoints,
      walkingDistancePoints,
      walkingTimePoints,
      warningPenaltyPoints,
      totalBurdenScore,
      limitations: [...PLAN_1_BURDEN_SCORE_LIMITATIONS]
    };
  });

  return {
    nurseScores,
    totalBurdenScore: roundPlan1Number(sum(nurseScores.map((score) => score.totalBurdenScore))),
    assumptions: PLAN_1_BURDEN_SCORE_WEIGHTS,
    limitations: [...PLAN_1_BURDEN_SCORE_LIMITATIONS]
  };
}

function burdenPoints(level: Plan1BurdenLevel): number {
  return PLAN_1_BURDEN_SCORE_WEIGHTS.burden[level];
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
