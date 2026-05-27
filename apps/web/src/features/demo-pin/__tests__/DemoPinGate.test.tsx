// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import {
  clearDemoPinUnlock,
  initialDemoPinUiState,
  submitDemoPin,
  updateDemoPinInput
} from "../demoPinState";
import { createDemoPinGateViewModel } from "../demoPinViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const gateSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinGate.tsx"), "utf8");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");

if (!gateSource.includes("demo-pin-gate") || !gateSource.includes("type=\"password\"")) {
  throw new Error("DemoPinGate must visibly render a PIN input");
}
if (!appSource.includes("<DemoPinGate")) {
  throw new Error("App must mount the demo PIN gate");
}

const wrong = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "0000"));
if (wrong.unlocked || wrong.state !== "wrong_pin") {
  throw new Error("wrong PIN must fail visibly");
}

const unlocked = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "2026"));
if (!unlocked.unlocked || unlocked.state !== "unlocked") {
  throw new Error("PIN 2026 must unlock protected actions");
}

const cleared = clearDemoPinUnlock();
if (cleared.unlocked || cleared.state !== "cleared") {
  throw new Error("clear must reset demo PIN unlock");
}

const vm = createDemoPinGateViewModel(unlocked);
if (!vm.protectedActions.every((action) => action.disabled === false)) {
  throw new Error("protected demo actions must unlock after PIN 2026");
}
if (/secure access|production auth enabled|protects real data/iu.test(vm.copy)) {
  throw new Error("PIN copy must not claim production auth, real security, or data protection");
}
