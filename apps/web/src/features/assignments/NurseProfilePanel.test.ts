// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/assignments/NurseProfilePanel.tsx"), "utf8");

assertPanel(source.includes("Synthetic Nurses"), "nurse profile panel must render synthetic nurse heading");
assertPanel(source.includes("data-assignment-stage=\"nurse-profiles\""), "nurse profile panel must expose nurse-profiles stage");
assertPanel(source.includes("data-nurse-id"), "nurse profile panel must expose nurse IDs");

function assertPanel(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
