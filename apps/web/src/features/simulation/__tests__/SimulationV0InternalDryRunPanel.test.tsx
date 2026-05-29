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
const copySource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/simulation/simulationV0Copy.ts"),
  "utf8"
);
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");

assertPanel(panelSource.includes("simulation-v0-title"), "panel must render route heading");
assertPanel(panelSource.includes("simulation-v0-route"), "panel must render stable route landmark");
assertPanel(panelSource.includes("simulation-v0-controls"), "panel must render stable controls landmark");
assertPanel(panelSource.includes("simulation-v0-output"), "panel must render stable output landmark");
assertPanel(panelSource.includes("simulation-v0-proof"), "panel must render stable proof landmark");
assertPanel(panelSource.includes("SimulationV0SummaryCards"), "panel must render queue summary cards");
assertPanel(panelSource.includes("SimulationV0ArtifactProofPanel"), "panel must render artifact proof");
assertPanel(viewModelSource.includes("internal synthetic dry-run only"), "view model must expose internal-only status");
assertPanel(copySource.includes("No optimizer."), "view model must state no optimizer");
assertPanel(copySource.includes("No automated assignment output."), "view model must state no automated assignment output");
assertPanel(copySource.includes("No care-quality certification."), "view model must state no care-quality certification");
assertPanel(copySource.includes("No staffing certification."), "view model must state no staffing certification");
assertPanel(copySource.includes("No outcome prediction."), "view model must state no outcome prediction");
assertPanel(appSource.includes("SimulationV0InternalDryRunPanel"), "app must mount Simulation v0 panel");

function assertPanel(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
