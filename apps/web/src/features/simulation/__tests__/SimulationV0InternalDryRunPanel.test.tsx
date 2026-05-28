// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const panelSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/simulation/SimulationV0InternalDryRunPanel.tsx"),
  "utf8"
);
const viewModelSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/simulation/simulationV0ViewModel.ts"),
  "utf8"
);
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");

assertPanel(panelSource.includes("Internal Dry-Run Readiness"), "panel must render readiness heading");
assertPanel(panelSource.includes("Queue Placeholders"), "panel must render queue summary");
assertPanel(panelSource.includes("Artifact Summary"), "panel must render artifact summary");
assertPanel(viewModelSource.includes("internal synthetic dry-run only"), "view model must expose internal-only status");
assertPanel(viewModelSource.includes("No optimizer."), "view model must state no optimizer");
assertPanel(viewModelSource.includes("No assignment recommendation."), "view model must state no assignment recommendation");
assertPanel(viewModelSource.includes("No clinical safety score."), "view model must state no clinical safety score");
assertPanel(viewModelSource.includes("No staffing compliance certification."), "view model must state no staffing compliance certification");
assertPanel(viewModelSource.includes("No patient outcome prediction."), "view model must state no patient outcome prediction");
assertPanel(appSource.includes("SimulationV0InternalDryRunPanel"), "app must mount Simulation v0 panel");

function assertPanel(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
