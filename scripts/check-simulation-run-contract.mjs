#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson
} from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["run-contract", "canonical-seed-only", "synthetic-internal-only", "no-optimizer", "final"];
const context = createCheckContext({
  scriptName: "simulation run contract",
  stages,
  statusKeyByStage: {
    "run-contract": "simulationRunContractStatus",
    "canonical-seed-only": "simulationRunContractStatus",
    "synthetic-internal-only": "simulationRunContractStatus",
    "no-optimizer": "simulationRunContractStatus"
  },
  outputName: "simulation-run-contract-output.json",
  defaultIssue: "562"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "simulation-run-contract.txt" });

async function loadShared() {
  return import("../packages/shared/dist/index.js");
}

async function runStage(stage) {
  const shared = await loadShared();
  const contract = shared.buildInternalDryRunSimulationRunContract();
  const validated = shared.validateInternalDryRunSimulationRunContract(contract);
  if (stage === "run-contract") {
    context.add("internal dry-run simulation run contract validates", validated.runContractId === "simulation-v0-internal-dry-run-contract");
    writeJson(`${context.dir}/simulation-run-contract-output.json`, { status: "passed", contract: validated });
  }
  if (stage === "canonical-seed-only") {
    context.add("contract references canonical scenario seed", validated.canonicalScenarioSeedId === "scenario-seed-canonical-plan-1-foundation", validated.canonicalScenarioSeedId);
    writeJson(`${context.dir}/canonical-seed-only-output.json`, { status: "passed", canonicalScenarioSeedId: validated.canonicalScenarioSeedId });
  }
  if (stage === "synthetic-internal-only") {
    context.add("contract is synthetic only", validated.syntheticDataOnly === true, validated.syntheticDataOnly);
    context.add("contract is internal dry-run only", validated.dryRunStatus === "internal_dry_run_shell_only", validated.dryRunStatus);
    writeJson(`${context.dir}/synthetic-internal-only-output.json`, { status: "passed" });
  }
  if (stage === "no-optimizer") {
    context.add("optimizer remains not started", validated.optimizerStatus === "not_started", validated.optimizerStatus);
  }
}
