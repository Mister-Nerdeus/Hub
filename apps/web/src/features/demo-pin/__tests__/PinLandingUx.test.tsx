// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const entrySource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx"),
  "utf8"
);
const gateSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo-pin/DemoPinGate.tsx"), "utf8");

if (!entrySource.includes("<main") || !entrySource.includes("data-app-lock-state=\"locked\"")) {
  throw new Error("workspace access screen must be a standalone main screen");
}
if (!entrySource.includes("productDisplayName")) {
  throw new Error("workspace access screen must use shared product identity");
}
if (!entrySource.includes("viewModel.title") || !entrySource.includes("viewModel.caveat")) {
  throw new Error("workspace access screen must use centralized professional copy");
}
if (!gateSource.includes("aria-label={viewModel.inputLabel}") || !gateSource.includes("role=\"status\"")) {
  throw new Error("workspace access gate must have accessible input and visible status");
}
if (!gateSource.includes("disabled={!viewModel.canSubmit}")) {
  throw new Error("workspace access submit must disable during cooldown or lockout");
}
