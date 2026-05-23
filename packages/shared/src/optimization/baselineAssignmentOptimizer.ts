import type {
  GeneratedOperationalTask,
  GeneratedOperationalTaskSetContract,
  NurseTaskAssignment,
  NurseTaskAssignmentContract,
  ShiftScenarioContract
} from "../contracts.js";
import { validateNurseTaskAssignmentContract } from "../contracts.js";
import type { AssignmentVariantRunContract } from "../simulation/assignmentVariantRunContract.js";
import { runAssignmentVariants } from "../simulation/assignmentVariantRunner.js";
import { constrainOptimizerCandidateAssignments } from "./optimizerConstraintAdapter.js";

export type BaselineOptimizerCandidate = {
  candidateId: string;
  label: string;
  assignmentSetId: string;
  simulationRunId: string;
  simulationScoreId: string;
  operationalBurdenScore: number;
};

export type BaselineAssignmentOptimizerOutput = {
  schemaVersion: "1.0.0";
  optimizerRunId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  executionPath: "assignment_variant_runner";
  candidates: BaselineOptimizerCandidate[];
  lowestOperationalBurdenCandidateId: string;
  tieBreakers: string[];
  variantRun: AssignmentVariantRunContract;
  limitations: string[];
};

export type BuildBaselineAssignmentOptimizerInput = {
  optimizerRunId: string;
  scenario: ShiftScenarioContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
  baseNurseTaskAssignmentSet: NurseTaskAssignmentContract;
  shiftDurationMinutes?: number;
};

export const BASELINE_ASSIGNMENT_OPTIMIZER_LIMITATIONS = [
  "Operational-only deterministic candidate generator.",
  "Candidates are evaluated through the shared assignment variant runner and simulation score path.",
  "No clinical claim, machine learning, API, persistence, or separate scoring engine is applied."
];

export function buildBaselineAssignmentOptimizer(
  input: BuildBaselineAssignmentOptimizerInput
): BaselineAssignmentOptimizerOutput {
  const original = validateNurseTaskAssignmentContract(
    input.baseNurseTaskAssignmentSet,
    input.scenario,
    undefined,
    input.generatedTaskSet
  );
  const nurseIds = sortedNurseIds(original);
  if (nurseIds.length === 0) {
    throw new Error("baseNurseTaskAssignmentSet requires at least one assigned nurse");
  }
  const generatedTaskIds = input.generatedTaskSet.generatedTasks.map((task) => task.id);
  const constrainCandidate = (
    candidateAssignments: NurseTaskAssignment[],
    assignedCandidateReason: NurseTaskAssignment["assignmentReason"] | "preserve"
  ) =>
    constrainOptimizerCandidateAssignments({
      generatedTaskIds,
      allowedNurseIds: nurseIds,
      baseAssignments: original.taskAssignments,
      candidateAssignments,
      assignedCandidateReason
    }).taskAssignments;
  const variants = [
    {
      variantId: "candidate-original",
      label: "Original manual assignment",
      nurseTaskAssignmentSet: cloneAssignmentSet(
        original,
        "candidate-original",
        constrainCandidate(original.taskAssignments, "preserve"),
        input.scenario,
        input.generatedTaskSet
      )
    },
    {
      variantId: "candidate-room-count-balanced",
      label: "Room-count balanced assignment",
      nurseTaskAssignmentSet: cloneAssignmentSet(
        original,
        "candidate-room-count-balanced",
        constrainCandidate(
          distributeByRoomCount(input.generatedTaskSet.generatedTasks, nurseIds),
          "optimizer_candidate"
        ),
        input.scenario,
        input.generatedTaskSet
      )
    },
    {
      variantId: "candidate-task-minute-balanced",
      label: "Task-minute balanced assignment",
      nurseTaskAssignmentSet: cloneAssignmentSet(
        original,
        "candidate-task-minute-balanced",
        constrainCandidate(
          distributeByTaskMinutes(input.generatedTaskSet.generatedTasks, nurseIds),
          "optimizer_candidate"
        ),
        input.scenario,
        input.generatedTaskSet
      )
    }
  ];
  const variantRun = runAssignmentVariants({
    variantRunId: `${input.optimizerRunId}-variant-run`,
    scenario: input.scenario,
    generatedTaskSet: input.generatedTaskSet,
    variants,
    shiftDurationMinutes: input.shiftDurationMinutes
  });
  const candidates = variantRun.variants.map((variant) => ({
    candidateId: variant.variantId,
    label: variant.label,
    assignmentSetId: variant.assignmentSetId,
    simulationRunId: variant.simulationRun.simulationRunId,
    simulationScoreId: variant.simulationScore.simulationScoreId,
    operationalBurdenScore: variant.simulationScore.metrics.operationalBurdenScore
  }));
  const selectedCandidate = [...candidates].sort(compareCandidateResults)[0];
  if (selectedCandidate == null) {
    throw new Error("optimizer candidates require at least one entry");
  }
  const lowestOperationalBurdenCandidateId = selectedCandidate.candidateId;

  return {
    schemaVersion: "1.0.0",
    optimizerRunId: input.optimizerRunId,
    scenarioId: input.scenario.scenarioId,
    generatedTaskSetId: input.generatedTaskSet.generatedTaskSetId,
    executionPath: "assignment_variant_runner",
    candidates,
    lowestOperationalBurdenCandidateId,
    tieBreakers: ["operationalBurdenScore ascending", "candidateId ascending"],
    variantRun,
    limitations: [...BASELINE_ASSIGNMENT_OPTIMIZER_LIMITATIONS]
  };
}

function sortedNurseIds(assignmentSet: NurseTaskAssignmentContract): string[] {
  return [
    ...new Set(
      assignmentSet.taskAssignments
        .map((assignment) => assignment.nurseId)
        .filter((nurseId): nurseId is string => nurseId != null)
    )
  ].sort();
}

function cloneAssignmentSet(
  original: NurseTaskAssignmentContract,
  variantId: string,
  taskAssignments: NurseTaskAssignment[],
  scenario: ShiftScenarioContract,
  generatedTaskSet: GeneratedOperationalTaskSetContract
): NurseTaskAssignmentContract {
  return validateNurseTaskAssignmentContract(
    {
      ...original,
      nurseTaskAssignmentSetId: `${original.nurseTaskAssignmentSetId}-${variantId}`,
      assignmentSetId: `${original.assignmentSetId}-${variantId}`,
      name: `${original.name} ${variantId}`,
      taskAssignments: taskAssignments.map((assignment) => ({
        ...assignment,
        id: `${variantId}-${assignment.taskId}`
      }))
    },
    scenario,
    undefined,
    generatedTaskSet
  );
}

function distributeByRoomCount(
  tasks: GeneratedOperationalTask[],
  nurseIds: string[]
): NurseTaskAssignment[] {
  const roomsByNurse = new Map(nurseIds.map((nurseId) => [nurseId, new Set<string>()]));
  return [...tasks].sort(compareTasks).map((task) => {
    const nurseId = firstNurseId([...nurseIds].sort((left, right) => {
      const countDelta =
        (roomsByNurse.get(left)?.size ?? 0) - (roomsByNurse.get(right)?.size ?? 0);
      if (countDelta !== 0) {
        return countDelta;
      }
      return left.localeCompare(right);
    }));
    roomsByNurse.get(nurseId)?.add(task.roomId);
    return taskAssignment(task, nurseId);
  });
}

function distributeByTaskMinutes(
  tasks: GeneratedOperationalTask[],
  nurseIds: string[]
): NurseTaskAssignment[] {
  const minutesByNurse = new Map(nurseIds.map((nurseId) => [nurseId, 0]));
  return [...tasks].sort(compareTasks).map((task) => {
    const nurseId = firstNurseId([...nurseIds].sort((left, right) => {
      const minuteDelta = (minutesByNurse.get(left) ?? 0) - (minutesByNurse.get(right) ?? 0);
      if (minuteDelta !== 0) {
        return minuteDelta;
      }
      return left.localeCompare(right);
    }));
    minutesByNurse.set(nurseId, (minutesByNurse.get(nurseId) ?? 0) + task.estimatedDurationMinutes);
    return taskAssignment(task, nurseId);
  });
}

function firstNurseId(nurseIds: string[]): string {
  const nurseId = nurseIds[0];
  if (nurseId == null) {
    throw new Error("nurse IDs require at least one entry");
  }
  return nurseId;
}

function taskAssignment(task: GeneratedOperationalTask, nurseId: string): NurseTaskAssignment {
  return {
    id: `candidate-task-${task.id}`,
    taskId: task.id,
    nurseId,
    assignmentReason: "optimizer_candidate",
    minute: task.scheduledMinute
  };
}

function compareTasks(left: GeneratedOperationalTask, right: GeneratedOperationalTask): number {
  const minuteDelta = left.scheduledMinute - right.scheduledMinute;
  if (minuteDelta !== 0) {
    return minuteDelta;
  }
  return left.id.localeCompare(right.id);
}

function compareCandidateResults(
  left: BaselineOptimizerCandidate,
  right: BaselineOptimizerCandidate
): number {
  const burdenDelta = left.operationalBurdenScore - right.operationalBurdenScore;
  if (burdenDelta !== 0) {
    return burdenDelta;
  }
  return left.candidateId.localeCompare(right.candidateId);
}
