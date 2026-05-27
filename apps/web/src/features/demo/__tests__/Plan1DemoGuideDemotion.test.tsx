// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const legacyGuideLabel = ["Plan", "1", "Demo", "Guide"].join(" ");

if (!appSource.includes("plan-1-demo-guide-demoted")) {
  throw new Error("Canonical workflow guide must be demoted into a secondary details section");
}
if (!appSource.includes("Canonical Workflow Guide")) {
  throw new Error("unlocked guide summary must use canonical workflow copy");
}
if (appSource.includes(`<summary>${legacyGuideLabel}</summary>`)) {
  throw new Error("unlocked guide summary must not use legacy guide copy");
}
if (appSource.indexOf("Canonical ER Pod Floorplan") > appSource.indexOf("plan-1-demo-guide-demoted")) {
  throw new Error("canonical operator workflow must appear before the demo guide source path");
}
