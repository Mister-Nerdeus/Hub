#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = [
  "executor-contract",
  "one-run-execution",
  "deterministic-timeline",
  "dormant-full-event-contract",
  "no-clinical-claims",
  "final"
];

const context = createCheckContext({
  scriptName: "dry-run executor",
  stages,
  statusKeyByStage: {
    "executor-contract": "dryRunExecutorStatus",
    "one-run-execution": "dryRunExecutorStatus",
    "deterministic-timeline": "dryRunExecutorStatus",
    "dormant-full-event-contract": "dryRunExecutorStatus",
    "no-clinical-claims": "dryRunExecutorStatus"
  },
  outputName: "dry-run-executor-output.json",
  defaultIssue: "573"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "dry-run-executor.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const run = shared.validateInternalDryRunExecutorOutput(shared.executeInternalDryRun());
  if (stage === "executor-contract") {
    context.add("executor output validates", run.schemaVersion === "1.0.0", run.schemaVersion);
    context.add("executor uses neutral workload seed", run.neutralWorkloadSeedId === "neutral-workload-seed-canonical-plan-1", run.neutralWorkloadSeedId);
    writeJson(`${context.dir}/executor-contract-output.json`, { status: "passed", runId: run.runId, summaryCounts: run.summaryCounts });
  }
  if (stage === "one-run-execution") {
    context.add("one internal dry-run can execute", run.timeline.length > 0, run.timeline.length);
    context.add("generated task count is non-zero", run.summaryCounts.generatedTaskCount > 0, run.summaryCounts);
    writeJson(`${context.dir}/one-run-execution-output.json`, { status: "passed", run });
  }
  if (stage === "deterministic-timeline") {
    const repeat = shared.executeInternalDryRun();
    context.add("timeline repeats for same inputs", JSON.stringify(run.timeline) === JSON.stringify(repeat.timeline));
    writeJson(`${context.dir}/deterministic-timeline-output.json`, { status: "passed", first: run.timeline, second: repeat.timeline });
    writeJson(`${context.dir}/synthetic-event-output.json`, {
      status: "passed",
      labels: [...new Set(run.timeline.map((event) => event.eventLabel))]
    });
  }
  if (stage === "dormant-full-event-contract") {
    context.add("full event contract remains dormant", run.dormantFullEventContractStatus === "dormant", run.dormantFullEventContractStatus);
    writeText(`${context.dir}/dormant-full-event-contract-output.txt`, "passed: SimulationRunContract full event model remains dormant for Simulation v0 internal dry-run output.\n");
  }
  if (stage === "no-clinical-claims") {
    context.add("no clinical safety claim", run.clinicalSafetyClaim === false, run.clinicalSafetyClaim);
    context.add("no staffing compliance claim", run.staffingComplianceClaim === false, run.staffingComplianceClaim);
    context.add("no patient outcome prediction claim", run.patientOutcomePredictionClaim === false, run.patientOutcomePredictionClaim);
    writeText(`${context.dir}/no-clinical-claims-output.txt`, "passed: executor output remains synthetic, internal, and non-clinical.\n");
  }
}
