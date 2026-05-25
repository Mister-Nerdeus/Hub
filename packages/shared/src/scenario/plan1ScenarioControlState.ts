import { PLAN_1_ID } from "../assignment/plan1AssignmentCommon.js";
import {
  buildPlan1SimulationInputFromScenario,
  type Plan1SimulationInput
} from "../simulation/plan1SimulationInputContract.js";
import {
  createPlan1ScenarioBuilderState,
  type Plan1ScenarioBuilderState
} from "./plan1ScenarioBuilderState.js";
import type { Plan1ScenarioIntensityProfile } from "./plan1ScenarioIntensityProfile.js";
import type { Plan1SimulationAssumptionsRegister } from "./plan1SimulationAssumptions.js";
import type { Plan1TaskTemplate } from "./plan1TaskTemplateContract.js";
import type { Plan1AssignmentWorkflowState } from "../assignment/plan1AssignmentWorkflowState.js";

export type Plan1ScenarioControlState = {
  planId: typeof PLAN_1_ID;
  selectedProfileId: string;
  seed: number;
  durationMinutes: number;
  selectedTaskTemplateIds: string[];
  validationStatus: "valid" | "invalid";
  validationMessages: string[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export type Plan1ScenarioControlReferences = {
  assumptions: Plan1SimulationAssumptionsRegister;
  intensityProfiles: Plan1ScenarioIntensityProfile[];
  taskTemplates: Plan1TaskTemplate[];
  assignmentWorkflowState: Plan1AssignmentWorkflowState;
  baselineScenarioLabel?: string;
};

export function createPlan1BaselineScenarioControlState(input: {
  profileId: string;
  seed: number;
  durationMinutes: number;
  taskTemplates: Plan1TaskTemplate[];
  limitations: string[];
  nonClaims: string[];
}): Plan1ScenarioControlState {
  return validatePlan1ScenarioControlState({
    planId: PLAN_1_ID,
    selectedProfileId: input.profileId,
    seed: input.seed,
    durationMinutes: input.durationMinutes,
    selectedTaskTemplateIds: input.taskTemplates.map((template) => template.templateId),
    validationStatus: "valid",
    validationMessages: [],
    limitations: input.limitations,
    nonClaims: input.nonClaims,
    syntheticDataOnly: true
  }, {
    profiles: [input.profileId],
    taskTemplateIds: input.taskTemplates.map((template) => template.templateId)
  });
}

export function validatePlan1ScenarioControlState(
  value: unknown,
  references: { profiles: string[]; taskTemplateIds: string[] }
): Plan1ScenarioControlState {
  const state = value as Plan1ScenarioControlState;
  const validationMessages: string[] = [];
  if (state?.planId !== PLAN_1_ID) {
    validationMessages.push("Plan 1 scenario controls only support default-er-layout-plan-1.");
  }
  if (!references.profiles.includes(state?.selectedProfileId)) {
    validationMessages.push("Unknown Plan 1 scenario profile.");
  }
  if (!Number.isInteger(state?.seed)) {
    validationMessages.push("Seed must be an integer.");
  }
  if (!Number.isInteger(state?.durationMinutes) || state.durationMinutes <= 0) {
    validationMessages.push("Duration must be a positive integer minute count.");
  }
  const selectedTemplateIds = Array.isArray(state?.selectedTaskTemplateIds) ? state.selectedTaskTemplateIds : [];
  const seen = new Set<string>();
  for (const templateId of selectedTemplateIds) {
    if (!references.taskTemplateIds.includes(templateId)) {
      validationMessages.push("Unknown Plan 1 task template.");
    }
    if (seen.has(templateId)) {
      validationMessages.push("Duplicate Plan 1 task template.");
    }
    seen.add(templateId);
  }
  if (selectedTemplateIds.length === 0) {
    validationMessages.push("At least one Plan 1 task template must be selected.");
  }
  return {
    planId: PLAN_1_ID,
    selectedProfileId: String(state?.selectedProfileId ?? ""),
    seed: Number(state?.seed),
    durationMinutes: Number(state?.durationMinutes),
    selectedTaskTemplateIds: selectedTemplateIds,
    validationStatus: validationMessages.length === 0 ? "valid" : "invalid",
    validationMessages,
    limitations: Array.isArray(state?.limitations) ? [...state.limitations] : [],
    nonClaims: Array.isArray(state?.nonClaims) ? [...state.nonClaims] : [],
    syntheticDataOnly: true
  };
}

export function buildPlan1ScenarioFromControls(input: {
  controlState: Plan1ScenarioControlState;
  references: Plan1ScenarioControlReferences;
}): { scenarioState: Plan1ScenarioBuilderState; simulationInput: Plan1SimulationInput } {
  const profileIds = input.references.intensityProfiles.map((profile) => profile.profileId);
  const templateIds = input.references.taskTemplates.map((template) => template.templateId);
  const controls = validatePlan1ScenarioControlState(input.controlState, {
    profiles: profileIds,
    taskTemplateIds: templateIds
  });
  if (controls.validationStatus !== "valid") {
    throw new Error(`Plan 1 scenario controls are invalid: ${controls.validationMessages.join(" ")}`);
  }
  const intensityProfile = input.references.intensityProfiles.find(
    (profile) => profile.profileId === controls.selectedProfileId
  );
  if (intensityProfile == null) {
    throw new Error("Plan 1 scenario controls selected profile is unavailable");
  }
  const selectedTemplates = input.references.taskTemplates.filter((template) =>
    controls.selectedTaskTemplateIds.includes(template.templateId)
  );
  const profileSuffix = controls.selectedProfileId.replace("plan-1-", "");
  const scenarioState = createPlan1ScenarioBuilderState({
    scenarioId: `scenario-${profileSuffix}-controls`,
    scenarioLabel: input.references.baselineScenarioLabel ?? `Plan 1 ${intensityProfile.label} Controls`,
    seed: controls.seed,
    durationMinutes: controls.durationMinutes,
    assumptions: input.references.assumptions,
    intensityProfile,
    taskTemplates: selectedTemplates,
    assignmentWorkflowState: input.references.assignmentWorkflowState,
    limitations: controls.limitations,
    nonClaims: controls.nonClaims
  });
  return {
    scenarioState,
    simulationInput: buildPlan1SimulationInputFromScenario({
      simulationInputId: `simulation-input-${profileSuffix}-controls`,
      scenarioState,
      assumptions: input.references.assumptions,
      intensityProfile,
      taskTemplates: selectedTemplates,
      limitations: controls.limitations,
      nonClaims: controls.nonClaims
    })
  };
}
