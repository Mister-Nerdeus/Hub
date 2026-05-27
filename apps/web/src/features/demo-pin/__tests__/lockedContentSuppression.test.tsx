// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const entrySource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx"),
  "utf8"
);

for (const hiddenText of [
  "Plan 1 Demo Guide",
  "seed pack",
  "Scenario Comparison",
  "proof report",
  "Developer/Evidence"
]) {
  if (entrySource.includes(hiddenText)) {
    throw new Error(`locked PIN screen must not include app/demo content: ${hiddenText}`);
  }
}
