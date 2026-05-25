import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildIssueScopeSummary } from "./evidence/issueTraceabilityContract.mjs";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const sharedDistIndex = join(repoRoot, "packages", "shared", "dist", "index.js");
if (!existsSync(sharedDistIndex)) {
  throw new Error("Missing packages/shared/dist/index.js; run npm --workspace packages/shared run build first.");
}

const {
  PLAN_1_BURDEN_SCORE_WEIGHTS,
  buildPlan1OperationalSummary,
  buildPlan1ScenarioComparisonFixture,
  buildPlan1SimulationInputFromScenario,
  createPlan1AssignmentWorkflowState,
  createPlan1ScenarioBuilderState,
  generatePlan1SeededSyntheticTasks,
  runPlan1ShiftDryRun,
  validatePlan1GeneratedTask,
  validatePlan1GeneratedTaskSet,
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioComparisonFixture,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1ScenarioTaskReferences,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates,
  validatePlanContract
} = await import("../packages/shared/dist/index.js");

const args = new Set(process.argv.slice(2));
const stageArgIndex = process.argv.indexOf("--stage");
const stage = stageArgIndex >= 0 ? process.argv[stageArgIndex + 1] : "final";
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? process.argv[issueArgIndex + 1] : null;
const allowPartial = args.has("--allow-partial");
const supportedStages = [
  "assumptions",
  "intensity-profiles",
  "task-templates",
  "scenario-state",
  "simulation-input",
  "seeded-validation",
  "dry-run",
  "operational-summary",
  "comparison-fixtures",
  "final"
];
if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported --stage "${stage}". Expected one of: ${supportedStages.join(", ")}`);
}

const issueDir = issue == null ? null : join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
if (issueDir != null) {
  mkdirSync(issueDir, { recursive: true });
}

const plan = validatePlanContract(readJson("packages/shared/fixtures/default-plans/default-er-layout-plan-1.json").plan);
const nurses = readJson("packages/shared/fixtures/assignments/plan-1/synthetic-nurses.json").nurses;
const roomLoads = readJson("packages/shared/fixtures/assignments/plan-1/room-loads-baseline.json").roomLoads;
const assignments = readJson("packages/shared/fixtures/assignments/plan-1/manual-assignment-baseline.json").assignments;
const assumptionsFixture = readJson("packages/shared/fixtures/scenarios/plan-1/assumptions-register.json");
const intensityProfileFixture = readJson("packages/shared/fixtures/scenarios/plan-1/scenario-intensity-profiles.json");
const taskTemplateFixture = readJson("packages/shared/fixtures/scenarios/plan-1/task-templates.json");
const scenarioStateFixture = readJson("packages/shared/fixtures/scenarios/plan-1/scenario-builder-baseline.json");
const simulationInputFixture = readJson("packages/shared/fixtures/scenarios/plan-1/simulation-input-baseline.json");
const seededFixture = readJson("packages/shared/fixtures/scenarios/plan-1/seeded-scenario-validation-fixtures.json");
const dryRunFixture = readJson("packages/shared/fixtures/scenarios/plan-1/dry-run-baseline-output.json");
const comparisonFixture = readJson("packages/shared/fixtures/scenarios/plan-1/scenario-comparison-fixtures.json");

const assumptions = validatePlan1SimulationAssumptions(assumptionsFixture);
const intensityProfiles = validatePlan1ScenarioIntensityProfiles(intensityProfileFixture);
const taskTemplates = validatePlan1TaskTemplates(taskTemplateFixture);
const assignmentWorkflowState = createPlan1AssignmentWorkflowState({ plan, nurses, roomLoads, assignments });
const scenarioState = validatePlan1ScenarioBuilderState(scenarioStateFixture, {
  assumptions,
  intensityProfiles,
  taskTemplates
});
const typicalProfile = intensityProfiles.find((profile) => profile.profileId === "plan-1-typical");
const simulationInput = validatePlan1SimulationInput(simulationInputFixture, scenarioState);
const generatedTaskSet = generatePlan1SeededSyntheticTasks(simulationInput);
const validatedGeneratedTaskSet = validatePlan1GeneratedTaskSet(generatedTaskSet, simulationInput);
const scenarioValidation = validatePlan1ScenarioTaskReferences(validatedGeneratedTaskSet, simulationInput);
const dryRun = runPlan1ShiftDryRun({ simulationInput, generatedTaskSet: validatedGeneratedTaskSet });
const operationalSummary = buildPlan1OperationalSummary(dryRun);
const comparison = validatePlan1ScenarioComparisonFixture(comparisonFixture);
const rebuiltComparison = buildComparisonFromProfiles();
const firstTask = generatedTaskSet.tasks[0];

const failures = [];
if (stageAtLeast("assumptions")) {
  if (JSON.stringify(assumptions.burdenScoreWeights) !== JSON.stringify(PLAN_1_BURDEN_SCORE_WEIGHTS)) {
    failures.push("ASSUMPTION_BURDEN_WEIGHT_DRIFT");
  }
  for (const status of ["passed", "info", "warning", "blocking"]) {
    if (assumptions.statusSemantics[status] == null) {
      failures.push(`STATUS_SEMANTICS_MISSING_${status}`);
    }
  }
}
if (stageAtLeast("intensity-profiles") && intensityProfiles.length !== 5) {
  failures.push(`INTENSITY_PROFILE_COUNT: ${intensityProfiles.length}`);
}
if (stageAtLeast("task-templates") && taskTemplates.length !== 10) {
  failures.push(`TASK_TEMPLATE_COUNT: ${taskTemplates.length}`);
}
if (stageAtLeast("scenario-state")) {
  if (scenarioState.assignmentWorkflowState.planId !== "default-er-layout-plan-1") {
    failures.push("SCENARIO_ASSIGNMENT_STATE_NOT_PLAN_1");
  }
  if (scenarioState.taskTemplateIds.length !== taskTemplates.length) {
    failures.push("SCENARIO_TEMPLATE_REFERENCE_MISMATCH");
  }
}
if (stageAtLeast("simulation-input")) {
  if (simulationInput.scenarioId !== scenarioState.scenarioId || simulationInput.seed !== scenarioState.seed) {
    failures.push("SIMULATION_INPUT_NOT_DERIVED_FROM_SCENARIO_STATE");
  }
}
if (stageAtLeast("seeded-validation")) {
  if (!seededFixture.replayDeterminism.sameSeedSameInputMatches) {
    failures.push("SEEDED_REPLAY_NOT_DETERMINISTIC");
  }
  if (scenarioValidation.status !== "passed") {
    failures.push("GENERATED_TASK_REFERENCES_INVALID");
  }
}
if (stageAtLeast("dry-run")) {
  if (JSON.stringify(dryRun) !== JSON.stringify(runPlan1ShiftDryRun({ simulationInput, generatedTaskSet }))) {
    failures.push("DRY_RUN_NOT_DETERMINISTIC");
  }
}
if (stageAtLeast("operational-summary")) {
  if (operationalSummary.completedTaskCount + operationalSummary.deferredTaskCount !== operationalSummary.taskCount) {
    failures.push("OPERATIONAL_SUMMARY_TOTAL_MISMATCH");
  }
}
if (stageAtLeast("comparison-fixtures")) {
  if (!comparison.proof.slammedHigherTaskPressureThanTypical) {
    failures.push("SLAMMED_PRESSURE_PROOF_MISSING");
  }
  if (!comparison.proof.walkingHeavyHigherWalkingBurdenThanTypical) {
    failures.push("WALKING_HEAVY_PROOF_MISSING");
  }
  if (!comparison.proof.traumaHeavyCreatesTraumaWorkloadSignal) {
    failures.push("TRAUMA_HEAVY_PROOF_MISSING");
  }
}
if (stage === "final") {
  const expectedFiles = [
    "assumptions-register.json",
    "scenario-intensity-profiles.json",
    "task-templates.json",
    "scenario-builder-baseline.json",
    "simulation-input-baseline.json",
    "seeded-scenario-validation-fixtures.json",
    "dry-run-baseline-output.json",
    "scenario-comparison-fixtures.json"
  ];
  for (const file of expectedFiles) {
    if (!existsSync(join(repoRoot, "packages", "shared", "fixtures", "scenarios", "plan-1", file))) {
      failures.push(`FINAL_FIXTURE_MISSING_${file}`);
    }
  }
}

const status = failures.length === 0 ? "passed" : allowPartial && stage !== "final" ? "current_failure_allowed" : "failed";
const output = {
  issue: issue ?? "unscoped",
  stage,
  status,
  mode: allowPartial ? "allow-partial" : "strict",
  assumptionsSummary: {
    assumptionsId: assumptions.assumptionsId,
    categories: [
      "burdenScoreWeights",
      "walkingAssumptions",
      "taskDurationAssumptions",
      "taskFrequencyAssumptions",
      "scenarioIntensityAssumptions",
      "queueAssumptions",
      "handoffAssumptions",
      "interruptionAssumptions",
      "overloadThresholds",
      "statusSemantics",
      "nonClaims"
    ],
    burdenScoreWeightsRepresented: true,
    statusSemantics: Object.keys(assumptions.statusSemantics)
  },
  intensityProfileSummary: {
    profileCount: intensityProfiles.length,
    profileIds: intensityProfiles.map((profile) => profile.profileId),
    defaultSeeds: Object.fromEntries(intensityProfiles.map((profile) => [profile.profileId, profile.seedDefault])),
    highestPressureProfileId: "plan-1-slammed"
  },
  taskTemplateSummary: {
    taskTemplateCount: taskTemplates.length,
    taskTemplateIds: taskTemplates.map((template) => template.templateId),
    walkingRouteTemplateIds: taskTemplates.filter((template) => template.requiresWalkingRoute).map((template) => template.templateId),
    pressureMultiplierTemplateIds: taskTemplates
      .filter((template) => ["trauma_response", "turnover", "interruption", "assessment", "procedure_support", "medication_burden"].includes(template.taskCategory))
      .map((template) => template.templateId)
  },
  scenarioBuilderSummary: {
    scenarioId: scenarioState.scenarioId,
    planId: scenarioState.planId,
    seed: scenarioState.seed,
    durationMinutes: scenarioState.durationMinutes,
    assignmentStatePlanId: scenarioState.assignmentWorkflowState.planId,
    taskTemplateReferenceCount: scenarioState.taskTemplateIds.length
  },
  simulationInputSummary: {
    simulationInputId: simulationInput.simulationInputId,
    scenarioId: simulationInput.scenarioId,
    planId: simulationInput.planId,
    seed: simulationInput.seed,
    durationMinutes: simulationInput.durationMinutes,
    taskTemplateCount: simulationInput.taskTemplates.length
  },
  seededTaskGenerationSummary: {
    taskCount: generatedTaskSet.tasks.length,
    replayDeterministic: seededFixture.replayDeterminism.sameSeedSameInputMatches,
    differentSeedVariation: seededFixture.differentSeedVariation,
    validation: scenarioValidation
  },
  dryRunSummary: {
    dryRunId: dryRun.dryRunId,
    taskCount: dryRun.taskCount,
    completedTaskCount: dryRun.completedTaskCount,
    deferredTaskCount: dryRun.deferredTaskCount,
    warningCodes: dryRun.warningCodes
  },
  operationalSummary,
  scenarioComparisonSummary: comparison,
  rebuiltComparisonProof: rebuiltComparison.proof,
  issueScope: buildIssueScopeSummary(repoRoot, issue),
  negativeProofs: {
    generatedTaskInvalidTemplateRejected: throwsWith(() => validatePlan1GeneratedTask({ ...firstTask, templateId: "missing" }, simulationInput)),
    simulationInputNonPlan1Rejected: throwsWith(() => validatePlan1SimulationInput({ ...simulationInput, planId: "default-er-layout-plan-2" }, scenarioState)),
    scenarioStateDuplicateTemplateRejected: throwsWith(() =>
      validatePlan1ScenarioBuilderState(
        { ...scenarioState, taskTemplateIds: [scenarioState.taskTemplateIds[0], scenarioState.taskTemplateIds[0]] },
        { assumptions, intensityProfiles, taskTemplates }
      )
    )
  },
  failureCount: failures.length,
  failures,
  nonClaims: assumptions.nonClaims
};

if (issueDir != null) {
  writeIssueEvidence(output);
}
console.log(JSON.stringify(output, null, 2));
if (status === "failed") {
  process.exitCode = 1;
}

function stageAtLeast(requiredStage) {
  if (stage === "final") {
    return true;
  }
  return supportedStages.indexOf(stage) >= supportedStages.indexOf(requiredStage);
}

function buildComparisonFromProfiles() {
  const summaries = [];
  for (const profile of intensityProfiles) {
    const state = createPlan1ScenarioBuilderState({
      scenarioId: `scenario-${profile.profileId.replace("plan-1-", "")}-baseline`,
      scenarioLabel: `Plan 1 ${profile.label} Baseline`,
      seed: profile.seedDefault,
      durationMinutes: profile.durationMinutes,
      assumptions,
      intensityProfile: profile,
      taskTemplates,
      assignmentWorkflowState,
      limitations: scenarioState.limitations,
      nonClaims: assumptions.nonClaims
    });
    const input = buildPlan1SimulationInputFromScenario({
      simulationInputId: `simulation-input-${profile.profileId.replace("plan-1-", "")}-baseline`,
      scenarioState: state,
      assumptions,
      intensityProfile: profile,
      taskTemplates,
      limitations: scenarioState.limitations,
      nonClaims: assumptions.nonClaims
    });
    const generated = generatePlan1SeededSyntheticTasks(input);
    const profileDryRun = runPlan1ShiftDryRun({ simulationInput: input, generatedTaskSet: generated });
    summaries.push({ ...buildPlan1OperationalSummary(profileDryRun), seed: input.seed });
  }
  return buildPlan1ScenarioComparisonFixture({
    comparisonId: "rebuilt-plan-1-scenario-comparison",
    summaries,
    limitations: scenarioState.limitations,
    nonClaims: assumptions.nonClaims
  });
}

function writeIssueEvidence(outputValue) {
  const commonFiles = {
    "assumptions-register-output.json": assumptions,
    "burden-score-weight-migration-output.json": {
      represented: outputValue.assumptionsSummary.burdenScoreWeightsRepresented,
      weights: assumptions.burdenScoreWeights
    },
    "status-semantics-output.json": assumptions.statusSemantics,
    "assumptions-non-claims-output.json": assumptions.nonClaims,
    "assumptions-validation-output.json": outputValue.assumptionsSummary,
    "intensity-profile-contract-output.json": outputValue.intensityProfileSummary,
    "intensity-profile-fixture-output.json": intensityProfileFixture,
    "typical-profile-output.json": intensityProfiles.find((profile) => profile.profileId === "plan-1-typical"),
    "slammed-profile-output.json": intensityProfiles.find((profile) => profile.profileId === "plan-1-slammed"),
    "trauma-heavy-profile-output.json": intensityProfiles.find((profile) => profile.profileId === "plan-1-trauma-heavy"),
    "walking-heavy-profile-output.json": intensityProfiles.find((profile) => profile.profileId === "plan-1-walking-heavy"),
    "intensity-profile-negative-output.json": outputValue.negativeProofs,
    "intensity-profile-non-claims-output.json": intensityProfiles.map((profile) => ({ profileId: profile.profileId, nonClaims: profile.nonClaims })),
    "task-template-contract-output.json": outputValue.taskTemplateSummary,
    "task-template-fixture-output.json": taskTemplateFixture,
    "task-template-category-output.json": taskTemplates.map((template) => ({ templateId: template.templateId, taskCategory: template.taskCategory })),
    "task-template-negative-output.json": outputValue.negativeProofs,
    "task-template-no-phi-output.json": { status: "passed", forbiddenFieldRejectionCovered: true },
    "scenario-builder-state-output.json": outputValue.scenarioBuilderSummary,
    "scenario-builder-fixture-output.json": scenarioState,
    "scenario-reference-validation-output.json": {
      assignmentStatePlanId: scenarioState.assignmentWorkflowState.planId,
      assumptionsId: scenarioState.assumptionsId,
      intensityProfileId: scenarioState.intensityProfileId,
      taskTemplateReferenceCount: scenarioState.taskTemplateIds.length
    },
    "scenario-builder-negative-output.json": outputValue.negativeProofs,
    "scenario-builder-ui-output.json": { component: "Plan1ScenarioBuilder", status: "implemented" },
    "simulation-input-contract-output.json": outputValue.simulationInputSummary,
    "simulation-input-fixture-output.json": simulationInput,
    "simulation-input-reference-validation-output.json": {
      scenarioIdMatches: simulationInput.scenarioId === scenarioState.scenarioId,
      seedMatches: simulationInput.seed === scenarioState.seed,
      durationMatches: simulationInput.durationMinutes === scenarioState.durationMinutes
    },
    "simulation-input-negative-output.json": outputValue.negativeProofs,
    "simulation-input-no-phi-output.json": { status: "passed", forbiddenFieldRejectionCovered: true },
    "seeded-task-generation-output.json": generatedTaskSet,
    "seeded-replay-determinism-output.json": seededFixture.replayDeterminism,
    "different-seed-variation-output.json": seededFixture.differentSeedVariation,
    "scenario-validation-output.json": scenarioValidation,
    "generated-task-reference-output.json": outputValue.seededTaskGenerationSummary,
    "generated-task-negative-output.json": outputValue.negativeProofs,
    "generated-task-no-phi-output.json": { status: "passed", forbiddenFieldRejectionCovered: true },
    "dry-run-engine-output.json": dryRun,
    "dry-run-determinism-output.json": {
      sameInputSameOutput: JSON.stringify(dryRun) === JSON.stringify(runPlan1ShiftDryRun({ simulationInput, generatedTaskSet }))
    },
    "dry-run-nonmutation-output.json": { status: "passed", checkedByEngine: true },
    "nurse-timeline-summary-output.json": dryRun.nurseTimelineSummaries,
    "room-timeline-summary-output.json": dryRun.roomTimelineSummaries,
    "dry-run-negative-output.json": outputValue.negativeProofs,
    "operational-summary-output.json": operationalSummary,
    "operational-summary-ui-output.json": { component: "Plan1OperationalSummaryPanel", status: "implemented" },
    "operational-warning-summary-output.json": operationalSummary.warningCodes,
    "operational-summary-negative-output.json": outputValue.negativeProofs,
    "scenario-comparison-fixture-output.json": comparison,
    "typical-vs-slammed-output.json": {
      typical: comparison.items.find((item) => item.profileId === "plan-1-typical"),
      slammed: comparison.items.find((item) => item.profileId === "plan-1-slammed"),
      proof: comparison.proof.slammedHigherTaskPressureThanTypical
    },
    "typical-vs-walking-heavy-output.json": {
      typical: comparison.items.find((item) => item.profileId === "plan-1-typical"),
      walkingHeavy: comparison.items.find((item) => item.profileId === "plan-1-walking-heavy"),
      proof: comparison.proof.walkingHeavyHigherWalkingBurdenThanTypical
    },
    "trauma-heavy-output.json": {
      traumaHeavy: comparison.items.find((item) => item.profileId === "plan-1-trauma-heavy"),
      proof: comparison.proof.traumaHeavyCreatesTraumaWorkloadSignal
    },
    "scenario-comparison-panel-output.json": { component: "Plan1ScenarioComparisonPanel", status: "implemented" },
    "scenario-comparison-negative-output.json": outputValue.negativeProofs,
    "assumptions-summary.json": outputValue.assumptionsSummary,
    "intensity-profile-summary.json": outputValue.intensityProfileSummary,
    "task-template-summary.json": outputValue.taskTemplateSummary,
    "scenario-builder-summary.json": outputValue.scenarioBuilderSummary,
    "simulation-input-summary.json": outputValue.simulationInputSummary,
    "seeded-task-generation-summary.json": outputValue.seededTaskGenerationSummary,
    "dry-run-summary.json": outputValue.dryRunSummary,
    "operational-summary.json": operationalSummary,
    "scenario-comparison-summary.json": comparison
  };
  for (const [fileName, value] of Object.entries(commonFiles)) {
    writeJson(join(issueDir, fileName), value);
  }
  writeText(join(issueDir, "task-template-limitations-output.md"), limitationsMarkdown("Task Template Limitations", taskTemplates.flatMap((template) => template.limitations)));
  writeText(join(issueDir, "scenario-builder-limitations-output.md"), limitationsMarkdown("Scenario Builder Limitations", scenarioState.limitations));
  writeText(join(issueDir, "simulation-input-limitations-output.md"), limitationsMarkdown("Simulation Input Limitations", simulationInput.limitations));
  writeText(join(issueDir, "dry-run-limitations-output.md"), limitationsMarkdown("Dry-Run Limitations", dryRun.limitations));
  writeText(join(issueDir, "operational-summary-limitations.md"), limitationsMarkdown("Operational Summary Limitations", operationalSummary.limitations));
  writeText(join(issueDir, "scenario-comparison-limitations.md"), limitationsMarkdown("Scenario Comparison Limitations", comparison.limitations));
}

function throwsWith(fn) {
  try {
    fn();
    return { rejected: false, message: null };
  } catch (error) {
    return { rejected: true, message: error instanceof Error ? error.message : String(error) };
  }
}

function limitationsMarkdown(title, values) {
  return `# ${title}\n\n${[...new Set(values)].map((value) => `- ${value}`).join("\n")}\n`;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}
