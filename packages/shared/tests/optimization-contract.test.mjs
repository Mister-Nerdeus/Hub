import assert from "node:assert/strict";
import test from "node:test";

import {
  validateOptimizationInputContract,
  validateOptimizationOutputShellContract
} from "../dist/index.js";

function validShell() {
  return {
    schemaVersion: "1.0.0",
    optimizerBoundaryId: "optimizer-boundary-basic",
    optimizationInputId: "optimization-input-basic",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-basic",
    candidates: [
      {
        candidateId: "candidate-a",
        assignmentSetId: "assignment-a",
        simulationRunId: "simulation-run-a",
        simulationScoreId: "simulation-score-a",
        limitations: ["Operational-only candidate shell."]
      }
    ],
    limitations: ["Boundary-only contract with no selected candidate or clinical claim."]
  };
}

test("valid optimizer shell contract passes", () => {
  const input = validateOptimizationInputContract({
    schemaVersion: "1.0.0",
    optimizationInputId: "optimization-input-basic",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-basic",
    assignmentSetIds: ["assignment-a"],
    assumptions: ["Shared simulation score required."],
    scoringConfig: {
      scoringEngine: "simulation_score",
      simulationScoreRequired: true
    },
    limitations: ["Boundary-only contract."]
  });
  const shell = validateOptimizationOutputShellContract(validShell());

  assert.equal(input.scoringConfig.simulationScoreRequired, true);
  assert.equal(shell.candidates[0].simulationScoreId, "simulation-score-a");
});

test("hidden score field fails", () => {
  const shell = validShell();
  shell.candidates[0].hiddenScore = 12;

  assert.throws(() => validateOptimizationOutputShellContract(shell), /hiddenScore/);
});

test("missing simulation score reference fails", () => {
  const shell = validShell();
  delete shell.candidates[0].simulationScoreId;

  assert.throws(() => validateOptimizationOutputShellContract(shell), /simulationScoreId/);
});

test("recommendation wording fails", () => {
  const shell = validShell();
  shell.limitations = ["recommended candidate"];

  assert.throws(() => validateOptimizationOutputShellContract(shell), /recommended/);
});

test("clinical safety wording fails", () => {
  const shell = validShell();
  shell.limitations = ["clinically acceptable candidate"];

  assert.throws(() => validateOptimizationOutputShellContract(shell), /clinically acceptable/);
});
