import {
  PLAN_1_ID,
  assertNoDuplicateStrings,
  requireArray,
  requireExactKeys,
  requireInteger,
  requireLiteralTrue,
  requireRecord,
  requireString,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile,
  type Plan1RoomLoad
} from "../assignment/plan1AssignmentCommon.js";
import type { Plan1AssignmentWorkflowState } from "../assignment/plan1AssignmentWorkflowState.js";
import {
  validatePlan1Limitations,
  validatePlan1NonClaims,
  type Plan1SimulationAssumptionsRegister
} from "./plan1SimulationAssumptions.js";
import type { Plan1ScenarioIntensityProfile } from "./plan1ScenarioIntensityProfile.js";
import type { Plan1TaskTemplate } from "./plan1TaskTemplateContract.js";

export type Plan1ScenarioBuilderState = {
  scenarioId: string;
  planId: typeof PLAN_1_ID;
  scenarioLabel: string;
  seed: number;
  durationMinutes: number;
  assumptionsId: string;
  intensityProfileId: string;
  taskTemplateIds: string[];
  assignmentWorkflowState: Plan1AssignmentWorkflowState;
  syntheticDataOnly: true;
  limitations: string[];
  nonClaims: string[];
};

const SCENARIO_STATE_KEYS = [
  "scenarioId",
  "planId",
  "scenarioLabel",
  "seed",
  "durationMinutes",
  "assumptionsId",
  "intensityProfileId",
  "taskTemplateIds",
  "assignmentWorkflowState",
  "syntheticDataOnly",
  "limitations",
  "nonClaims"
];

const ASSIGNMENT_WORKFLOW_KEYS = [
  "planId",
  "visualParityStatus",
  "pathSyncStatus",
  "nurses",
  "roomLoads",
  "assignments",
  "validationWarnings",
  "syntheticDataOnly"
];

export function createPlan1ScenarioBuilderState(input: {
  scenarioId: string;
  scenarioLabel: string;
  seed: number;
  durationMinutes: number;
  assumptions: Plan1SimulationAssumptionsRegister;
  intensityProfile: Plan1ScenarioIntensityProfile;
  taskTemplates: Plan1TaskTemplate[];
  assignmentWorkflowState: Plan1AssignmentWorkflowState;
  limitations: string[];
  nonClaims: string[];
}): Plan1ScenarioBuilderState {
  return validatePlan1ScenarioBuilderState(
    {
      scenarioId: input.scenarioId,
      planId: PLAN_1_ID,
      scenarioLabel: input.scenarioLabel,
      seed: input.seed,
      durationMinutes: input.durationMinutes,
      assumptionsId: input.assumptions.assumptionsId,
      intensityProfileId: input.intensityProfile.profileId,
      taskTemplateIds: input.taskTemplates.map((template) => template.templateId),
      assignmentWorkflowState: input.assignmentWorkflowState,
      syntheticDataOnly: true,
      limitations: input.limitations,
      nonClaims: input.nonClaims
    },
    {
      assumptions: input.assumptions,
      intensityProfiles: [input.intensityProfile],
      taskTemplates: input.taskTemplates
    }
  );
}

export function validatePlan1ScenarioBuilderState(
  value: unknown,
  references: {
    assumptions: Plan1SimulationAssumptionsRegister;
    intensityProfiles: Plan1ScenarioIntensityProfile[];
    taskTemplates: Plan1TaskTemplate[];
  }
): Plan1ScenarioBuilderState {
  const record = requireRecord(value, "scenarioBuilderState");
  requireExactKeys(record, "scenarioBuilderState", SCENARIO_STATE_KEYS);
  const planId = requireString(record.planId, "scenarioBuilderState.planId");
  if (planId !== PLAN_1_ID) {
    throw new Error("scenarioBuilderState.planId must be default-er-layout-plan-1");
  }
  const assumptionsId = requireString(record.assumptionsId, "scenarioBuilderState.assumptionsId");
  if (assumptionsId !== references.assumptions.assumptionsId) {
    throw new Error("scenarioBuilderState.assumptionsId must reference the assumptions register");
  }
  const intensityProfileId = requireString(record.intensityProfileId, "scenarioBuilderState.intensityProfileId");
  if (!references.intensityProfiles.some((profile) => profile.profileId === intensityProfileId)) {
    throw new Error("scenarioBuilderState.intensityProfileId must reference a known Plan 1 profile");
  }
  const taskTemplateIds = requireArray(record.taskTemplateIds, "scenarioBuilderState.taskTemplateIds").map((entry, index) =>
    requireString(entry, `scenarioBuilderState.taskTemplateIds[${index}]`)
  );
  assertNoDuplicateStrings(taskTemplateIds, "taskTemplateId");
  const knownTemplateIds = new Set<string>(references.taskTemplates.map((template) => template.templateId));
  for (const templateId of taskTemplateIds) {
    if (!knownTemplateIds.has(templateId)) {
      throw new Error("scenarioBuilderState.taskTemplateIds must reference known Plan 1 task templates");
    }
  }
  return {
    scenarioId: requireString(record.scenarioId, "scenarioBuilderState.scenarioId"),
    planId,
    scenarioLabel: requireString(record.scenarioLabel, "scenarioBuilderState.scenarioLabel"),
    seed: requireInteger(record.seed, "scenarioBuilderState.seed", 0),
    durationMinutes: requireInteger(record.durationMinutes, "scenarioBuilderState.durationMinutes", 1),
    assumptionsId,
    intensityProfileId,
    taskTemplateIds,
    assignmentWorkflowState: validateEmbeddedAssignmentWorkflowState(record.assignmentWorkflowState),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, "scenarioBuilderState.syntheticDataOnly"),
    limitations: validatePlan1Limitations(record.limitations, "scenarioBuilderState.limitations"),
    nonClaims: validatePlan1NonClaims(record.nonClaims, "scenarioBuilderState.nonClaims")
  };
}

function validateEmbeddedAssignmentWorkflowState(value: unknown): Plan1AssignmentWorkflowState {
  const record = requireRecord(value, "scenarioBuilderState.assignmentWorkflowState");
  requireExactKeys(record, "scenarioBuilderState.assignmentWorkflowState", ASSIGNMENT_WORKFLOW_KEYS);
  if (requireString(record.planId, "assignmentWorkflowState.planId") !== PLAN_1_ID) {
    throw new Error("assignmentWorkflowState.planId must be default-er-layout-plan-1");
  }
  if (requireString(record.visualParityStatus, "assignmentWorkflowState.visualParityStatus") !== "valid") {
    throw new Error("assignmentWorkflowState.visualParityStatus must be valid");
  }
  const pathSyncStatus = requireString(record.pathSyncStatus, "assignmentWorkflowState.pathSyncStatus");
  if (!["fresh", "stale_warning", "blocked"].includes(pathSyncStatus)) {
    throw new Error("assignmentWorkflowState.pathSyncStatus is not supported");
  }
  return {
    planId: PLAN_1_ID,
    visualParityStatus: "valid",
    pathSyncStatus: pathSyncStatus as Plan1AssignmentWorkflowState["pathSyncStatus"],
    nurses: requireArray(record.nurses, "assignmentWorkflowState.nurses") as Plan1NurseProfile[],
    roomLoads: requireArray(record.roomLoads, "assignmentWorkflowState.roomLoads") as Plan1RoomLoad[],
    assignments: requireArray(record.assignments, "assignmentWorkflowState.assignments") as Plan1ManualAssignmentRecord[],
    validationWarnings: requireArray(
      record.validationWarnings,
      "assignmentWorkflowState.validationWarnings"
    ) as Plan1AssignmentWorkflowState["validationWarnings"],
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, "assignmentWorkflowState.syntheticDataOnly")
  };
}
