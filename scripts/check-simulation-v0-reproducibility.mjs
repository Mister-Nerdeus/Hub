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

const stages = ["repeated-run", "artifact-hash", "changed-seed-negative", "no-hidden-time-or-randomness", "final"];

const context = createCheckContext({
  scriptName: "simulation v0 reproducibility",
  stages,
  statusKeyByStage: {
    "repeated-run": "reproducibilityProofStatus",
    "artifact-hash": "reproducibilityProofStatus",
    "changed-seed-negative": "reproducibilityProofStatus",
    "no-hidden-time-or-randomness": "reproducibilityProofStatus"
  },
  outputName: "simulation-v0-reproducibility-output.json",
  defaultIssue: "579"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "simulation-v0-reproducibility.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const proof = shared.buildDryRunReproducibilityProof();
  if (stage === "repeated-run") {
    context.add("repeated runs match", proof.repeatedRunMatches === true, proof);
    context.add("timeline equals", proof.taskTimelineEqual === true);
    context.add("queue placeholders equal", proof.queuePlaceholderEqual === true);
    writeJson(`${context.dir}/repeated-run-output.json`, { status: "passed", proof });
  }
  if (stage === "artifact-hash") {
    context.add("artifact hash repeats", proof.firstArtifactHash === proof.secondArtifactHash, { first: proof.firstArtifactHash, second: proof.secondArtifactHash });
    context.add("nondeterministic metadata excluded from hash", proof.nondeterministicMetadataExcludedFromHash === true);
    writeJson(`${context.dir}/artifact-hash-output.json`, { status: "passed", firstArtifactHash: proof.firstArtifactHash, secondArtifactHash: proof.secondArtifactHash });
    writeJson("docs/verification/simulation-v0-reproducibility-proof.json", proof);
  }
  if (stage === "changed-seed-negative") {
    context.add("changed seed changes hash", proof.changedSeedChangesHash === true, { first: proof.firstArtifactHash, changed: proof.changedSeedArtifactHash });
    writeJson(`${context.dir}/changed-seed-negative-output.json`, { status: "passed", firstArtifactHash: proof.firstArtifactHash, changedSeedArtifactHash: proof.changedSeedArtifactHash });
  }
  if (stage === "no-hidden-time-or-randomness") {
    const files = collectTextFiles("packages/shared/src/simulation");
    const findings = [];
    for (const path of files) {
      const content = await readFile(path, "utf8");
      if (content.includes("Math.random")) findings.push(`${path}: Math.random`);
      if (content.includes("Date.now")) findings.push(`${path}: Date.now`);
    }
    context.add("simulation source avoids Math.random and Date.now", findings.length === 0, findings);
    context.add("proof forbids hidden time and randomness", proof.hiddenTimeInputStatus === "forbidden" && proof.hiddenRandomnessStatus === "forbidden", proof);
    writeText(`${context.dir}/no-hidden-time-or-randomness-output.txt`, findings.length === 0 ? "passed: no Math.random or Date.now in Simulation v0 shared simulation source.\n" : `${findings.join("\n")}\n`);
  }
}
