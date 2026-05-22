import type {
  BasicNurseTaskAssignmentResult,
  GeneratedOperationalTask,
  GeneratedOperationalTaskSetContract,
  ManualAssignmentContract,
  NurseTaskAssignment,
  NurseTaskAssignmentContract,
  PlanContract,
  RoomLoad,
  Warning
} from "../contracts.js";
import {
  validateGeneratedOperationalTaskSet,
  validateNurseTaskAssignmentContract
} from "../contracts.js";
import { validateManualAssignment } from "../assignment/validateManualAssignment.js";

export type AssignTasksByManualCoverageInput = {
  plan: PlanContract;
  roomLoads: RoomLoad[];
  assignmentSet: ManualAssignmentContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
};

type WarningDraft = Omit<Warning, "id">;

export function assignTasksByManualCoverage(
  input: AssignTasksByManualCoverageInput
): BasicNurseTaskAssignmentResult {
  const generatedTaskSet = validateGeneratedOperationalTaskSet(input.generatedTaskSet);
  const manualValidation = validateManualAssignment(input.plan, input.roomLoads, input.assignmentSet);
  const roomIds = new Set(input.plan.rooms.map((room) => room.id));
  const nurseIds = new Set(input.assignmentSet.nurses.map((nurse) => nurse.id));
  const manualCoverageByRoomId = buildManualCoverageByRoomId(
    input.assignmentSet,
    manualValidation.assignedRoomMap,
    roomIds,
    nurseIds
  );
  const perNurseTaskCounts = Object.fromEntries(
    input.assignmentSet.nurses.map((nurse) => [nurse.id, 0])
  ) as Record<string, number>;
  const perNurseEstimatedMinutes = Object.fromEntries(
    input.assignmentSet.nurses.map((nurse) => [nurse.id, 0])
  ) as Record<string, number>;
  const warnings: Warning[] = [];
  const taskAssignments: NurseTaskAssignment[] = [];

  const sortedTasks = [...generatedTaskSet.generatedTasks].sort(compareTasks);
  for (const task of sortedTasks) {
    if (!roomIds.has(task.roomId)) {
      taskAssignments.push(unassignedTaskAssignment(task));
      warnings.push(
        warning({
          severity: "critical",
          code: "UNKNOWN_ROOM",
          message: `Generated task ${task.id} references unknown room ${task.roomId}.`,
          roomIds: [task.roomId],
          taskIds: [task.id],
          minute: task.scheduledMinute
        })
      );
      continue;
    }

    const nurseId = manualCoverageByRoomId.get(task.roomId);
    if (nurseId == null) {
      taskAssignments.push(unassignedTaskAssignment(task));
      const assignedNurseIds = manualValidation.assignedRoomMap[task.roomId] ?? [];
      warnings.push(
        warning({
          severity: assignedNurseIds.length > 1 ? "critical" : "warning",
          code: "ROOM_WITHOUT_COVERAGE",
          message:
            assignedNurseIds.length > 1
              ? `Generated task ${task.id} is unassigned because room ${task.roomId} has duplicate manual coverage.`
              : `Generated task ${task.id} is unassigned because room ${task.roomId} has no valid manual coverage.`,
          nurseIds: assignedNurseIds.length > 0 ? [...assignedNurseIds].sort() : undefined,
          roomIds: [task.roomId],
          taskIds: [task.id],
          minute: task.scheduledMinute
        })
      );
      continue;
    }

    taskAssignments.push({
      id: buildAssignmentId(task),
      taskId: task.id,
      nurseId,
      assignmentReason: "manual_room_coverage",
      minute: task.scheduledMinute
    });
    perNurseTaskCounts[nurseId] = (perNurseTaskCounts[nurseId] ?? 0) + 1;
    perNurseEstimatedMinutes[nurseId] =
      (perNurseEstimatedMinutes[nurseId] ?? 0) + task.estimatedDurationMinutes;
  }

  const assignmentSet: NurseTaskAssignmentContract = {
    schemaVersion: "1.0.0",
    nurseTaskAssignmentSetId: `nurse-task-assignment-${generatedTaskSet.generatedTaskSetId}`,
    scenarioId: generatedTaskSet.scenarioId,
    assignmentSetId: input.assignmentSet.assignmentSetId,
    generatedTaskSetId: generatedTaskSet.generatedTaskSetId,
    name: `Manual Coverage Task Assignment for ${generatedTaskSet.generatedTaskSetId}`,
    description: "Deterministic operational proof using existing manual room coverage only.",
    taskAssignments
  };

  const validatedAssignmentSet = validateNurseTaskAssignmentContract(
    assignmentSet,
    undefined,
    input.assignmentSet,
    generatedTaskSet
  );
  const sortedWarnings = warnings.sort((left, right) => left.id.localeCompare(right.id));

  return {
    assignmentSet: validatedAssignmentSet,
    warnings: sortedWarnings,
    assignedTaskCount: validatedAssignmentSet.taskAssignments.filter(
      (assignment) => assignment.assignmentReason !== "unassigned"
    ).length,
    unassignedTaskCount: validatedAssignmentSet.taskAssignments.filter(
      (assignment) => assignment.assignmentReason === "unassigned"
    ).length,
    perNurseTaskCounts,
    perNurseEstimatedMinutes
  };
}

function buildManualCoverageByRoomId(
  assignmentSet: ManualAssignmentContract,
  assignedRoomMap: Record<string, string[]>,
  roomIds: Set<string>,
  nurseIds: Set<string>
): Map<string, string> {
  const coverage = new Map<string, string>();
  for (const assignment of assignmentSet.assignments) {
    if (assignment.assignmentType !== "manual" || !nurseIds.has(assignment.nurseId)) {
      continue;
    }
    for (const roomId of assignment.roomIds) {
      if (!roomIds.has(roomId)) {
        continue;
      }
      if ((assignedRoomMap[roomId] ?? []).length === 1) {
        coverage.set(roomId, assignment.nurseId);
      }
    }
  }
  return coverage;
}

function unassignedTaskAssignment(task: GeneratedOperationalTask): NurseTaskAssignment {
  return {
    id: buildAssignmentId(task),
    taskId: task.id,
    nurseId: null,
    assignmentReason: "unassigned",
    minute: task.scheduledMinute
  };
}

function buildAssignmentId(task: GeneratedOperationalTask): string {
  return `nurse-task-${task.id}`;
}

function warning(draft: WarningDraft): Warning {
  const parts = [
    draft.code,
    draft.taskIds?.join(",") ?? "",
    draft.roomIds?.join(",") ?? "",
    draft.minute?.toString() ?? ""
  ];
  return {
    ...draft,
    id: parts.join(":").replace(/:+$/g, "")
  };
}

function compareTasks(left: GeneratedOperationalTask, right: GeneratedOperationalTask): number {
  const minuteDelta = left.scheduledMinute - right.scheduledMinute;
  if (minuteDelta !== 0) {
    return minuteDelta;
  }
  return left.id.localeCompare(right.id);
}
