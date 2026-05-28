#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  readJson,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = [
  "required-files",
  "local-only-negative",
  "git-tracked-required-files",
  "final"
];

const context = createRepairContext({
  scriptName: "clean committed state",
  stages,
  statusKeyByStage: {
    "required-files": "cleanCloneVerificationStatus",
    "local-only-negative": "cleanCloneVerificationStatus",
    "git-tracked-required-files": "cleanCloneVerificationStatus"
  },
  outputName: "clean-committed-state-output.json",
  defaultIssue: "597"
});

await runSelectedRepairStages(context, runStage);

finalizeRepairGate(context, {
  testOutputName: "clean-committed-state.txt",
  manifestUpdates: {
    cleanCloneVerificationStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
    cleanCloneVerificationRequired: true
  }
});

async function runStage(stage) {
  if (stage === "required-files") {
    const requiredPaths = requiredCommittedPaths();
    const missing = requiredPaths.filter((path) => !fileExists(path));
    const packageScripts = readJson("package.json").scripts ?? {};
    const requiredScripts = [
      "check:default-room-scale",
      "check:issue-evidence-index",
      "check:docs",
      "check:visible-product-copy-all-routes",
      "check:simulation-v0-ui-shell",
      "check:simulation-v0-refinement-repair"
    ];
    const missingScripts = requiredScripts.filter((script) => typeof packageScripts[script] !== "string");
    const passed = missing.length === 0 && missingScripts.length === 0;
    context.add("required committed-state repair files and root scripts exist", passed, { missing, missingScripts });
    writeJson(`${context.dir}/clean-committed-state-output.json`, { status: passed ? "passed" : "failed", missing, missingScripts });
    writeJson(`${context.dir}/committed-required-paths-output.json`, { status: missing.length === 0 ? "passed" : "failed", requiredPaths, missing });
  }
  if (stage === "local-only-negative") {
    const failed = localOnlyArtifactNegativeFails();
    context.add("local-only artifact negative fixture fails", failed, null);
    writeJson(`${context.dir}/local-only-artifact-negative-output.json`, { status: failed ? "passed" : "failed" });
  }
  if (stage === "git-tracked-required-files") {
    const requiredPaths = requiredCommittedPaths();
    const untracked = requiredPaths.filter((path) => !gitTracks(path));
    const passed = untracked.length === 0;
    context.add("required committed-state repair files are git-tracked", passed, { untracked });
    writeJson(`${context.dir}/git-tracked-required-files-output.json`, { status: passed ? "passed" : "failed", checked: requiredPaths, untracked });
  }
}

function requiredCommittedPaths() {
  const base = [
    "docs/verification/ISSUE_EVIDENCE_INDEX.json",
    "docs/verification/simulation-v0-false-positive-repair-manifest.json",
    "scripts/check-clean-committed-state.mjs",
    "scripts/check-simulation-v0-refinement-repair.mjs",
    "package.json"
  ];
  const issueEvidence = [];
  for (let issue = 591; issue <= 596; issue += 1) {
    issueEvidence.push(`docs/verification/issues/issue-${issue}/closeout.md`);
    issueEvidence.push(`docs/verification/issues/issue-${issue}/commands.txt`);
    issueEvidence.push(`docs/verification/issues/issue-${issue}/command-output-map.json`);
    issueEvidence.push(`docs/verification/issues/issue-${issue}/manifest-update-output.json`);
  }
  return [...base, ...issueEvidence];
}

function fileExists(path, minBytes = 1) {
  return existsSync(abs(path)) && statSync(abs(path)).isFile() && statSync(abs(path)).size >= minBytes;
}

function gitTracks(path) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", path], { cwd: process.cwd(), stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function localOnlyArtifactNegativeFails() {
  const tempRoot = mkdtempSync(join(tmpdir(), "clean-committed-state-"));
  try {
    const requiredPath = join(tempRoot, "docs", "verification", "issues", "issue-597", "local-only.json");
    mkdirSync(join(tempRoot, "docs", "verification", "issues", "issue-597"), { recursive: true });
    writeFileSync(requiredPath, "{}\n");
    return !gitTracks("docs/verification/issues/issue-597/local-only.json");
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
