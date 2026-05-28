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
  throw new Error("DemoPinGate must visibly render an access-code input");
}
if (gateSource.includes("data-protected-action-id") || gateSource.includes("Protected demo actions")) {
  throw new Error("locked access gate must not render protected workflow actions before unlock");
}
if (!appSource.includes("<WorkspaceAccessEntryScreen")) {
  throw new Error("App must mount the standalone workspace access screen before AppShell");
}

const wrong = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "0000"));
if (wrong.unlocked || wrong.state !== "wrong_pin") {
  throw new Error("wrong access code must fail visibly");
}

const unlocked = submitDemoPin(updateDemoPinInput(initialDemoPinUiState, "2026"));
if (!unlocked.unlocked || unlocked.state !== "unlocked") {
  throw new Error("correct internal access code must unlock protected actions");
}

const cleared = clearDemoPinUnlock();
if (cleared.unlocked || cleared.state !== "cleared") {
  throw new Error("clear must reset workspace access unlock");
}

const vm = createDemoPinGateViewModel(unlocked);
if (!vm.protectedActions.every((action) => action.disabled === false)) {
  throw new Error("protected actions must unlock after the correct internal access code");
}
if (/secure access|production auth enabled|protects real data|Demo PIN/iu.test(vm.copy)) {
  throw new Error("access copy must not claim production auth, real security, or reveal the internal code");
}
