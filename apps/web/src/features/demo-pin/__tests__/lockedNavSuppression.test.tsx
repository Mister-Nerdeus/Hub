// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const entrySource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx"),
  "utf8"
);
const gateSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinGate.tsx"), "utf8");
const lockedScreenSource = `${entrySource}\n${gateSource}`;

for (const hiddenText of [
  "Floorplan",
  "Editor",
  "Manual Assignment",
  "Review / Reports",
  "Advanced",
  "Future Tools"
]) {
  if (lockedScreenSource.includes(hiddenText)) {
    throw new Error(`locked access screen must not include navigation text: ${hiddenText}`);
  }
}

if (!appSource.includes("if (!demoPinState.unlocked)")) {
  throw new Error("locked branch must be explicit before AppShell navigation renders");
}
