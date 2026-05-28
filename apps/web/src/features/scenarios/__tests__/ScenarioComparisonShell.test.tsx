// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const panelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx"), "utf8");
const viewModelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/scenarioComparisonViewModel.ts"), "utf8");

assertShell(panelSource.includes("data-scenario-foundation-shell=\"ready\""), "scenario shell marker is required");
assertShell(panelSource.includes("Capacity counts"), "capacity count summary must render");
assertShell(panelSource.includes("Ratio presets"), "ratio presets must render");
assertShell(panelSource.includes("Activity profiles"), "activity profiles must render");
assertShell(panelSource.includes("Known limitations"), "known limitations must render");
assertShell(viewModelSource.includes("buildScenarioCapacityIntegration"), "view model must use selector-driven capacity integration");
assertShell(viewModelSource.includes("No full-shift simulation output"), "view model must keep simulation output placeholder-only");
assertShell(viewModelSource.includes("No optimizer recommendation"), "view model must not expose optimizer output");
assertShell(!viewModelSource.includes("Math.random"), "scenario shell must not introduce unseeded randomness");

function assertShell(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
