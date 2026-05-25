import type { PlanContract } from "../contracts.js";
import {
  PLAN_1_ASSIGNMENT_SOURCES,
  PLAN_1_ASSIGNMENT_TYPES,
  assertNoDuplicateStrings,
  nurseIdsForProfiles,
  requireEnum,
  requireExactKeys,
  requireInteger,
  requireLiteralTrue,
  requireRecord,
  requireString,
  roomIdsForPlan,
  validatePlan1Plan,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile
} from "./plan1AssignmentCommon.js";

const MANUAL_ASSIGNMENT_KEYS = [
  "assignmentId",
  "roomId",
  "nurseId",
  "assignmentType",
  "startMinute",
  "endMinute",
  "source",
  "syntheticDataOnly"
];

export function validatePlan1ManualAssignmentRecord(
  value: unknown,
  plan: PlanContract,
  nurses: Plan1NurseProfile[],
  index = 0
): Plan1ManualAssignmentRecord {
  const validatedPlan = validatePlan1Plan(plan);
  const label = `assignments[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, MANUAL_ASSIGNMENT_KEYS);
  const roomId = requireString(record.roomId, `${label}.roomId`);
  if (!roomIdsForPlan(validatedPlan).has(roomId)) {
    throw new Error(`${label}.roomId must reference a Plan 1 room`);
  }
  const nurseId = requireString(record.nurseId, `${label}.nurseId`);
  if (!nurseIdsForProfiles(nurses).has(nurseId)) {
    throw new Error(`${label}.nurseId must reference a synthetic Plan 1 nurse`);
  }
  const startMinute = requireInteger(record.startMinute, `${label}.startMinute`, 0);
  const endMinute = record.endMinute == null ? null : requireInteger(record.endMinute, `${label}.endMinute`, 0);
  if (endMinute != null && endMinute <= startMinute) {
    throw new Error(`${label}.endMinute must be greater than startMinute`);
  }
  return {
    assignmentId: requireString(record.assignmentId, `${label}.assignmentId`),
    roomId,
    nurseId,
    assignmentType: requireEnum(record.assignmentType, PLAN_1_ASSIGNMENT_TYPES, `${label}.assignmentType`),
    startMinute,
    endMinute,
    source: requireEnum(record.source, PLAN_1_ASSIGNMENT_SOURCES, `${label}.source`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validatePlan1ManualAssignments(
  values: unknown[],
  plan: PlanContract,
  nurses: Plan1NurseProfile[]
): Plan1ManualAssignmentRecord[] {
  const assignments = values.map((value, index) =>
    validatePlan1ManualAssignmentRecord(value, plan, nurses, index)
  );
  assertNoDuplicateStrings(assignments.map((assignment) => assignment.assignmentId), "assignmentId");
  const primaryRoomIds = assignments
    .filter((assignment) => assignment.assignmentType === "primary")
    .map((assignment) => assignment.roomId);
  assertNoDuplicateStrings(primaryRoomIds, "primary room assignment");
  return assignments;
}
