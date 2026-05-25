// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1OperationalSummaryPanel.tsx"), "utf8");

assertSummary(source.includes("summary.warningCodes"), "summary panel must render warning codes");
assertSummary(source.includes("summary.limitations"), "summary panel must render limitations");
assertSummary(source.includes("summary.nonClaims"), "summary panel must render non-claims");
assertSummary(source.includes("data-scenario-stage=\"operational-summary\""), "summary panel must expose stage marker");

function assertSummary(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
