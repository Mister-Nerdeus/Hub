// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");

if (!appSource.includes("plan-1-demo-guide-demoted")) {
  throw new Error("Plan 1 Demo Guide must be demoted into a secondary details section");
}
if (appSource.indexOf("Canonical ER Pod Floorplan") > appSource.indexOf("plan-1-demo-guide-demoted")) {
  throw new Error("canonical operator workflow must appear before the demo guide source path");
}
