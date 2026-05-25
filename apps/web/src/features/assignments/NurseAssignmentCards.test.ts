// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/NurseAssignmentCards.tsx"), "utf8");

assertCards(source.includes("Nurse Assignment Cards"), "nurse cards must render heading");
assertCards(source.includes("warningCodes"), "nurse cards must show warning codes");
assertCards(source.includes("AssignmentWalkingPreview"), "nurse cards must include walking preview");

function assertCards(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
