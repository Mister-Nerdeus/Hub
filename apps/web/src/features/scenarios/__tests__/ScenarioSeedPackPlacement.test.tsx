// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const guideSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo/Plan1DemoGuide.tsx"), "utf8");
const seedPanelSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/scenarios/ScenarioSeedPackPanel.tsx"),
  "utf8"
);

if (!guideSource.includes("data-seed-pack-placement=\"developer-evidence\"")) {
  throw new Error("Plan 1 seed pack must be demoted into evidence details");
}
if (!seedPanelSource.includes("data-seed-pack-placement=\"advanced-evidence\"")) {
  throw new Error("ScenarioSeedPackPanel must mark seed pack as Advanced/Evidence placement");
}
