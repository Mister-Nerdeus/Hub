// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const evidenceSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/DeveloperEvidencePage.tsx"), "utf8");
const legacyGuideLabel = ["Plan", "1", "Demo", "Guide"].join(" ");

if (appSource.includes("plan-1-demo-guide-demoted") || appSource.includes("<Plan1DemoGuide")) {
  throw new Error("Canonical workflow guide must not be globally mounted in App");
}
if (!evidenceSource.includes("<Plan1DemoGuide") || !evidenceSource.includes("Workflow evidence")) {
  throw new Error("workflow guide must live only in the deliberate Advanced/Evidence placement");
}
if (evidenceSource.includes(`<summary>${legacyGuideLabel}</summary>`)) {
  throw new Error("unlocked guide summary must not use legacy guide copy");
}
if (!appSource.includes("<ActiveFloorplanSelector")) {
  throw new Error("active floorplan workflow must remain in the product route");
}
