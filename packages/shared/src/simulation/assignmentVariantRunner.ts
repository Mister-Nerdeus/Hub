import type {
  GeneratedOperationalTaskSetContract,
  ManualAssignmentContract,
  NurseTaskAssignmentContract,
  ShiftScenarioContract
} from "../contracts.js";
import { buildSimulationRun, type SimulationTravelOption } from "./simulationExecution.js";
import { buildSimulationScore } from "./simulationScoring.js";
import {
  type AssignmentVariantRunContract,
  validateAssignmentVariantRunContract
} from "./assignmentVariantRunContract.js";

export type AssignmentVariantInput = {
  variantId: string;
  label: string;
  nurseTaskAssignmentSet: NurseTaskAssignmentContract;
};

export type RunAssignmentVariantsInput = {
  variantRunId: string;
  scenario: ShiftScenarioContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
  manualAssignmentSet?: ManualAssignmentContract;
  variants: AssignmentVariantInput[];
  shiftDurationMinutes?: number;
  travel?: SimulationTravelOption;
};

export const ASSIGNMENT_VARIANT_RUN_LIMITATIONS = [
  "Operational-only runner for manual assignment variants.",
  "Each variant uses the same simulation execution and scoring path.",
  "No optimizer or clinical claim is applied by the runner."
];

export function runAssignmentVariants(
  input: RunAssignmentVariantsInput
): AssignmentVariantRunContract {
  if (input.variants.length === 0) {
    throw new Error("variants requires at least one entry");
  }
  const variantIds = input.variants.map((variant) => variant.variantId);
  if (new Set(variantIds).size !== variantIds.length) {
    throw new Error("duplicate variant IDs are not allowed");
  }
  const variants = [...input.variants]
    .sort((left, right) => left.variantId.localeCompare(right.variantId))
    .map((variant) => {
      const simulationRun = buildSimulationRun({
        simulationRunId: `${input.variantRunId}-${variant.variantId}`,
        scenario: input.scenario,
        generatedTaskSet: input.generatedTaskSet,
        nurseTaskAssignmentSet: variant.nurseTaskAssignmentSet,
        manualAssignmentSet: input.manualAssignmentSet,
        shiftDurationMinutes: input.shiftDurationMinutes,
        seed: input.scenario.seed,
        travel: input.travel
      });
      const simulationScore = buildSimulationScore(simulationRun);
      return {
        variantId: variant.variantId,
        label: variant.label,
        assignmentSetId: variant.nurseTaskAssignmentSet.assignmentSetId,
        simulationRun,
        simulationScore
      };
    });

  return validateAssignmentVariantRunContract({
    schemaVersion: "1.0.0",
    variantRunId: input.variantRunId,
    scenarioId: input.scenario.scenarioId,
    generatedTaskSetId: input.generatedTaskSet.generatedTaskSetId,
    variants,
    limitations: [...ASSIGNMENT_VARIANT_RUN_LIMITATIONS]
  });
}
