// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/AssignmentComparisonPanel.tsx"), "utf8");

assertComparison(source.includes("Deterministic 3:1 vs 4:1 Fixtures"), "comparison panel must render deterministic fixture heading");
assertComparison(source.includes("data-fixture-id"), "comparison panel must expose fixture IDs");
assertComparison(source.includes("totalBurdenScore"), "comparison panel must show total burden score");

function assertComparison(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
