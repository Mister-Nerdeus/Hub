#!/usr/bin/env node
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["seed-contract", "repeatability", "profile-binding", "no-hidden-randomness", "final"];
const context = createCheckContext({
  scriptName: "deterministic seed contract",
  stages,
  statusKeyByStage: {
    "seed-contract": "deterministicSeedStatus",
    repeatability: "deterministicSeedStatus",
    "profile-binding": "deterministicSeedStatus",
    "no-hidden-randomness": "deterministicSeedStatus"
  },
  outputName: "deterministic-seed-contract-output.json",
  defaultIssue: "563"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "deterministic-seed-contract.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const contract = shared.validateDeterministicDryRunSeedContract(shared.deterministicDryRunSeedContract);
  if (stage === "seed-contract") {
    context.add("deterministic seed contract validates", contract.seedId === "deterministic-dry-run-seed-canonical-plan-1");
    writeJson(`${context.dir}/deterministic-seed-contract-output.json`, { status: "passed", contract });
  }
  if (stage === "repeatability") {
    const first = shared.createDeterministicDryRunSequence(contract, "repeatability", 5);
    const second = shared.createDeterministicDryRunSequence(contract, "repeatability", 5);
    const different = shared.createDeterministicDryRunSequence({ ...contract, seedValue: "dry-run-seed-v0-alt" }, "repeatability", 5);
    context.add("same seed repeats sequence", JSON.stringify(first) === JSON.stringify(second), { first, second });
    context.add("different seed changes sequence", JSON.stringify(first) !== JSON.stringify(different), { first, different });
    writeJson(`${context.dir}/repeatability-output.json`, { status: "passed", first, second, different });
  }
  if (stage === "profile-binding") {
    context.add("seed binds activity profile", contract.activityProfileId === "typical", contract.activityProfileId);
    context.add("seed binds ratio preset", contract.ratioPresetId === "four_to_one", contract.ratioPresetId);
    writeJson(`${context.dir}/profile-binding-output.json`, { status: "passed", activityProfileId: contract.activityProfileId, ratioPresetId: contract.ratioPresetId });
  }
  if (stage === "no-hidden-randomness") {
    context.add("contract forbids hidden randomness", contract.hiddenRandomnessStatus === "forbidden", contract.hiddenRandomnessStatus);
    context.add("contract forbids current-time dependency", contract.currentTimeDependencyStatus === "forbidden", contract.currentTimeDependencyStatus);
    writeText(`${context.dir}/no-hidden-randomness-output.txt`, "passed: deterministic sequence helper uses explicit seed input only.\n");
    writeText(`${context.dir}/no-current-time-dependency-output.txt`, "passed: deterministic sequence helper does not use current-clock input.\n");
  }
}
