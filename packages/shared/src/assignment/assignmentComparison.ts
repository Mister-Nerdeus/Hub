import type { PlanContract } from "../contracts.js";
import { buildPlan1AssignmentWalkingPreviews } from "./assignmentWalkingPreview.js";
import { scorePlan1AssignmentBurden } from "./assignmentBurdenScore.js";
import { validatePlan1AssignmentsForOperations } from "./assignmentValidation.js";
import { validatePlan1ManualAssignments } from "./manualAssignmentContract.js";
import { validatePlan1NurseProfiles } from "./nurseProfileContract.js";
import { validatePlan1RoomLoads } from "./roomLoadContract.js";
import {
  requireArray,
  requireExactKeys,
  requireRecord,
  requireString,
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
  const fixtures = requireArray(root.fixtures, "fixtures").map((fixture, index) => {
    const label = `fixtures[${index}]`;
    const record = requireRecord(fixture, label);
    requireExactKeys(record, label, ["fixtureId", "label", "nurses", "roomLoads", "assignments"]);
    const nurses = validatePlan1NurseProfiles(requireArray(record.nurses, `${label}.nurses`), plan);
    return {
      fixtureId: requireString(record.fixtureId, `${label}.fixtureId`),
      label: requireString(record.label, `${label}.label`),
      nurses,
      roomLoads: validatePlan1RoomLoads(requireArray(record.roomLoads, `${label}.roomLoads`), plan),
      assignments: validatePlan1ManualAssignments(requireArray(record.assignments, `${label}.assignments`), plan, nurses)
    };
  });
  return fixtures;
}

export function buildPlan1AssignmentComparisonOutputs(input: {
  plan: PlanContract;
  fixtures: Plan1AssignmentComparisonFixture[];
}): Plan1AssignmentComparisonOutput[] {
  return input.fixtures.map((fixture) => {
    const validation = validatePlan1AssignmentsForOperations({
      plan: input.plan,
      nurses: fixture.nurses,
      roomLoads: fixture.roomLoads,
      assignments: fixture.assignments,
      stalePathSync: false
    });
    const walkingPreviews = buildPlan1AssignmentWalkingPreviews({
      plan: input.plan,
      nurses: fixture.nurses,
      assignments: fixture.assignments,
      stalePathSync: false
    });
    const burden = scorePlan1AssignmentBurden({
      nurses: fixture.nurses,
      roomLoads: fixture.roomLoads,
      assignments: fixture.assignments,
      walkingPreviews,
      warnings: validation.warnings
    });
    const scores = burden.nurseScores.map((score) => score.totalBurdenScore);
    return {
      fixtureId: fixture.fixtureId,
      label: fixture.label,
      nurseCount: fixture.nurses.length,
      assignedRoomCount: fixture.assignments.filter((assignment) => assignment.assignmentType === "primary").length,
      occupiedRoomCount: fixture.roomLoads.filter((roomLoad) => roomLoad.occupied).length,
      totalBurdenScore: burden.totalBurdenScore,
      highestNurseBurdenScore: Math.max(...scores),
      lowestNurseBurdenScore: Math.min(...scores),
      walkingTotalFeet: walkingPreviews.reduce((total, preview) => total + preview.totalApproxDistanceFeet, 0),
      warningCodes: [...new Set(validation.warnings.map((warning) => warning.code))],
      limitations: [...burden.limitations]
    };
  });
}
