#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

export const REQUIRED_ROOT_SCRIPTS = [
  "check:neutral-workload-seed",
  "check:activity-profile-occupancy-selection",
  "check:dry-run-executor",
  "check:nurse-task-processing-loop",
  "check:ratio-aware-queue-placeholder",
  "check:dry-run-event-artifacts",
  "check:simulation-v0-comparison-artifact",
  "check:simulation-v0-ui-shell",
  "check:simulation-v0-reproducibility",
  "check:simulation-v0-internal-dry-run",
  "check:visible-product-copy-all-routes",
  "check:workflow-guide-route-isolation",
  "check:workspace-access-internal-naming",
  "check:issue-evidence-index",
  "check:root-verification-wiring",
  "check:default-room-scale",
  "check:executor-seed-preset-guards",
  "check:runtime-seed-behavior",
  "check:simulation-v0-comparison-validation-hardening",
  "check:simulation-v0-refinement-repair"
];

const stages = [
  "root-scripts",
  "verify-local-includes-571-590",
  "no-allow-partial-final-verify",
  "missing-script-negative",
  "verify-local-dry-run",
  "final"
];

const context = createRepairContext({
  scriptName: "root verification wiring",
  stages,
  statusKeyByStage: {
    "root-scripts": "rootVerificationWiringStatus",
    "verify-local-includes-571-590": "rootVerificationWiringStatus",
    "no-allow-partial-final-verify": "rootVerificationWiringStatus",
    "missing-script-negative": "rootVerificationWiringStatus"
  },
  outputName: "root-verification-wiring-output.json",
  defaultIssue: "585"
});

await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "root-verification-wiring.txt",
  manifestUpdates: {
    rootVerificationWiringStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
  }
});

async function runStage(stage) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const verifyLocal = readFileSync("scripts/verify-local.mjs", "utf8");
  if (stage === "root-scripts") {
    const missing = REQUIRED_ROOT_SCRIPTS.filter((script) => typeof pkg.scripts?.[script] !== "string");
    context.add("every required 571-590 final gate has a root npm script", missing.length === 0, { missing, requiredCount: REQUIRED_ROOT_SCRIPTS.length });
    writeJson(`${context.dir}/root-scripts-output.json`, { status: missing.length === 0 ? "passed" : "failed", missing, required: REQUIRED_ROOT_SCRIPTS });
  }
  if (stage === "verify-local-includes-571-590") {
    const missing = REQUIRED_ROOT_SCRIPTS.filter((script) => !verifyLocal.includes(`npm run ${script}`));
    context.add("verify-local includes every required 571-590 root gate", missing.length === 0, { missing });
    writeJson(`${context.dir}/verify-local-includes-571-590-output.json`, { status: missing.length === 0 ? "passed" : "failed", missing });
  }
  if (stage === "no-allow-partial-final-verify") {
    const lines = verifyLocal.split(/\r?\n/u).filter((line) => line.includes("check:") || line.includes("check-"));
    const offenders = lines.filter((line) => line.includes("--allow-partial"));
    context.add("final verify-local does not use --allow-partial for required gates", offenders.length === 0, { offenders });
    writeJson(`${context.dir}/no-allow-partial-final-verify-output.json`, { status: offenders.length === 0 ? "passed" : "failed", offenders });
  }
  if (stage === "missing-script-negative") {
    const fakeScripts = { ...pkg.scripts };
    delete fakeScripts[REQUIRED_ROOT_SCRIPTS[0]];
    const missing = REQUIRED_ROOT_SCRIPTS.filter((script) => typeof fakeScripts[script] !== "string");
    context.add("missing script negative fixture fails", missing.length === 1, { missing });
    writeJson(`${context.dir}/missing-script-negative-output.json`, { status: missing.length === 1 ? "passed" : "failed", missing });
  }
  if (stage === "verify-local-dry-run") {
    const commandCount = (verifyLocal.match(/npm run check:/gu) ?? []).length;
    context.add("verify-local dry-run source includes root check commands", commandCount >= REQUIRED_ROOT_SCRIPTS.length, { commandCount });
    writeJson(`${context.dir}/verify-local-dry-run-output.json`, { status: commandCount >= REQUIRED_ROOT_SCRIPTS.length ? "passed" : "failed", commandCount });
  }
}
