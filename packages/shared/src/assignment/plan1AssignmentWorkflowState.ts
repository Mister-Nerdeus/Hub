import type { PlanContract } from "../contracts.js";
import { validatePlan1AssignmentsForOperations } from "./assignmentValidation.js";
import { validatePlan1ManualAssignments } from "./manualAssignmentContract.js";
import { validatePlan1NurseProfiles } from "./nurseProfileContract.js";
import {
  PLAN_1_ID,
  validatePlan1Plan,
  type Plan1AssignmentWarning,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile,
  type Plan1RoomLoad
} from "./plan1AssignmentCommon.js";
import { validatePlan1RoomLoads } from "./roomLoadContract.js";

export type Plan1AssignmentPathSyncStatus = "fresh" | "stale_warning" | "blocked";
const PLAN_1_ASSIGNMENT_PATH_SYNC_STATUSES: Plan1AssignmentPathSyncStatus[] = [
  "fresh",
  "stale_warning",
  "blocked"
];

export type Plan1AssignmentWorkflowState = {
  planId: typeof PLAN_1_ID;
  visualParityStatus: "valid";
  pathSyncStatus: Plan1AssignmentPathSyncStatus;
  nurses: Plan1NurseProfile[];
  roomLoads: Plan1RoomLoad[];
  assignments: Plan1ManualAssignmentRecord[];
  validationWarnings: Plan1AssignmentWarning[];
  syntheticDataOnly: true;
};

export function createPlan1AssignmentWorkflowState(input: {
  plan: PlanContract;
  visualParityStatus?: "valid";
  pathSyncStatus?: Plan1AssignmentPathSyncStatus;
  nurses: unknown[];
  roomLoads: unknown[];
  assignments: unknown[];
}): Plan1AssignmentWorkflowState {
  const plan = validatePlan1Plan(input.plan);
  const visualParityStatus = input.visualParityStatus ?? "valid";
  if (visualParityStatus !== "valid") {
    throw new Error("Plan 1 assignment workflow state requires visualParityStatus valid");
  }
  const pathSyncStatus = input.pathSyncStatus ?? "fresh";
  if (!PLAN_1_ASSIGNMENT_PATH_SYNC_STATUSES.includes(pathSyncStatus)) {
    throw new Error("Plan 1 assignment workflow state pathSyncStatus must be fresh, stale_warning, or blocked");
  }
  const nurses = validatePlan1NurseProfiles(input.nurses, plan);
  const roomLoads = validatePlan1RoomLoads(input.roomLoads, plan);
  const assignments = validatePlan1ManualAssignments(input.assignments, plan, nurses);
  const validation = validatePlan1AssignmentsForOperations({
    plan,
    nurses,
    roomLoads,
    assignments,
    stalePathSync: pathSyncStatus !== "fresh"
  });

  return {
    planId: PLAN_1_ID,
    visualParityStatus,
    pathSyncStatus,
    nurses,
    roomLoads,
    assignments,
    validationWarnings: validation.warnings,
    syntheticDataOnly: true
  };
}
