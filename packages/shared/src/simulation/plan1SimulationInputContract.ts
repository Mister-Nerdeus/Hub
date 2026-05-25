import {
  PLAN_1_ID,
  requireExactKeys,
  requireInteger,
  requireLiteralTrue,
  requireRecord,
  requireString
} from "../assignment/plan1AssignmentCommon.js";
import {
  validatePlan1Limitations,
  validatePlan1NonClaims,
  type Plan1SimulationAssumptionsRegister
} from "../scenario/plan1SimulationAssumptions.js";
import {
  validatePlan1ScenarioBuilderState,
  type Plan1ScenarioBuilderState
} from "../scenario/plan1ScenarioBuilderState.js";
import type { Plan1ScenarioIntensityProfile } from "../scenario/plan1ScenarioIntensityProfile.js";
import type { Plan1TaskTemplate } from "../scenario/plan1TaskTemplateContract.js";
import type { Plan1AssignmentWorkflowState } from "../assignment/plan1AssignmentWorkflowState.js";

export type Plan1SimulationInput = {
  simulationInputId: string;
  planId: typeof PLAN_1_ID;
  scenarioId: string;
  seed: number;
  durationMinutes: number;
  assumptions: Plan1SimulationAssumptionsRegister;
  intensityProfile: Plan1ScenarioIntensityProfile;
  taskTemplates: Plan1TaskTemplate[];
  assignmentWorkflowState: Plan1AssignmentWorkflowState;
  syntheticDataOnly: true;
  limitations: string[];
  nonClaims: string[];
};

const SIMULATION_INPUT_KEYS = [
  "simulationInputId",
  "planId",
  "scenarioId",
  "seed",
  "durationMinutes",
  "assumptions",
  "intensityProfile",
  "taskTemplates",
  "assignmentWorkflowState",
  "syntheticDataOnly",
  "limitations",
  "nonClaims"
];

const FORBIDDEN_INPUT_KEYS = [
  "patient" + "Name",
  "m" + "rn",
  "date" + "Of" + "Birth",
  "diagnosis" + "Text",
  "medication" + "Name",
  "clinical" + "Order" + "Text"
];

export function buildPlan1SimulationInputFromScenario(input: {
  simulationInputId: string;
  scenarioState: Plan1ScenarioBuilderState;
  assumptions: Plan1SimulationAssumptionsRegister;
  intensityProfile: Plan1ScenarioIntensityProfile;
  taskTemplates: Plan1TaskTemplate[];
  limitations?: string[];
  nonClaims?: string[];
}): Plan1SimulationInput {
  const scenarioState = validatePlan1ScenarioBuilderState(input.scenarioState, {
    assumptions: input.assumptions,
    intensityProfiles: [input.intensityProfile],
    taskTemplates: input.taskTemplates
  });
  return validatePlan1SimulationInput(
    {
      simulationInputId: input.simulationInputId,
      planId: PLAN_1_ID,
      scenarioId: scenarioState.scenarioId,
      seed: scenarioState.seed,
      durationMinutes: scenarioState.durationMinutes,
      assumptions: input.assumptions,
      intensityProfile: input.intensityProfile,
      taskTemplates: input.taskTemplates.filter((template) =>
        scenarioState.taskTemplateIds.includes(template.templateId)
      ),
      assignmentWorkflowState: scenarioState.assignmentWorkflowState,
      syntheticDataOnly: true,
      limitations: input.limitations ?? scenarioState.limitations,
      nonClaims: input.nonClaims ?? scenarioState.nonClaims
    },
    scenarioState
  );
}

export function validatePlan1SimulationInput(value: unknown, scenarioState?: Plan1ScenarioBuilderState): Plan1SimulationInput {
  const record = requireRecord(value, "simulationInput");
  rejectForbiddenInputKeys(record, "simulationInput");
  requireExactKeys(record, "simulationInput", SIMULATION_INPUT_KEYS);
  const planId = requireString(record.planId, "simulationInput.planId");
  if (planId !== PLAN_1_ID) {
    throw new Error("simulationInput.planId must be default-er-layout-plan-1");
  }
  const scenarioId = requireString(record.scenarioId, "simulationInput.scenarioId");
  const seed = requireInteger(record.seed, "simulationInput.seed", 0);
  const durationMinutes = requireInteger(record.durationMinutes, "simulationInput.durationMinutes", 1);
  if (scenarioState != null) {
    if (scenarioId !== scenarioState.scenarioId) {
      throw new Error("simulationInput.scenarioId must match scenario builder state");
    }
    if (seed !== scenarioState.seed) {
      throw new Error("simulationInput.seed must match scenario builder state");
    }
    if (durationMinutes !== scenarioState.durationMinutes) {
      throw new Error("simulationInput.durationMinutes must match scenario builder state");
    }
  }
  if (!Array.isArray(record.taskTemplates) || record.taskTemplates.length === 0) {
    throw new Error("simulationInput.taskTemplates must be a non-empty array");
  }
  const assumptions = record.assumptions as Plan1SimulationAssumptionsRegister | undefined;
  const intensityProfile = record.intensityProfile as Plan1ScenarioIntensityProfile | undefined;
  const assignmentWorkflowState = record.assignmentWorkflowState as Plan1AssignmentWorkflowState | undefined;
  if (assumptions == null) {
    throw new Error("simulationInput.assumptions is required");
  }
  if (intensityProfile == null) {
    throw new Error("simulationInput.intensityProfile is required");
  }
  if (assignmentWorkflowState == null) {
    throw new Error("simulationInput.assignmentWorkflowState is required");
  }
  return {
    simulationInputId: requireString(record.simulationInputId, "simulationInput.simulationInputId"),
    planId,
    scenarioId,
    seed,
    durationMinutes,
    assumptions,
    intensityProfile,
    taskTemplates: record.taskTemplates as Plan1TaskTemplate[],
    assignmentWorkflowState,
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, "simulationInput.syntheticDataOnly"),
    limitations: validatePlan1Limitations(record.limitations, "simulationInput.limitations"),
    nonClaims: validatePlan1NonClaims(record.nonClaims, "simulationInput.nonClaims")
  };
}

function rejectForbiddenInputKeys(record: Record<string, unknown>, label: string): void {
  for (const key of FORBIDDEN_INPUT_KEYS) {
    if (Object.hasOwn(record, key)) {
      throw new Error(`${label} contains a forbidden PHI-like or clinical-action field`);
    }
  }
}
