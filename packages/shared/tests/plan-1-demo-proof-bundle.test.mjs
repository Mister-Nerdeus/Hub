import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  PLAN_1_DEMO_PROOF_BUNDLE_REQUIRED_SECTION_IDS,
  assertPlan1DemoProofBundleHasNoProhibitedClaims,
  assertPlan1DemoProofBundleHasRequiredSections,
  buildPlan1AssumptionViewModel,
  buildPlan1DemoProofBundle,
  buildPlan1DemoSeedPackSummary,
  buildPlan1ScenarioComparisonViewModel,
  buildPlan1SimulationProofReport,
  buildPlan1TimelineViewModel,
  explainPlan1Warnings,
  generatePlan1SeededSyntheticTasks,
  runPlan1ShiftDryRun,
  validatePlan1DemoSeedPack,
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioComparisonFixture,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates,
  validatePlanContract,
  validateWalkingBaselineContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const walkingBaseline = validateWalkingBaselineContract(
  readJson("default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json")
);
const assumptions = validatePlan1SimulationAssumptions(readJson("scenarios/plan-1/assumptions-register.json"));
const intensityProfiles = validatePlan1ScenarioIntensityProfiles(readJson("scenarios/plan-1/scenario-intensity-profiles.json"));
const taskTemplates = validatePlan1TaskTemplates(readJson("scenarios/plan-1/task-templates.json"));
const scenarioState = validatePlan1ScenarioBuilderState(readJson("scenarios/plan-1/scenario-builder-baseline.json"), {
  assumptions,
  intensityProfiles,
  taskTemplates
});
const simulationInput = validatePlan1SimulationInput(readJson("scenarios/plan-1/simulation-input-baseline.json"), scenarioState);
const generatedTaskSet = generatePlan1SeededSyntheticTasks(simulationInput);
const dryRun = runPlan1ShiftDryRun({ simulationInput, generatedTaskSet, plan, walkingBaseline });
const assumptionsViewModel = buildPlan1AssumptionViewModel(assumptions);
const timelineViewModel = buildPlan1TimelineViewModel(dryRun);
const comparisonViewModel = buildPlan1ScenarioComparisonViewModel(
  validatePlan1ScenarioComparisonFixture(readJson("scenarios/plan-1/scenario-comparison-fixtures.json"))
);
const proofReport = buildPlan1SimulationProofReport({
  reportId: "plan-1-demo-proof-bundle-test-report",
  scenarioState,
  assumptionsViewModel,
  generatedTaskSet,
  dryRun,
  timelineViewModel,
  warningExplanations: explainPlan1Warnings(dryRun.warningCodes),
  comparisonViewModel
});
const demoSeedSummary = buildPlan1DemoSeedPackSummary(
  validatePlan1DemoSeedPack(readJson("demo/plan-1/plan-1-demo-seed-pack.json"))
);

test("Plan 1 demo proof bundle includes all required review sections", () => {
  const bundle = buildPlan1DemoProofBundle({ proofReport, demoSeedSummary, sourceIssue: "277" });

  assertPlan1DemoProofBundleHasRequiredSections(bundle);
  assert.deepEqual(
    bundle.sections.map((section) => section.sectionId),
    PLAN_1_DEMO_PROOF_BUNDLE_REQUIRED_SECTION_IDS
  );
  assert.equal(bundle.syntheticDataOnly, true);
  assert.equal(bundle.nonClaims.includes("Synthetic operational modeling only."), true);
});

test("Plan 1 demo proof bundle output is deterministic", () => {
  assert.deepEqual(
    buildPlan1DemoProofBundle({ proofReport, demoSeedSummary, sourceIssue: "277" }),
    buildPlan1DemoProofBundle({ proofReport, demoSeedSummary, sourceIssue: "277" })
  );
});

test("Plan 1 demo proof bundle references local evidence artifacts", () => {
  const bundle = buildPlan1DemoProofBundle({ proofReport, demoSeedSummary, sourceIssue: "277" });

  assert.ok(bundle.evidenceArtifactReferences.length >= 10);
  assert.ok(bundle.evidenceArtifactReferences.every((reference) => reference.path.startsWith("docs/verification/issues/")));
  assert.ok(bundle.evidenceArtifactReferences.some((reference) => reference.artifactId === "demo-seed-pack"));
});

test("Plan 1 demo proof bundle rejects unsupported claim language outside non-claims", () => {
  const bundle = buildPlan1DemoProofBundle({ proofReport, demoSeedSummary, sourceIssue: "277" });

  assert.throws(
    () => assertPlan1DemoProofBundleHasNoProhibitedClaims({
      ...bundle,
      sections: bundle.sections.map((section) => section.sectionId === "scenario-simulation-summary"
        ? { ...section, details: [...section.details, "safe staffing"] }
        : section)
    }),
    /prohibited claim language/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}
