// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1ScenarioBuilder.tsx"), "utf8");

assertScenario(source.includes("validatePlan1ScenarioBuilderState"), "scenario builder must validate canonical state");
assertScenario(source.includes("validatePlan1SimulationInput"), "scenario builder must validate simulation input");
assertScenario(source.includes("runPlan1ShiftDryRun"), "scenario builder must consume dry-run output");
assertScenario(source.includes("data-scenario-stage=\"final\""), "scenario builder must expose final stage state");
assertScenario(source.includes("data-plan-1-scope=\"blocked\""), "scenario builder must block non-Plan-1 scope");

function assertScenario(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
