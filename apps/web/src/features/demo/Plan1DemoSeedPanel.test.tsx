// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const issueEvidenceDir = resolve(repoRoot, "docs/verification/issues/issue-276");
mkdirSync(issueEvidenceDir, { recursive: true });

type DemoSeedFixture = { demoSeedId: string };

const panelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo/Plan1DemoSeedPanel.tsx"), "utf8");
const guideSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo/Plan1DemoGuide.tsx"), "utf8");
const seedPackSource = readFileSync(resolve(repoRoot, "packages/shared/fixtures/demo/plan-1/plan-1-demo-seed-pack.json"), "utf8");
const seedPack = JSON.parse(seedPackSource) as { seeds: DemoSeedFixture[] };
const requiredSeedIds = [
  "demo-plan-1-typical",
  "demo-plan-1-slammed",
  "demo-plan-1-walking-heavy",
  "demo-plan-1-trauma-heavy",
  "demo-plan-1-comparison"
];

assertDemoSeed(panelSource.includes("data-demo-seed-panel=\"plan-1\""), "seed panel must expose Plan 1 marker");
assertDemoSeed(panelSource.includes("data-demo-seed={seed.demoSeedId}"), "seed panel must expose per-seed marker");
assertDemoSeed(panelSource.includes("data-demo-seed-non-claims=\"visible\""), "seed panel must expose visible non-claims marker");
assertDemoSeed(guideSource.includes("<Plan1DemoSeedPanel"), "Plan 1 demo guide must mount seed panel");

for (const seedId of requiredSeedIds) {
  assertDemoSeed(seedPack.seeds.some((seed) => seed.demoSeedId === seedId), `seed pack must include ${seedId}`);
}

writeFileSync(resolve(issueEvidenceDir, "demo-seed-panel-output.json"), `${JSON.stringify({
  issue: "276",
  status: "passed",
  mountedInGuide: guideSource.includes("<Plan1DemoSeedPanel"),
  hasPanelMarker: panelSource.includes("data-demo-seed-panel=\"plan-1\""),
  hasPerSeedMarker: panelSource.includes("data-demo-seed={seed.demoSeedId}"),
  hasVisibleNonClaims: panelSource.includes("data-demo-seed-non-claims=\"visible\""),
  seedIds: seedPack.seeds.map((seed) => seed.demoSeedId)
}, null, 2)}\n`);

function assertDemoSeed(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
