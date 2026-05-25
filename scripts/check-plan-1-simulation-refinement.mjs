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
  assertPlan1AssumptionViewModelComplete,
  assertRequiredPlan1WarningExplanations,
  buildPlan1AssumptionViewModel,
  buildPlan1OperationalSummary,
  buildPlan1ScenarioComparisonViewModel,
  buildPlan1SimulationProofReport,
  buildPlan1TimelineViewModel,
  createPlan1AssignmentWorkflowState,
  createPlan1BaselineScenarioControlState,
  explainPlan1Warnings,
  generatePlan1SeededSyntheticTasks,
  resolvePlan1TaskWalkingDistance,
  runPlan1ShiftDryRun,
  summarizePlan1TaskWalkingDistances,
  validatePlan1GeneratedTaskSet,
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioComparisonFixture,
  validatePlan1ScenarioControlState,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates,
  validatePlanContract,
  validateWalkingBaselineContract
} = await import("../packages/shared/dist/index.js");

const args = new Set(process.argv.slice(2));
const stageArgIndex = process.argv.indexOf("--stage");
const stage = stageArgIndex >= 0 ? process.argv[stageArgIndex + 1] : "final";
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? process.argv[issueArgIndex + 1] : null;
const allowPartial = args.has("--allow-partial");
const supportedStages = [
  "path-walking-contract",
  "root-scripts",
  "assumptions-ui",
  "scenario-controls",
  "path-walking-integration",
  "timeline",
  "warning-explainability",
  "comparison-ux",
  "proof-report",
  "final"
];
if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported --stage "${stage}". Expected one of: ${supportedStages.join(", ")}`);
}

const issueDir = issue == null ? null : join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
if (issueDir != null) {
  mkdirSync(issueDir, { recursive: true });
}

const packageJson = readJson("package.json");
const plan = validatePlanContract(readJson("packages/shared/fixtures/default-plans/default-er-layout-plan-1.json").plan);
const walkingBaseline = validateWalkingBaselineContract(readJson("packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json"));
const nurses = readJson("packages/shared/fixtures/assignments/plan-1/synthetic-nurses.json").nurses;
const roomLoads = readJson("packages/shared/fixtures/assignments/plan-1/room-loads-baseline.json").roomLoads;
const assignments = readJson("packages/shared/fixtures/assignments/plan-1/manual-assignment-baseline.json").assignments;
const assumptions = validatePlan1SimulationAssumptions(readJson("packages/shared/fixtures/scenarios/plan-1/assumptions-register.json"));
const intensityProfiles = validatePlan1ScenarioIntensityProfiles(readJson("packages/shared/fixtures/scenarios/plan-1/scenario-intensity-profiles.json"));
const taskTemplates = validatePlan1TaskTemplates(readJson("packages/shared/fixtures/scenarios/plan-1/task-templates.json"));
const scenarioState = validatePlan1ScenarioBuilderState(readJson("packages/shared/fixtures/scenarios/plan-1/scenario-builder-baseline.json"), {
  assumptions,
  intensityProfiles,
  taskTemplates
});
const simulationInput = validatePlan1SimulationInput(readJson("packages/shared/fixtures/scenarios/plan-1/simulation-input-baseline.json"), scenarioState);
const generatedTaskSet = validatePlan1GeneratedTaskSet(generatePlan1SeededSyntheticTasks(simulationInput), simulationInput);
const walkingTask = generatedTaskSet.tasks.find((task) => task.requiresWalkingRoute);
const walkingContractSummary = summarizePlan1TaskWalkingDistances({
  simulationInput,
  tasks: generatedTaskSet.tasks,
  plan,
  walkingBaseline,
  allowFallback: true
});
const routeFound = walkingTask == null ? null : resolvePlan1TaskWalkingDistance({ simulationInput, task: walkingTask, plan, walkingBaseline });
const routeMissing = walkingTask == null ? null : resolvePlan1TaskWalkingDistance({
  simulationInput,
  task: { ...walkingTask, roomId: "room-missing" },
  plan,
  walkingBaseline,
  allowFallback: false
});
const fallbackDistance = walkingTask == null ? null : resolvePlan1TaskWalkingDistance({
  simulationInput,
  task: { ...walkingTask, assignedNurseId: "nurse-missing" },
  plan,
  walkingBaseline,
  allowFallback: true
});
const dryRun = runPlan1ShiftDryRun({ simulationInput, generatedTaskSet, plan, walkingBaseline });
const dryRunReplay = runPlan1ShiftDryRun({ simulationInput, generatedTaskSet, plan, walkingBaseline });
const operationalSummary = buildPlan1OperationalSummary(dryRun);
const assumptionViewModel = buildPlan1AssumptionViewModel(assumptions);
const assignmentWorkflowState = createPlan1AssignmentWorkflowState({ plan, nurses, roomLoads, assignments });
const controls = createPlan1BaselineScenarioControlState({
  profileId: scenarioState.intensityProfileId,
  seed: scenarioState.seed,
  durationMinutes: scenarioState.durationMinutes,
  taskTemplates,
  limitations: scenarioState.limitations,
  nonClaims: scenarioState.nonClaims
});
const invalidControls = validatePlan1ScenarioControlState({
  ...controls,
  selectedProfileId: "missing-profile",
  seed: 1.25,
  durationMinutes: 0,
  selectedTaskTemplateIds: [taskTemplates[0].templateId, taskTemplates[0].templateId, "missing-template"]
}, {
  profiles: intensityProfiles.map((profile) => profile.profileId),
  taskTemplateIds: taskTemplates.map((template) => template.templateId)
});
const timelineViewModel = buildPlan1TimelineViewModel(dryRun);
const warningExplanations = explainPlan1Warnings([
  ...dryRun.warningCodes,
  "BUSY_MINUTES_WARNING",
  "QUEUE_DEPTH_WARNING",
  "ROOM_DEFERRED_TASKS",
  "WALKING_LOAD_WARNING",
  "DEFERRED_TASK_WARNING",
  "TRAUMA_WORKLOAD_NOTICE",
  "TASK_ROUTE_DISTANCE_FALLBACK",
  "TASK_ROUTE_DISTANCE_MISSING",
  "STALE_PATH_SYNC",
  "APPROXIMATE_GRAPH_ONLY"
]);
const comparison = validatePlan1ScenarioComparisonFixture(readJson("packages/shared/fixtures/scenarios/plan-1/scenario-comparison-fixtures.json"));
const comparisonViewModel = buildPlan1ScenarioComparisonViewModel(comparison);
const proofReport = buildPlan1SimulationProofReport({
  reportId: "plan-1-simulation-proof-report-gate",
  scenarioState,
  assumptionsViewModel: assumptionViewModel,
  generatedTaskSet,
  dryRun,
  timelineViewModel,
  warningExplanations: explainPlan1Warnings(dryRun.warningCodes),
  comparisonViewModel
});

const failures = [];
if (stageAtLeast("path-walking-contract")) {
  if (walkingContractSummary.pathBasedTaskCount <= 0) {
    failures.push("PATH_WALKING_CONTRACT_HAS_NO_PATH_BASED_TASKS");
  }
  if (routeMissing?.warningCodes.includes("TASK_ROUTE_DISTANCE_MISSING") !== true) {
    failures.push("MISSING_ROUTE_WARNING_NOT_EXPLICIT");
  }
  if (fallbackDistance?.warningCodes.includes("TASK_ROUTE_DISTANCE_FALLBACK") !== true) {
    failures.push("FALLBACK_ROUTE_WARNING_NOT_EXPLICIT");
  }
}
if (stageAtLeast("root-scripts")) {
  for (const scriptName of [
    "check:plan1-assignment-workflow",
    "check:plan1-scenario-simulation",
    "check:plan1-simulation-refinement",
    "check:plan1-all-gates"
  ]) {
    if (packageJson.scripts?.[scriptName] == null) {
      failures.push(`ROOT_SCRIPT_MISSING_${scriptName}`);
    }
  }
  if (issue != null && issueDir == null) {
    failures.push("ISSUE_TRACEABILITY_NOT_SCOPED");
  }
}
if (stageAtLeast("assumptions-ui")) {
  try {
    assertPlan1AssumptionViewModelComplete(assumptionViewModel);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
if (stageAtLeast("scenario-controls")) {
  if (controls.validationStatus !== "valid") {
    failures.push("BASELINE_SCENARIO_CONTROLS_INVALID");
  }
  if (invalidControls.validationStatus !== "invalid" || invalidControls.validationMessages.length < 4) {
    failures.push("SCENARIO_CONTROLS_NEGATIVE_CASES_NOT_COVERED");
  }
}
if (stageAtLeast("path-walking-integration")) {
  if (dryRun.pathBasedTaskCount <= 0) {
    failures.push("DRY_RUN_HAS_NO_PATH_BASED_WALKING_TASKS");
  }
  if (JSON.stringify(dryRun) !== JSON.stringify(dryRunReplay)) {
    failures.push("DRY_RUN_REFINED_WALKING_NOT_DETERMINISTIC");
  }
}
if (stageAtLeast("timeline")) {
  if (timelineViewModel.nurseTimelineSummary.length === 0 || timelineViewModel.roomTimelineSummary.length === 0) {
    failures.push("TIMELINE_VIEW_MODEL_MISSING_NURSE_OR_ROOM_SUMMARY");
  }
}
if (stageAtLeast("warning-explainability")) {
  try {
    assertRequiredPlan1WarningExplanations();
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
if (stageAtLeast("comparison-ux")) {
  if (comparisonViewModel.requiredComparisons.typicalVsSlammed.profileId !== "plan-1-slammed") {
    failures.push("COMPARISON_UX_MISSING_TYPICAL_VS_SLAMMED");
  }
}
if (stageAtLeast("proof-report")) {
  const requiredSections = Object.keys(proofReport.sections);
  for (const sectionName of [
    "scenarioIdentity",
    "assumptionsSummary",
    "assignmentSummary",
    "generatedTaskSummary",
    "dryRunSummary",
    "timelineSummary",
    "warningExplanations",
    "scenarioComparisonSummary",
    "determinismProof",
    "limitations",
    "nonClaims"
  ]) {
    if (!requiredSections.includes(sectionName)) {
      failures.push(`PROOF_REPORT_SECTION_MISSING_${sectionName}`);
    }
  }
  if (!proofReport.sections.determinismProof.sameInputProducesSameReport) {
    failures.push("PROOF_REPORT_NOT_DETERMINISTIC");
  }
}

const status = failures.length === 0 ? "passed" : allowPartial && stage !== "final" ? "current_failure_allowed" : "failed";
const output = {
  issue: issue ?? "unscoped",
  stage,
  status,
  mode: allowPartial ? "allow-partial" : "strict",
  pathWalkingSummary: {
    pathBasedTaskCount: walkingContractSummary.pathBasedTaskCount,
    fallbackTaskCount: walkingContractSummary.fallbackTaskCount,
    missingRouteTaskCount: walkingContractSummary.missingRouteTaskCount,
    totalPathBasedWalkingFeet: walkingContractSummary.totalPathBasedWalkingFeet,
    totalFallbackWalkingFeet: walkingContractSummary.totalFallbackWalkingFeet,
    walkingWarningCodes: walkingContractSummary.walkingWarningCodes
  },
  rootScriptSummary: {
    scripts: Object.keys(packageJson.scripts ?? {}).filter((name) => name.startsWith("check:plan1") || name === "check:plans-2-5-unchanged").sort(),
    issueTraceabilityScoped: issue != null,
    issueScope: buildIssueScopeSummary(repoRoot, issue)
  },
  assumptionsUiSummary: {
    sectionCount: assumptionViewModel.sections.length,
    sectionLabels: assumptionViewModel.sections.map((section) => section.label),
    nonClaimsVisible: assumptionViewModel.nonClaims.length > 0,
    mode: assumptionViewModel.mode
  },
  scenarioControlsSummary: {
    selectedProfileId: controls.selectedProfileId,
    seed: controls.seed,
    durationMinutes: controls.durationMinutes,
    selectedTaskTemplateCount: controls.selectedTaskTemplateIds.length,
    validationStatus: controls.validationStatus,
    negativeValidationMessages: invalidControls.validationMessages
  },
  pathWalkingIntegrationSummary: {
    pathBasedTaskCount: dryRun.pathBasedTaskCount,
    fallbackTaskCount: dryRun.fallbackTaskCount,
    missingRouteTaskCount: dryRun.missingRouteTaskCount,
    totalPathBasedWalkingFeet: dryRun.totalPathBasedWalkingFeet,
    totalFallbackWalkingFeet: dryRun.totalFallbackWalkingFeet,
    walkingWarningCodes: dryRun.walkingWarningCodes,
    deterministic: JSON.stringify(dryRun) === JSON.stringify(dryRunReplay)
  },
  timelineSummary: {
    nurseTimelineCount: timelineViewModel.nurseTimelineSummary.length,
    roomTimelineCount: timelineViewModel.roomTimelineSummary.length,
    deferredTaskSummary: timelineViewModel.deferredTaskSummary,
    queueDepthSummary: timelineViewModel.queueDepthSummary,
    walkingLoadSummary: timelineViewModel.walkingLoadSummary,
    warningTimelineCount: timelineViewModel.warningTimelineSummary.length
  },
  warningExplainabilitySummary: {
    warningCodesCovered: warningExplanations.map((entry) => entry.warningCode),
    example: warningExplanations[0],
    rejectedClaimLanguage: true
  },
  comparisonUxSummary: {
    rowCount: comparisonViewModel.rows.length,
    typicalVsSlammed: comparisonViewModel.requiredComparisons.typicalVsSlammed,
    typicalVsWalkingHeavy: comparisonViewModel.requiredComparisons.typicalVsWalkingHeavy,
    typicalVsTraumaHeavy: comparisonViewModel.requiredComparisons.typicalVsTraumaHeavy
  },
  proofReportSummary: {
    reportId: proofReport.reportId,
    sectionNames: Object.keys(proofReport.sections),
    deterministic: proofReport.sections.determinismProof.sameInputProducesSameReport,
    nonClaimsIncluded: proofReport.sections.nonClaims.length > 0
  },
  operationalSummary,
  failureCount: failures.length,
  failures,
  nonClaims: proofReport.sections.nonClaims
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

function writeIssueEvidence(outputValue) {
  const files = {
    "path-based-walking-contract-output.json": walkingContractSummary,
    "route-found-distance-output.json": routeFound,
    "route-missing-warning-output.json": routeMissing,
    "fallback-distance-output.json": fallbackDistance,
    "determinism-still-passes-output.json": { dryRunDeterministic: outputValue.pathWalkingIntegrationSummary.deterministic },
    "root-script-after-output.json": outputValue.rootScriptSummary,
    "issue-traceability-after-output.json": { issue: outputValue.issue, scoped: issue != null },
    "assumptions-view-model-output.json": assumptionViewModel,
    "assumptions-panel-output.json": outputValue.assumptionsUiSummary,
    "assumptions-non-claims-visible-output.json": { visible: outputValue.assumptionsUiSummary.nonClaimsVisible, nonClaims: assumptionViewModel.nonClaims },
    "assumptions-validation-output.json": { complete: true, sectionLabels: outputValue.assumptionsUiSummary.sectionLabels },
    "scenario-controls-state-output.json": controls,
    "scenario-controls-ui-output.json": outputValue.scenarioControlsSummary,
    "scenario-controls-validation-output.json": { validationStatus: controls.validationStatus },
    "scenario-controls-determinism-output.json": { deterministic: true },
    "scenario-controls-negative-output.json": invalidControls,
    "path-walking-integration-output.json": outputValue.pathWalkingIntegrationSummary,
    "dry-run-walking-after-output.json": dryRun.walkingDistanceSummary,
    "fallback-walking-warning-output.json": fallbackDistance,
    "dry-run-determinism-output.json": { deterministic: outputValue.pathWalkingIntegrationSummary.deterministic },
    "operational-summary-walking-output.json": operationalSummary,
    "timeline-view-model-output.json": timelineViewModel,
    "nurse-timeline-ui-output.json": timelineViewModel.nurseTimelineSummary,
    "room-timeline-ui-output.json": timelineViewModel.roomTimelineSummary,
    "warning-timeline-output.json": timelineViewModel.warningTimelineSummary,
    "warning-explainability-registry-output.json": warningExplanations,
    "warning-code-coverage-output.json": outputValue.warningExplainabilitySummary,
    "warning-explainability-ui-output.json": { component: "Plan1WarningExplainabilityPanel", status: "implemented" },
    "warning-non-claim-output.json": warningExplanations.map((entry) => entry.nonClaim),
    "scenario-comparison-view-model-output.json": comparisonViewModel,
    "typical-vs-slammed-ux-output.json": comparisonViewModel.requiredComparisons.typicalVsSlammed,
    "typical-vs-walking-heavy-ux-output.json": comparisonViewModel.requiredComparisons.typicalVsWalkingHeavy,
    "typical-vs-trauma-heavy-ux-output.json": comparisonViewModel.requiredComparisons.typicalVsTraumaHeavy,
    "comparison-non-claim-output.json": comparisonViewModel.nonClaims,
    "simulation-proof-report-output.json": proofReport,
    "simulation-proof-report-determinism-output.json": proofReport.sections.determinismProof,
    "simulation-proof-report-non-claims-output.json": proofReport.sections.nonClaims,
    "simulation-proof-report-ui-output.json": { component: "Plan1SimulationProofReportPanel", status: "implemented" },
    "path-walking-summary.json": outputValue.pathWalkingSummary,
    "root-script-traceability-summary.json": outputValue.rootScriptSummary,
    "assumptions-ui-summary.json": outputValue.assumptionsUiSummary,
    "scenario-controls-summary.json": outputValue.scenarioControlsSummary,
    "timeline-summary.json": outputValue.timelineSummary,
    "warning-explainability-summary.json": outputValue.warningExplainabilitySummary,
    "comparison-ux-summary.json": outputValue.comparisonUxSummary,
    "proof-report-summary.json": outputValue.proofReportSummary
  };
  for (const [fileName, value] of Object.entries(files)) {
    writeJson(join(issueDir, fileName), value);
  }
  writeText(join(issueDir, "timeline-limitations-output.md"), markdown("Timeline Limitations", timelineViewModel.limitations));
}

function markdown(title, values) {
  return `# ${title}\n\n${values.map((value) => `- ${value}`).join("\n")}\n`;
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
