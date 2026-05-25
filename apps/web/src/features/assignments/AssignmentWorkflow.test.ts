// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/AssignmentWorkflow.tsx"), "utf8");

assertWorkflow(source.includes("if (!planIsActivePlan1)"), "assignment workflow must gate non-Plan-1 scope");
assertWorkflow(source.includes("plan: activePlan ?? null"), "scope validation must receive the actual active plan state");
assertWorkflow(source.includes("data-plan-1-scope=\"blocked\""), "blocked scope state must be exposed in the DOM");
assertWorkflow(
  source.indexOf("if (!planIsActivePlan1)") < source.indexOf("const validation = validatePlan1AssignmentsForOperations"),
  "Plan 1 assignment controls must not render before scope validation passes"
);

function assertWorkflow(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
