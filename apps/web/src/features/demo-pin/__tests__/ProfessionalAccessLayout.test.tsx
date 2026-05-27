// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const entrySource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx"), "utf8");
const gateSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinGate.tsx"), "utf8");
const cssSource = readFileSync(resolve(repoRoot, "apps/web/src/styles.css"), "utf8");

if (!entrySource.includes("data-app-lock-state=\"locked\"") || !gateSource.includes("role=\"status\"")) {
  throw new Error("professional access layout must preserve locked landmark and status");
}

for (const required of [
  ".demo-pin-entry-screen__panel",
  "box-shadow",
  "border-radius: 8px",
  ".demo-pin-gate__form button[type=\"submit\"]",
  "@media (max-width: 760px)"
]) {
  if (!cssSource.includes(required)) {
    throw new Error(`professional access layout CSS missing: ${required}`);
  }
}
