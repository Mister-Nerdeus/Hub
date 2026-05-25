import {
  PLAN_1_ID,
  nurseIdsForProfiles,
  requireBoolean,
  requireExactKeys,
  requireInteger,
  requireLiteralTrue,
  requireRecord,
  requireString
} from "../assignment/plan1AssignmentCommon.js";
import type { Plan1SimulationInput } from "../simulation/plan1SimulationInputContract.js";
import { PLAN_1_TASK_CATEGORIES, type Plan1TaskCategory } from "./plan1TaskTemplateContract.js";

export type Plan1GeneratedSyntheticTask = {
  taskId: string;
  templateId: string;
  roomId: string;
  assignedNurseId: string;
  scheduledStartMinute: number;
  estimatedDurationMinutes: number;
  taskCategory: Plan1TaskCategory;
  requiresWalkingRoute: boolean;
  syntheticDataOnly: true;
};

export type Plan1GeneratedTaskSet = {
  taskSetId: string;
  planId: typeof PLAN_1_ID;
  scenarioId: string;
  seed: number;
  durationMinutes: number;
  tasks: Plan1GeneratedSyntheticTask[];
  syntheticDataOnly: true;
};

export type Plan1ScenarioValidationResult = {
  status: "passed" | "blocking";
  taskCount: number;
  errors: string[];
};

const GENERATED_TASK_KEYS = [
  "taskId",
  "templateId",
  "roomId",
  "assignedNurseId",
  "scheduledStartMinute",
  "estimatedDurationMinutes",
  "taskCategory",
  "requiresWalkingRoute",
  "syntheticDataOnly"
];

const FORBIDDEN_GENERATED_TASK_KEYS = [
  "patient" + "Name",
  "m" + "rn",
  "diagnosis" + "Text",
  "medication" + "Name",
  "clinical" + "Order" + "Text"
];

export function validatePlan1GeneratedTaskSet(
  value: unknown,
  simulationInput: Plan1SimulationInput
): Plan1GeneratedTaskSet {
  const record = requireRecord(value, "generatedTaskSet");
  requireExactKeys(record, "generatedTaskSet", [
    "taskSetId",
    "planId",
    "scenarioId",
    "seed",
    "durationMinutes",
    "tasks",
    "syntheticDataOnly"
  ]);
  if (requireString(record.planId, "generatedTaskSet.planId") !== PLAN_1_ID) {
    throw new Error("generatedTaskSet.planId must be default-er-layout-plan-1");
  }
  if (requireString(record.scenarioId, "generatedTaskSet.scenarioId") !== simulationInput.scenarioId) {
    throw new Error("generatedTaskSet.scenarioId must match simulation input");
  }
  const seed = requireInteger(record.seed, "generatedTaskSet.seed", 0);
  if (seed !== simulationInput.seed) {
    throw new Error("generatedTaskSet.seed must match simulation input");
  }
  const durationMinutes = requireInteger(record.durationMinutes, "generatedTaskSet.durationMinutes", 1);
  if (durationMinutes !== simulationInput.durationMinutes) {
    throw new Error("generatedTaskSet.durationMinutes must match simulation input");
  }
  if (!Array.isArray(record.tasks)) {
    throw new Error("generatedTaskSet.tasks must be an array");
  }
  return {
    taskSetId: requireString(record.taskSetId, "generatedTaskSet.taskSetId"),
    planId: PLAN_1_ID,
    scenarioId: simulationInput.scenarioId,
    seed,
    durationMinutes,
    tasks: record.tasks.map((task, index) => validatePlan1GeneratedTask(task, simulationInput, index)),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, "generatedTaskSet.syntheticDataOnly")
  };
}

export function validatePlan1GeneratedTask(
  value: unknown,
  simulationInput: Plan1SimulationInput,
  index = 0
): Plan1GeneratedSyntheticTask {
  const label = `generatedTasks[${index}]`;
  const record = requireRecord(value, label);
  rejectForbiddenGeneratedTaskKeys(record, label);
  requireExactKeys(record, label, GENERATED_TASK_KEYS);
  const templateId = requireString(record.templateId, `${label}.templateId`);
  if (!simulationInput.taskTemplates.some((template) => template.templateId === templateId)) {
    throw new Error(`${label}.templateId must reference a simulation input task template`);
  }
  const roomId = requireString(record.roomId, `${label}.roomId`);
  if (!simulationInput.assignmentWorkflowState.roomLoads.some((roomLoad) => roomLoad.roomId === roomId)) {
    throw new Error(`${label}.roomId must reference a Plan 1 room load`);
  }
  const assignedNurseId = requireString(record.assignedNurseId, `${label}.assignedNurseId`);
  if (!nurseIdsForProfiles(simulationInput.assignmentWorkflowState.nurses).has(assignedNurseId)) {
    throw new Error(`${label}.assignedNurseId must reference a synthetic Plan 1 nurse`);
  }
  const scheduledStartMinute = requireInteger(record.scheduledStartMinute, `${label}.scheduledStartMinute`, 0);
  if (scheduledStartMinute > simulationInput.durationMinutes) {
    throw new Error(`${label}.scheduledStartMinute must be within simulation duration`);
  }
  const taskCategory = requireString(record.taskCategory, `${label}.taskCategory`);
  if (!(PLAN_1_TASK_CATEGORIES as readonly string[]).includes(taskCategory)) {
    throw new Error(`${label}.taskCategory must be supported`);
  }
  return {
    taskId: requireString(record.taskId, `${label}.taskId`),
    templateId,
    roomId,
    assignedNurseId,
    scheduledStartMinute,
    estimatedDurationMinutes: requireInteger(record.estimatedDurationMinutes, `${label}.estimatedDurationMinutes`, 1),
    taskCategory: taskCategory as Plan1TaskCategory,
    requiresWalkingRoute: requireBoolean(record.requiresWalkingRoute, `${label}.requiresWalkingRoute`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validatePlan1ScenarioTaskReferences(
  taskSet: Plan1GeneratedTaskSet,
  simulationInput: Plan1SimulationInput
): Plan1ScenarioValidationResult {
  const errors: string[] = [];
  try {
    validatePlan1GeneratedTaskSet(taskSet, simulationInput);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "generated task validation failed");
  }
  return {
    status: errors.length === 0 ? "passed" : "blocking",
    taskCount: taskSet.tasks.length,
    errors
  };
}

function rejectForbiddenGeneratedTaskKeys(record: Record<string, unknown>, label: string): void {
  for (const key of FORBIDDEN_GENERATED_TASK_KEYS) {
    if (Object.hasOwn(record, key)) {
      throw new Error(`${label} contains a forbidden PHI-like or clinical-action field`);
    }
  }
}
