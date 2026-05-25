// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/BurdenScorePanel.tsx"), "utf8");

assertBurden(source.includes("Operational Burden Score"), "burden panel must render burden score heading");
assertBurden(source.includes("warningPenaltyPoints"), "burden panel must show warning penalty");
assertBurden(source.includes("walkingDistancePoints"), "burden panel must show walking component");

function assertBurden(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
