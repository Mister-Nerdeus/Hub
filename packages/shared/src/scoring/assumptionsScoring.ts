import type {
  AssumptionsRegisterContract,
  ManualAssignmentContract,
  NurseBurdenResult,
  PlanContract,
  RoomLoad,
  RoomWorkloadScore
} from "../contracts.js";
import { validateAssumptionsRegisterContract } from "../contracts.js";
import {
  NURSE_BURDEN_PENALTIES,
  scoreNurseBurdenWithWeights
} from "./nurseBurdenScore.js";
import {
  ROOM_WORKLOAD_WEIGHTS,
  scoreRoomLoadWithWeights
} from "./roomWorkloadScore.js";

export function scoreRoomLoadWithAssumptions(
  roomLoad: RoomLoad,
  assumptions: AssumptionsRegisterContract
): RoomWorkloadScore {
  const validatedAssumptions = validateAssumptionsRegisterContract(assumptions);
  return scoreRoomLoadWithWeights(roomLoad, validatedAssumptions.roomWorkloadWeights);
}

export function scoreNurseBurdenWithAssumptions(
  plan: PlanContract,
  roomLoads: RoomLoad[],
  assignmentSet: ManualAssignmentContract,
  assumptions: AssumptionsRegisterContract
): NurseBurdenResult {
  const validatedAssumptions = validateAssumptionsRegisterContract(assumptions);
  return scoreNurseBurdenWithWeights(
    plan,
    roomLoads,
    assignmentSet,
    validatedAssumptions.nurseBurdenWeights,
    (roomLoad) => scoreRoomLoadWithWeights(roomLoad, validatedAssumptions.roomWorkloadWeights)
  );
}

export function assertDefaultScoringAssumptionParity(
  assumptions: AssumptionsRegisterContract
): void {
  const validatedAssumptions = validateAssumptionsRegisterContract(assumptions);
  const comparisons: Array<[string, number, number]> = [
    [
      "roomWorkloadWeights.acuity.1",
      validatedAssumptions.roomWorkloadWeights.acuity["1"],
      ROOM_WORKLOAD_WEIGHTS.acuity[1]
    ],
    [
      "roomWorkloadWeights.acuity.2",
      validatedAssumptions.roomWorkloadWeights.acuity["2"],
      ROOM_WORKLOAD_WEIGHTS.acuity[2]
    ],
    [
      "roomWorkloadWeights.acuity.3",
      validatedAssumptions.roomWorkloadWeights.acuity["3"],
      ROOM_WORKLOAD_WEIGHTS.acuity[3]
    ],
    [
      "roomWorkloadWeights.acuity.4",
      validatedAssumptions.roomWorkloadWeights.acuity["4"],
      ROOM_WORKLOAD_WEIGHTS.acuity[4]
    ],
    [
      "roomWorkloadWeights.acuity.5",
      validatedAssumptions.roomWorkloadWeights.acuity["5"],
      ROOM_WORKLOAD_WEIGHTS.acuity[5]
    ],
    [
      "roomWorkloadWeights.traumaActive",
      validatedAssumptions.roomWorkloadWeights.traumaActive,
      ROOM_WORKLOAD_WEIGHTS.traumaActive
    ],
    [
      "roomWorkloadWeights.isolationActive",
      validatedAssumptions.roomWorkloadWeights.isolationActive,
      ROOM_WORKLOAD_WEIGHTS.isolationActive
    ],
    [
      "roomWorkloadWeights.behavioralRisk",
      validatedAssumptions.roomWorkloadWeights.behavioralRisk,
      ROOM_WORKLOAD_WEIGHTS.behavioralRisk
    ],
    [
      "roomWorkloadWeights.fallRisk",
      validatedAssumptions.roomWorkloadWeights.fallRisk,
      ROOM_WORKLOAD_WEIGHTS.fallRisk
    ],
    [
      "roomWorkloadWeights.sitterRequired",
      validatedAssumptions.roomWorkloadWeights.sitterRequired,
      ROOM_WORKLOAD_WEIGHTS.sitterRequired
    ],
    [
      "roomWorkloadWeights.highMedicationFrequency",
      validatedAssumptions.roomWorkloadWeights.highMedicationFrequency,
      ROOM_WORKLOAD_WEIGHTS.highMedicationFrequency
    ],
    [
      "roomWorkloadWeights.highMonitoringFrequency",
      validatedAssumptions.roomWorkloadWeights.highMonitoringFrequency,
      ROOM_WORKLOAD_WEIGHTS.highMonitoringFrequency
    ],
    [
      "roomWorkloadWeights.highProcedureBurden",
      validatedAssumptions.roomWorkloadWeights.highProcedureBurden,
      ROOM_WORKLOAD_WEIGHTS.highProcedureBurden
    ],
    [
      "nurseBurdenWeights.roomSpreadPerAdditionalOccupiedRoom",
      validatedAssumptions.nurseBurdenWeights.roomSpreadPerAdditionalOccupiedRoom,
      NURSE_BURDEN_PENALTIES.roomSpreadPerAdditionalOccupiedRoom
    ],
    [
      "nurseBurdenWeights.overTargetPerRoom",
      validatedAssumptions.nurseBurdenWeights.overTargetPerRoom,
      NURSE_BURDEN_PENALTIES.overTargetPerRoom
    ],
    [
      "nurseBurdenWeights.overMaxPerRoom",
      validatedAssumptions.nurseBurdenWeights.overMaxPerRoom,
      NURSE_BURDEN_PENALTIES.overMaxPerRoom
    ],
    [
      "nurseBurdenWeights.traumaMismatchPerRoom",
      validatedAssumptions.nurseBurdenWeights.traumaMismatchPerRoom,
      NURSE_BURDEN_PENALTIES.traumaMismatchPerRoom
    ],
    [
      "nurseBurdenWeights.activeTaskMinutesPlaceholder",
      validatedAssumptions.nurseBurdenWeights.activeTaskMinutesPlaceholder,
      NURSE_BURDEN_PENALTIES.activeTaskMinutesPlaceholder
    ],
    [
      "nurseBurdenWeights.walkingMinutesPlaceholder",
      validatedAssumptions.nurseBurdenWeights.walkingMinutesPlaceholder,
      NURSE_BURDEN_PENALTIES.walkingMinutesPlaceholder
    ],
    [
      "nurseBurdenWeights.breakCoveragePenaltyPlaceholder",
      validatedAssumptions.nurseBurdenWeights.breakCoveragePenaltyPlaceholder,
      NURSE_BURDEN_PENALTIES.breakCoveragePenaltyPlaceholder
    ],
    [
      "nurseBurdenWeights.interruptionPenaltyPlaceholder",
      validatedAssumptions.nurseBurdenWeights.interruptionPenaltyPlaceholder,
      NURSE_BURDEN_PENALTIES.interruptionPenaltyPlaceholder
    ]
  ];

  for (const [path, assumptionValue, defaultValue] of comparisons) {
    if (assumptionValue !== defaultValue) {
      throw new Error(
        `Default scoring assumption parity mismatch at ${path}: assumptions-basic value ${assumptionValue} does not match default scoring value ${defaultValue}`
      );
    }
  }
}
