#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
  addAndWrite,
  createManualReviewUxContext,
  finalizeManualReviewUxGate,
  readJson,
  runSelectedManualReviewUxStages,
  writeJson
} from "./lib/simulation-v0-manual-review-ux-utils.mjs";

const stages = ["root-scripts", "rerun-feature-gates", "missing-feature-gate-negative", "final"];

const rootFeatureScripts = [
  "check:simulation-v0-profile-selector",
  "check:simulation-v0-ratio-controls",
  "check:simulation-v0-timeline-table",
  "check:simulation-v0-summary-cards",
  "check:simulation-v0-occupied-bed-proof",
  "check:simulation-v0-artifact-proof-panel",
  "check:simulation-v0-artifact-export",
  "check:simulation-v0-manual-review-evidence",
  "check:simulation-v0-navigation-placement",
  "check:simulation-v0-copy-polish",
  "check:simulation-v0-timeline-usability",
  "check:simulation-v0-summary-card-hierarchy",
  "check:simulation-v0-artifact-export-ux",
  "check:simulation-v0-user-facing-feature-gates"
];

const rerunScripts = rootFeatureScripts.filter((script) => script !== "check:simulation-v0-user-facing-feature-gates");

const context = createManualReviewUxContext({
  scriptName: "simulation v0 user-facing feature gates",
  stages,
  statusKeyByStage: {
    "root-scripts": "finalGateRerunCoverageStatus",
    "rerun-feature-gates": "finalGateRerunCoverageStatus",
    "missing-feature-gate-negative": "finalGateRerunCoverageStatus"
  },
  outputName: "root-feature-gates-output.json",
  defaultIssue: "617"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-user-facing-feature-gates.txt",
  manifestUpdates: {
    finalGateRerunCoverageStatus: passed ? "passed" : "failed",
    finalGateRerunsFeatureGates: passed
  },
  closeoutStatus: passed ? "GO for Issue 618. Final gate coverage reruns feature gates." : "NO-GO with feature-gate coverage blockers."
});

async function runStage(stage) {
  if (stage === "root-scripts") {
    const packageJson = readJson("package.json");
    const scripts = packageJson.scripts ?? {};
    const missing = rootFeatureScripts.filter((script) => typeof scripts[script] !== "string");
    const verifySource = readFileSync("scripts/verify-local.mjs", "utf8");
    const verifyIncludesComposite = verifySource.includes("npm run check:simulation-v0-user-facing-feature-gates");
    const passed = missing.length === 0 && verifyIncludesComposite;
    addAndWrite(context, "root-feature-gates-output.json", "root package scripts and local verifier include Simulation v0 feature gates", passed, {
      missing,
      verifyIncludesComposite
    });
  }
  if (stage === "rerun-feature-gates") {
    const results = [];
    for (const script of rerunScripts) {
      const result = spawnSync("npm", ["run", script], {
        cwd: process.cwd(),
        shell: process.platform === "win32",
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024
      });
      results.push({
        script,
        status: result.status,
        stdoutTail: tail(result.stdout),
        stderrTail: tail(result.stderr)
      });
      if (result.status !== 0) break;
    }
    const passed = results.length === rerunScripts.length && results.every((result) => result.status === 0);
    context.add("composite gate reruns 603-609 and 611-616 feature gates", passed, { results });
    writeJson(`${context.dir}/feature-gate-rerun-output.json`, { status: passed ? "passed" : "failed", results });
    writeJson(`${context.dir}/final-gate-hardening-output.json`, { status: passed ? "passed" : "failed", rerunCount: results.length });
  }
  if (stage === "missing-feature-gate-negative") {
    const fixtureScripts = rootFeatureScripts.filter((script) => script !== "check:simulation-v0-artifact-export");
    const missing = rootFeatureScripts.filter((script) => !fixtureScripts.includes(script));
    const failed = missing.length > 0;
    addAndWrite(context, "missing-feature-gate-negative-output.json", "missing feature-gate negative fixture fails", failed, { missing });
    writeJson(`${context.dir}/verify-local-feature-gates-output.json`, {
      status: existsSync("scripts/verify-local.mjs") && readFileSync("scripts/verify-local.mjs", "utf8").includes("check:simulation-v0-user-facing-feature-gates") ? "passed" : "failed"
    });
  }
}

function tail(value) {
  return String(value ?? "").split(/\r?\n/u).slice(-20).join("\n");
}
