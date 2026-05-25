import type { PlanContract } from "../contracts.js";
import { buildPlan1AssignmentWalkingPreviews } from "./assignmentWalkingPreview.js";
import { scorePlan1AssignmentBurden } from "./assignmentBurdenScore.js";
import { validatePlan1AssignmentsForOperations } from "./assignmentValidation.js";
import { validatePlan1ManualAssignments } from "./manualAssignmentContract.js";
import { validatePlan1NurseProfiles } from "./nurseProfileContract.js";
import {
  createPlan1AssignmentWorkflowState,
  type Plan1AssignmentWorkflowState
} from "./plan1AssignmentWorkflowState.js";
import { validatePlan1RoomLoads } from "./roomLoadContract.js";
import {
  PLAN_1_ID,
  assertNoDuplicateStrings,
  requireArray,
  requireExactKeys,
  requireRecord,
  requireString,
  validatePlan1AssignmentText,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile,
  type Plan1RoomLoad
} from "./plan1AssignmentCommon.js";

export type Plan1AssignmentComparisonFixture = {
  fixtureId: string;
  label: string;
  nurses: Plan1NurseProfile[];
  roomLoads: Plan1RoomLoad[];
  assignments: Plan1ManualAssignmentRecord[];
  workflowState: Plan1AssignmentWorkflowState;
};

export type Plan1AssignmentComparisonOutput = {
  fixtureId: string;
  label: string;
  nurseCount: number;
  assignedRoomCount: number;
  occupiedRoomCount: number;
  totalBurdenScore: number;
  highestNurseBurdenScore: number;
  lowestNurseBurdenScore: number;
  walkingTotalFeet: number;
  warningCodes: string[];
  limitations: string[];
};

export function validatePlan1AssignmentComparisonFixtures(
  value: unknown,
  plan: PlanContract
): Plan1AssignmentComparisonFixture[] {
  const root = requireRecord(value, "assignmentComparisonFixtures");
  requireExactKeys(root, "assignmentComparisonFixtures", ["schemaVersion", "planId", "fixtures"]);
  if (root.schemaVersion !== "1.0.0") {
    throw new Error("assignmentComparisonFixtures.schemaVersion must be 1.0.0");
  }
  if (root.planId !== PLAN_1_ID || root.planId !== plan.planId) {
    throw new Error("assignmentComparisonFixtures.planId must match default-er-layout-plan-1");
  }
  const fixtures = requireArray(root.fixtures, "fixtures").map((fixture, index) => {
    const label = `fixtures[${index}]`;
    const record = requireRecord(fixture, label);
    requireExactKeys(record, label, ["fixtureId", "label", "nurses", "roomLoads", "assignments"]);
    const fixtureId = requireString(record.fixtureId, `${label}.fixtureId`);
    const nurses = validatePlan1NurseProfiles(requireArray(record.nurses, `${label}.nurses`), plan);
    const roomLoads = validatePlan1RoomLoads(requireArray(record.roomLoads, `${label}.roomLoads`), plan);
    const assignments = validatePlan1ManualAssignments(requireArray(record.assignments, `${label}.assignments`), plan, nurses);
    const workflowState = createPlan1AssignmentWorkflowState({
      plan,
      nurses,
      roomLoads,
      assignments,
      pathSyncStatus: "fresh"
    });
    return {
      fixtureId,
      label: validatePlan1AssignmentText(requireString(record.label, `${label}.label`), `${label}.label`),
      nurses,
      roomLoads,
      assignments,
      workflowState
    };
  });
  assertNoDuplicateStrings(fixtures.map((fixture) => fixture.fixtureId), "comparison fixtureId");
  return fixtures;
}

export function buildPlan1AssignmentComparisonOutputs(input: {
  plan: PlanContract;
  fixtures: Plan1AssignmentComparisonFixture[];
}): Plan1AssignmentComparisonOutput[] {
  return input.fixtures.map((fixture) => {
    const state = fixture.workflowState;
    const validation = validatePlan1AssignmentsForOperations({
      plan: input.plan,
      nurses: state.nurses,
      roomLoads: state.roomLoads,
      assignments: state.assignments,
      stalePathSync: state.pathSyncStatus !== "fresh"
    });
    const walkingPreviews = buildPlan1AssignmentWalkingPreviews({
      plan: input.plan,
      nurses: state.nurses,
      assignments: state.assignments,
      stalePathSync: state.pathSyncStatus !== "fresh"
    });
    const burden = scorePlan1AssignmentBurden({
      nurses: state.nurses,
      roomLoads: state.roomLoads,
      assignments: state.assignments,
      walkingPreviews,
      warnings: validation.warnings
    });
    const scores = burden.nurseScores.map((score) => score.totalBurdenScore);
    return {
      fixtureId: fixture.fixtureId,
      label: fixture.label,
      nurseCount: state.nurses.length,
      assignedRoomCount: state.assignments.filter((assignment) => assignment.assignmentType === "primary").length,
      occupiedRoomCount: state.roomLoads.filter((roomLoad) => roomLoad.occupied).length,
      totalBurdenScore: burden.totalBurdenScore,
      highestNurseBurdenScore: Math.max(...scores),
      lowestNurseBurdenScore: Math.min(...scores),
      walkingTotalFeet: walkingPreviews.reduce((total, preview) => total + preview.totalApproxDistanceFeet, 0),
      warningCodes: [...new Set(validation.warnings.map((warning) => warning.code))],
      limitations: [...burden.limitations]
    };
  });
}
