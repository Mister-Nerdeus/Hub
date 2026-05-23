import type { NurseTaskAssignment } from "../contracts.js";
import type {
  OptimizerConstraintAdapterInput,
  OptimizerConstraintAdapterOutput
} from "./optimizationContract.js";

export function constrainOptimizerCandidateAssignments(
  input: OptimizerConstraintAdapterInput
): OptimizerConstraintAdapterOutput {
  const generatedTaskIds = [...input.generatedTaskIds];
  const knownTaskIds = uniqueIdSet(generatedTaskIds, "generatedTaskIds");
  const allowedNurseIds = uniqueIdSet(input.allowedNurseIds, "allowedNurseIds");
  const assignedCandidateReason = input.assignedCandidateReason ?? "optimizer_candidate";
  const baseByTaskId = assignmentByTaskId(
    input.baseAssignments,
    "baseAssignments",
    knownTaskIds,
    allowedNurseIds
  );
  const candidateByTaskId = assignmentByTaskId(
    input.candidateAssignments,
    "candidateAssignments",
    knownTaskIds,
    allowedNurseIds
  );

  const preservedUnassignedTaskIds: string[] = [];
  const taskAssignments = generatedTaskIds.map((taskId) => {
    const baseAssignment = baseByTaskId.get(taskId);
    if (baseAssignment == null) {
      throw new Error(`baseAssignments missing known task ${taskId}`);
    }
    const candidateAssignment = candidateByTaskId.get(taskId);
    if (candidateAssignment == null) {
      throw new Error(`candidateAssignments missing known task ${taskId}`);
    }

    if (baseAssignment.assignmentReason === "unassigned") {
      preservedUnassignedTaskIds.push(taskId);
      return { ...baseAssignment };
    }
    if (candidateAssignment.assignmentReason === "unassigned") {
      return { ...candidateAssignment };
    }
    if (assignedCandidateReason === "preserve") {
      return { ...candidateAssignment };
    }
    return { ...candidateAssignment, assignmentReason: assignedCandidateReason };
  });

  return {
    taskAssignments,
    preservedUnassignedTaskIds
  };
}

function assignmentByTaskId(
  assignments: NurseTaskAssignment[],
  label: string,
  knownTaskIds: Set<string>,
  allowedNurseIds: Set<string>
): Map<string, NurseTaskAssignment> {
  const assignmentsByTaskId = new Map<string, NurseTaskAssignment>();
  assignments.forEach((assignment, index) => {
    if (!knownTaskIds.has(assignment.taskId)) {
      throw new Error(`${label}[${index}].taskId references an unknown task`);
    }
    if (assignmentsByTaskId.has(assignment.taskId)) {
      throw new Error(`${label}[${index}].taskId duplicates an assignment task`);
    }
    if (assignment.assignmentReason === "unassigned") {
      if (assignment.nurseId != null) {
        throw new Error(`${label}[${index}].nurseId must be null when unassigned`);
      }
    } else if (assignment.nurseId == null) {
      throw new Error(`${label}[${index}].nurseId is required unless unassigned`);
    } else if (!allowedNurseIds.has(assignment.nurseId)) {
      throw new Error(`${label}[${index}].nurseId references an unknown nurse`);
    }
    assignmentsByTaskId.set(assignment.taskId, assignment);
  });
  return assignmentsByTaskId;
}

function uniqueIdSet(ids: string[], label: string): Set<string> {
  const idSet = new Set<string>();
  ids.forEach((id, index) => {
    if (typeof id !== "string" || id.length === 0) {
      throw new Error(`${label}[${index}] must be a non-empty string`);
    }
    if (idSet.has(id)) {
      throw new Error(`${label}[${index}] duplicates an id`);
    }
    idSet.add(id);
  });
  return idSet;
}
