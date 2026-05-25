// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1ScenarioComparisonPanel.tsx"), "utf8");

assertComparison(source.includes("comparison.items.map"), "comparison panel must render comparison items");
assertComparison(source.includes("totalApproxWalkingFeet"), "comparison panel must show walking burden");
assertComparison(source.includes("comparison.limitations"), "comparison panel must render limitations");
assertComparison(source.includes("comparison.nonClaims"), "comparison panel must render non-claims");
assertComparison(source.includes("data-scenario-stage=\"comparison-ux\""), "comparison panel must expose stage marker");
assertComparison(source.includes("viewModel.narratives.narratives.map"), "comparison panel must render scenario narratives");
assertComparison(source.includes("data-scenario-narratives=\"plan-1\""), "comparison panel must expose narrative marker");
assertComparison(source.includes("Evidence summary"), "comparison panel must preserve numeric evidence table");

function assertComparison(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
