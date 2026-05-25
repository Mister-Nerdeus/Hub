// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/AssignmentValidationPanel.tsx"), "utf8");

assertValidation(source.includes("data-warning-code"), "validation panel must expose warning codes");
assertValidation(source.includes("data-warning-severity"), "validation panel must expose warning severities");
assertValidation(source.includes("data-assignment-stage=\"validation\""), "validation panel must expose validation stage");

function assertValidation(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
