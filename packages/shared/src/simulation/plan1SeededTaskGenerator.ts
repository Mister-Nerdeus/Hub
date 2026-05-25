import { PLAN_1_ID, roundPlan1Number, type Plan1ManualAssignmentRecord } from "../assignment/plan1AssignmentCommon.js";
import { createSeededRandom } from "../random/seededRandom.js";
import {
  plan1TaskTemplateAppliesToRoomLoad,
  type Plan1TaskTemplate
} from "../scenario/plan1TaskTemplateContract.js";
import type { Plan1GeneratedTaskSet, Plan1GeneratedSyntheticTask } from "../scenario/plan1ScenarioValidation.js";
import type { Plan1SimulationInput } from "./plan1SimulationInputContract.js";

export function generatePlan1SeededSyntheticTasks(input: Plan1SimulationInput): Plan1GeneratedTaskSet {
  const random = createSeededRandom(input.seed);
  const primaryAssignmentByRoomId = new Map(
    input.assignmentWorkflowState.assignments
      .filter((assignment) => assignment.assignmentType === "primary")
      .map((assignment) => [assignment.roomId, assignment])
  );
  const tasks: Plan1GeneratedSyntheticTask[] = [];
  for (const roomLoad of input.assignmentWorkflowState.roomLoads) {
    if (!roomLoad.occupied) {
      continue;
    }
    const primaryAssignment = primaryAssignmentByRoomId.get(roomLoad.roomId);
    for (const template of input.taskTemplates) {
      if (!plan1TaskTemplateAppliesToRoomLoad(template, roomLoad)) {
        continue;
      }
      if (template.requiresAssignedNurse && primaryAssignment == null) {
        continue;
      }
      const count = taskCountForTemplate(input, template);
      for (let index = 0; index < count; index += 1) {
        const startMinute = random.nextInt(0, input.durationMinutes + 1);
        const jitter =
          template.durationJitterMinutes === 0
            ? 0
            : random.nextInt(-template.durationJitterMinutes, template.durationJitterMinutes + 1);
        tasks.push({
          taskId: "pending",
          templateId: template.templateId,
          roomId: roomLoad.roomId,
          assignedNurseId: assignedNurseIdForTask(input, primaryAssignment),
          scheduledStartMinute: startMinute,
          estimatedDurationMinutes: Math.max(1, Math.round(template.baseDurationMinutes + jitter)),
          taskCategory: template.taskCategory,
          requiresWalkingRoute: template.requiresWalkingRoute,
          syntheticDataOnly: true
        });
      }
    }
  }
  const shuffled = random.shuffle(tasks).map((task, index) => ({
    ...task,
    taskId: `${input.scenarioId}-task-${String(index + 1).padStart(3, "0")}`
  }));
  return {
    taskSetId: `${input.scenarioId}-seed-${input.seed}-tasks`,
    planId: PLAN_1_ID,
    scenarioId: input.scenarioId,
    seed: input.seed,
    durationMinutes: input.durationMinutes,
    tasks: shuffled,
    syntheticDataOnly: true
  };
}

function taskCountForTemplate(input: Plan1SimulationInput, template: Plan1TaskTemplate): number {
  const base = (input.durationMinutes / 60) * template.baseFrequencyPerHour;
  const categoryMultiplier =
    template.taskCategory === "trauma_response"
      ? input.intensityProfile.traumaEventMultiplier
      : template.taskCategory === "turnover"
        ? input.intensityProfile.turnoverMultiplier
        : template.taskCategory === "interruption"
          ? input.intensityProfile.interruptionMultiplier
          : 1;
  const pressureMultiplier = ["assessment", "procedure_support", "medication_burden"].includes(template.taskCategory)
    ? input.intensityProfile.acuityPressureMultiplier
    : 1;
  const walkingMultiplier = template.requiresWalkingRoute ? input.intensityProfile.walkingFrictionMultiplier : 1;
  return Math.max(
    0,
    Math.round(
      roundPlan1Number(
        base * input.intensityProfile.taskVolumeMultiplier * categoryMultiplier * pressureMultiplier * walkingMultiplier
      )
    )
  );
}

function assignedNurseIdForTask(
  input: Plan1SimulationInput,
  primaryAssignment: Plan1ManualAssignmentRecord | undefined
): string {
  if (primaryAssignment != null) {
    return primaryAssignment.nurseId;
  }
  const fallback = input.assignmentWorkflowState.nurses[0];
  if (fallback == null) {
    throw new Error("simulation input requires at least one synthetic nurse");
  }
  return fallback.nurseId;
}
