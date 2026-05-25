// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/AssignmentWalkingPreview.tsx"), "utf8");

assertWalking(source.includes("Approx feet"), "walking preview must show approximate feet");
assertWalking(source.includes("Approx seconds"), "walking preview must show approximate seconds");
assertWalking(source.includes("limitations"), "walking preview must show limitations");

function assertWalking(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
