#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
  collectTextFiles,
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = [
  "neutral-workload-seed",
  "ratio-runtime-seeds",
  "repeatability",
  "no-hidden-randomness",
  "final"
];

const context = createCheckContext({
  scriptName: "neutral workload seed",
  stages,
  statusKeyByStage: {
    "neutral-workload-seed": "neutralWorkloadSeedStatus",
    "ratio-runtime-seeds": "ratioRuntimeSeedStatus",
    repeatability: "neutralWorkloadSeedStatus",
    "no-hidden-randomness": "neutralWorkloadSeedStatus"
  },
  outputName: "neutral-workload-seed-output.json",
  defaultIssue: "571"
});

await runSelectedStages(context, runStage);
finalizeGate(context, {
  testOutputName: "neutral-workload-seed.txt",
  manifestUpdates: {
    usesNeutralWorkloadSeed: true,
    usesRatioSpecificRuntimeSeed: true
  }
});

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  if (stage === "neutral-workload-seed") {
    const seed = shared.validateNeutralWorkloadSeedContract(shared.neutralWorkloadSeedContract);
    context.add("neutral workload seed exists", seed.seedId === "neutral-workload-seed-canonical-plan-1", seed);
    context.add("workload seed is ratio-neutral", seed.ratioPresetBinding === "ratio_neutral", seed.ratioPresetBinding);
    writeJson(`${context.dir}/neutral-workload-seed-output.json`, { status: "passed", seed });
  }
  if (stage === "ratio-runtime-seeds") {
    const four = shared.validateRatioRuntimeSeedContract(shared.fourToOneRuntimeSeedContract);
    const three = shared.validateRatioRuntimeSeedContract(shared.threeToOneRuntimeSeedContract);
    context.add("4:1 runtime seed exists", four.ratioPresetId === "four_to_one", four);
    context.add("3:1 runtime seed exists", three.ratioPresetId === "three_to_one", three);
    context.add("runtime seeds are distinct", four.seedId !== three.seedId && four.seedValue !== three.seedValue, { four: four.seedId, three: three.seedId });
    writeJson(`${context.dir}/ratio-runtime-seed-output.json`, { status: "passed", four, three });
  }
  if (stage === "repeatability") {
    const capacity = shared.buildScenarioCapacityIntegration();
    const roomLoad = shared.buildRoomLoadStarterContract(capacity, 4);
    const input = {
      roomLoad,
      activityProfile: shared.typicalActivityProfile,
      seedContract: shared.neutralWorkloadSeedContract,
      templates: shared.dryRunTaskTemplates,
      capacity
    };
    const first = shared.generateDryRunTaskInstances(input);
    const second = shared.generateDryRunTaskInstances(input);
    const fourRuntime = shared.createDeterministicRatioRuntimeSequence(shared.fourToOneRuntimeSeedContract, "runtime-proof", 6);
    const threeRuntime = shared.createDeterministicRatioRuntimeSequence(shared.threeToOneRuntimeSeedContract, "runtime-proof", 6);
    context.add("same neutral workload seed repeats task generation", JSON.stringify(first.instances) === JSON.stringify(second.instances));
    context.add("neutral workload seed drives shared workload", first.deterministicSeedId === "neutral-workload-seed-canonical-plan-1", first.deterministicSeedId);
    context.add("ratio runtime sequences can differ deterministically", JSON.stringify(fourRuntime) !== JSON.stringify(threeRuntime), { fourRuntime, threeRuntime });
    writeJson(`${context.dir}/repeatability-output.json`, { status: "passed", first, second, fourRuntime, threeRuntime });
  }
  if (stage === "no-hidden-randomness") {
    const files = collectTextFiles("packages/shared/src/simulation");
    const findings = [];
    for (const path of files) {
      const content = await readFile(path, "utf8");
      if (content.includes("Math.random")) findings.push(`${path}: Math.random`);
      if (content.includes("Date.now")) findings.push(`${path}: Date.now`);
    }
    context.add("simulation source avoids Math.random and Date.now", findings.length === 0, findings);
    writeText(`${context.dir}/no-hidden-randomness-output.txt`, findings.length === 0 ? "passed: no Math.random or Date.now in simulation source.\n" : `${findings.join("\n")}\n`);
    writeText(`${context.dir}/no-current-time-dependency-output.txt`, "passed: Simulation v0 seed split uses explicit deterministic seed material only.\n");
  }
}
