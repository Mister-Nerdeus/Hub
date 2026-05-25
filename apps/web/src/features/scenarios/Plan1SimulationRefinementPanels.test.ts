// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const scenarioBuilderSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1ScenarioBuilder.tsx"), "utf8");
const assumptionsPanelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1AssumptionsPanel.tsx"), "utf8");
const controlsPanelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1ScenarioControls.tsx"), "utf8");
const timelinePanelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1SimulationTimelinePanel.tsx"), "utf8");
const warningPanelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1WarningExplainabilityPanel.tsx"), "utf8");
const reportPanelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1SimulationProofReportPanel.tsx"), "utf8");
const comparisonPanelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1ScenarioComparisonPanel.tsx"), "utf8");

assertScenario(scenarioBuilderSource.includes("buildPlan1AssumptionViewModel"), "scenario builder must build assumptions view model");
assertScenario(scenarioBuilderSource.includes("createPlan1BaselineScenarioControlState"), "scenario builder must build control state");
assertScenario(scenarioBuilderSource.includes("buildPlan1TimelineViewModel"), "scenario builder must build timeline view model");
assertScenario(scenarioBuilderSource.includes("explainPlan1Warnings"), "scenario builder must build warning explanations");
assertScenario(scenarioBuilderSource.includes("buildPlan1SimulationProofReport"), "scenario builder must build proof report");
assertScenario(scenarioBuilderSource.includes("walkingBaseline"), "scenario builder must pass walking baseline to dry-run");

assertScenario(assumptionsPanelSource.includes("data-scenario-stage=\"assumptions-ui\""), "assumptions panel stage must be exposed");
assertScenario(controlsPanelSource.includes("data-scenario-stage=\"scenario-controls\""), "controls panel stage must be exposed");
assertScenario(timelinePanelSource.includes("data-scenario-stage=\"timeline\""), "timeline panel stage must be exposed");
assertScenario(warningPanelSource.includes("data-scenario-stage=\"warning-explainability\""), "warning panel stage must be exposed");
assertScenario(comparisonPanelSource.includes("data-scenario-stage=\"comparison-ux\""), "comparison UX stage must be exposed");
assertScenario(reportPanelSource.includes("data-scenario-stage=\"proof-report\""), "proof report stage must be exposed");

function assertScenario(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
