#!/usr/bin/env node
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["timestep-contract", "bounded-window", "deterministic-order", "no-real-time-claim", "final"];
const context = createCheckContext({
  scriptName: "dry-run timestep shell",
  stages,
  statusKeyByStage: {
    "timestep-contract": "timestepShellStatus",
    "bounded-window": "timestepShellStatus",
    "deterministic-order": "timestepShellStatus",
    "no-real-time-claim": "timestepShellStatus"
  },
  outputName: "dry-run-timestep-shell-output.json",
  defaultIssue: "564"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "dry-run-timestep-shell.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const contract = shared.validateDryRunTimestepContract(shared.dryRunTimestepContract);
  if (stage === "timestep-contract") {
    context.add("timestep contract validates", contract.timestepContractId === "dry-run-timestep-shell-canonical-plan-1");
    writeJson(`${context.dir}/timestep-contract-output.json`, { status: "passed", contract });
  }
  if (stage === "bounded-window") {
    context.add("dry-run window is bounded", contract.maxStepCount * contract.stepDurationMinutes <= contract.maxDurationMinutes, contract);
    writeJson(`${context.dir}/bounded-window-output.json`, { status: "passed", maxDurationMinutes: contract.maxDurationMinutes });
  }
  if (stage === "deterministic-order") {
    const ticks = shared.buildDryRunTimesteps(contract);
    context.add("ticks are deterministic order", ticks.every((tick, index) => tick.tickIndex === index), ticks);
    writeJson(`${context.dir}/deterministic-order-output.json`, { status: "passed", ticks });
  }
  if (stage === "no-real-time-claim") {
    context.add("real-time accuracy claim is false", contract.realTimeAccuracyClaim === false, contract.realTimeAccuracyClaim);
    writeText(`${context.dir}/no-real-time-claim-output.txt`, "passed: timestep shell uses synthetic minute offsets only and makes no real-time accuracy claim.\n");
  }
}
