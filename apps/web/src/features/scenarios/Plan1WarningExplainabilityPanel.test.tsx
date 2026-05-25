// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1WarningExplainabilityPanel.tsx"), "utf8");

assertWarning(source.includes("data-warning-cards=\"plan-1\""), "warning panel must render warning cards");
assertWarning(source.includes("warningCards.map"), "warning panel must map warning cards");
assertWarning(source.includes("data-warning-card"), "warning panel must expose warning card markers");
assertWarning(source.includes("data-warning-non-claims=\"visible\""), "warning panel must expose non-claims");
assertWarning(source.includes("operationalOnlyLabel"), "warning panel must render operational-only label");

function assertWarning(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
