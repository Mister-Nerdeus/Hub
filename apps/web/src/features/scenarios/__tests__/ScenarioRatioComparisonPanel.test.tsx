// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const panelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx"), "utf8");
const copySource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/scenarioRatioComparisonCopy.ts"), "utf8");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");

assertPanel(panelSource.includes("data-scenario-ratio-stage=\"comparison-ui-shell\""), "panel must expose scenario ratio UI stage marker");
assertPanel(panelSource.includes("data-ratio-card={card.ratioId}"), "panel must expose ratio card markers");
assertPanel(copySource.includes("Configuration comparison only"), "panel copy must state configuration-only boundary");
assertPanel(copySource.includes("Simulation engine not started"), "panel copy must state engine boundary");
assertPanel(copySource.includes("Not staffing compliance certification"), "panel copy must state staffing non-claim");
assertPanel(panelSource.includes("Placeholder outcome rows"), "panel must render placeholder outcome table");
assertPanel(!panelSource.includes("\"Computed\""), "panel must not render computed outcome copy");
assertPanel(appSource.includes("<ScenarioRatioComparisonPanel />"), "App must wire the comparison UI shell into Scenarios");

function assertPanel(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
