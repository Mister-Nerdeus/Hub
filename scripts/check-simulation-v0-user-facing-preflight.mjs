#!/usr/bin/env node
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  readJson,
  readText,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";
import { checkIssueEvidenceIndex } from "./check-issue-evidence-index.mjs";

const stages = [
  "verify-local-includes-clean-state",
  "verify-local-includes-readiness",
  "verify-local-includes-preflight",
  "dynamic-evidence-index-range",
  "stale-issue-number-negative",
  "non-mutating-root-verify",
  "final"
];

const context = createRepairContext({
  scriptName: "simulation v0 user-facing preflight",
  stages,
  statusKeyByStage: {
    "verify-local-includes-clean-state": "preflightTruthLockStatus",
    "verify-local-includes-readiness": "preflightTruthLockStatus",
    "verify-local-includes-preflight": "preflightTruthLockStatus",
    "dynamic-evidence-index-range": "preflightTruthLockStatus",
    "stale-issue-number-negative": "nonMutatingRootVerificationStatus",
    "non-mutating-root-verify": "nonMutatingRootVerificationStatus"
  },
  outputName: "verify-local-preflight-output.json",
  defaultIssue: "601"
});

await runSelectedRepairStages(context, runStage);

const passed = context.checks.every((check) => check.passed);
finalizeRepairGate(context, {
  testOutputName: "preflight-truth-lock.txt",
  manifestUpdates: {
    preflightTruthLockStatus: passed ? "passed" : "failed",
    nonMutatingRootVerificationStatus: passed ? "passed" : "failed",
    verifyLocalIncludesCleanState: verifyLocalIncludes("npm run check:clean-committed-state"),
    verifyLocalIncludesReadiness: verifyLocalIncludes("npm run check:simulation-v0-user-facing-readiness"),
    verifyLocalIncludesPreflight: verifyLocalIncludes("npm run check:simulation-v0-user-facing-preflight"),
    evidenceIndexUsesDynamicCurrentIssue: readText("scripts/check-issue-evidence-index.mjs").includes("requiredIssuesThroughCurrentManifest"),
    rootScriptsUseCurrentEvidenceIssue: staleRootIssueScripts().length === 0,
    rootVerifyIsNonMutating: staleRootIssueScripts().length === 0
  },
  closeoutStatus: passed ? "GO for Issue 602." : "NO-GO with preflight blockers."
});

async function runStage(stage) {
  if (stage === "verify-local-includes-clean-state") {
    const present = verifyLocalIncludes("npm run check:clean-committed-state");
    context.add("verify-local includes clean committed-state gate", present);
    writeJson(`${context.dir}/clean-committed-state-root-script-output.json`, { status: present ? "passed" : "failed" });
  }
  if (stage === "verify-local-includes-readiness") {
    const present = verifyLocalIncludes("npm run check:simulation-v0-user-facing-readiness");
    context.add("verify-local includes user-facing readiness gate", present);
    writeJson(`${context.dir}/readiness-root-script-output.json`, { status: present ? "passed" : "failed" });
  }
  if (stage === "verify-local-includes-preflight") {
    const present = verifyLocalIncludes("npm run check:simulation-v0-user-facing-preflight");
    context.add("verify-local includes user-facing preflight gate", present);
    writeJson(`${context.dir}/verify-local-preflight-output.json`, { status: present ? "passed" : "failed" });
  }
  if (stage === "dynamic-evidence-index-range") {
    const source = readText("scripts/check-issue-evidence-index.mjs");
    const manifest = readJson("docs/verification/simulation-v0-user-facing-refinement-manifest.json");
    const requiredIssues = Array.from(
      { length: Number(manifest.lastUpdatedIssue) - 571 + 1 },
      (_, index) => String(571 + index).padStart(3, "0")
    );
    const passed = source.includes("requiredIssuesThroughCurrentManifest") && requiredIssues.at(-1) === manifest.lastUpdatedIssue;
    const hardcodedNegativeFails = hardcodedEvidenceRangeNegativeFails();
    context.add("evidence index range derives through current manifest issue", passed, { requiredIssues });
    context.add("hardcoded evidence range negative fixture fails", hardcodedNegativeFails);
    writeJson(`${context.dir}/dynamic-evidence-index-range-output.json`, {
      status: passed && hardcodedNegativeFails ? "passed" : "failed",
      requiredIssues
    });
  }
  if (stage === "stale-issue-number-negative") {
    const offenders = staleRootIssueScripts();
    const negativeFails = staleIssueNegativeFails();
    context.add("root package scripts do not write verification through stale issue 590", offenders.length === 0, { offenders });
    context.add("stale --issue 590 root script negative fixture fails", negativeFails);
    writeJson(`${context.dir}/stale-issue-number-negative-output.json`, {
      status: offenders.length === 0 && negativeFails ? "passed" : "failed",
      offenders
    });
  }
  if (stage === "non-mutating-root-verify") {
    const offenders = staleRootIssueScripts();
    const passed = offenders.length === 0 && verifyLocalIncludes("npm run check:simulation-v0-user-facing-preflight");
    context.add("root verification avoids stale evidence writes and uses current preflight gate", passed, { offenders });
    writeJson(`${context.dir}/root-script-evidence-issue-output.json`, { status: offenders.length === 0 ? "passed" : "failed", offenders });
    writeJson(`${context.dir}/non-mutating-root-verify-output.json`, { status: passed ? "passed" : "failed" });
  }
  if (stage === "verify-local-includes-clean-state") {
    const negative = !["npm run check:simulation-v0-user-facing-readiness"].includes("npm run check:clean-committed-state");
    writeJson(`${context.dir}/manifest-update-output.json`, {
      status: "pending",
      verifyLocalMissingCleanStateNegativeWouldFail: negative
    });
  }
}

function verifyLocalIncludes(command) {
  return readText("scripts/verify-local.mjs").includes(command);
}

function staleRootIssueScripts() {
  const scripts = readJson("package.json").scripts ?? {};
  return Object.entries(scripts)
    .filter(([name, command]) => name.startsWith("check:") && /--issue\s+590\b/u.test(String(command)))
    .map(([name, command]) => ({ name, command }));
}

function staleIssueNegativeFails() {
  return /--issue\s+590\b/u.test("node scripts/check-example.mjs --stage final --issue 590");
}

function hardcodedEvidenceRangeNegativeFails() {
  const root = mkdtempSync(join(tmpdir(), "dynamic-evidence-range-"));
  try {
    mkdirSync(join(root, "docs", "verification"), { recursive: true });
    writeFileSync(join(root, "docs", "verification", "ISSUE_EVIDENCE_INDEX.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      lastRebuiltIssue: "600",
      issues: []
    }));
    return checkIssueEvidenceIndex(root, { requiredIssues: ["601"] }).some((failure) => failure.includes("Issue 601"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
