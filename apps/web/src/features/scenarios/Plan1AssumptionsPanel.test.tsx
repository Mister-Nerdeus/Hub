// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1AssumptionsPanel.tsx"), "utf8");

assertAssumptions(source.includes("buildPlan1AssumptionDisplayGroups"), "assumptions panel must use display groups");
assertAssumptions(source.includes("data-assumption-display-group"), "assumptions panel must expose group markers");
assertAssumptions(source.includes("data-assumption-non-claims=\"visible\""), "assumptions panel must expose non-claims callout");
assertAssumptions(source.includes("Read-only proof mode"), "assumptions panel must show read-only proof mode");

function assertAssumptions(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
