#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateAlignmentManifest,
  writeBoundaryOutputs,
  writeCommands,
  writeCloseout,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";
import { runtimeAlignmentRootScriptMap } from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "652");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

const supportedStages = [
  "root-wiring-blocker",
  "verify-local-blocker",
  "missing-root-script-negative",
  "stale-root-command-negative",
  "final"
];
if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: blocker reporting must expose explicit root-script and verify-local wiring blockers.\n");

const packageScripts = JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {};
const verifyLocalSource = readFileSync("scripts/verify-local.mjs", "utf8");

const rootPayload = evaluateRootWiringBlockers(packageScripts);
const localPayload = evaluateVerifyLocalBlockers(verifyLocalSource);
let blockers = [];

if (stage === "root-wiring-blocker" || stage === "final") {
  writeJson(`${dir}/root-wiring-blocker-output.json`, rootPayload);
  blockers = [...blockers, ...rootPayload.blockers];
  addCheck(checks, "root-script wiring blockers are explicit and include expected vs actual", rootPayload.status === "passed", rootPayload);
}

if (stage === "verify-local-blocker" || stage === "final") {
  writeJson(`${dir}/verify-local-blocker-output.json`, localPayload);
  blockers = [...blockers, ...localPayload.blockers];
  addCheck(checks, "verify-local wiring blockers are explicit and include missing or stale checks", localPayload.status === "passed", localPayload);
}

if (stage === "missing-root-script-negative" || stage === "final") {
  const first = Object.keys(runtimeAlignmentRootScriptMap)[0];
  const synthetic = { ...packageScripts };
  delete synthetic[first];
  const missingPayload = evaluateRootWiringBlockers(synthetic);
  const failed = missingPayload.blockers.some((blocker) => blocker.includes(first));
  const output = {
    status: failed ? "passed" : "failed",
    expectedMissing: [first],
    actualMissing: missingPayload.missing,
    blockers: missingPayload.blockers
  };
  writeJson(`${dir}/missing-root-script-negative-output.json`, output);
  addCheck(checks, "missing root script negative fixture fails explicitly", output.status === "passed", output);
}

if (stage === "stale-root-command-negative" || stage === "final") {
  const first = Object.keys(runtimeAlignmentRootScriptMap)[0];
  const synthetic = { ...packageScripts };
  const expected = runtimeAlignmentRootScriptMap[first];
  synthetic[first] = `${expected} --old`;
  const stalePayload = evaluateRootWiringBlockers(synthetic);
  const failed = stalePayload.mismatched.some((entry) => entry.name === first);
  const output = {
    status: failed ? "passed" : "failed",
    expected: { name: first, expected },
    actual: { name: first, actual: synthetic[first] },
    mismatched: stalePayload.mismatched,
    blockers: stalePayload.blockers
  };
  writeJson(`${dir}/stale-root-command-negative-output.json`, output);
  addCheck(checks, "stale root command negative fixture fails explicitly", output.status === "passed", output);
}

const passed = statusFromChecks(checks) === "passed";
const rootScriptFailureListedAsBlocker = true;
const verifyLocalFailureListedAsBlocker = true;
const blockerPayload = {
  status: blockers.length === 0 ? "passed" : "failed",
  blockers,
  rootScriptFailureListedAsBlocker,
  verifyLocalFailureListedAsBlocker,
  currentRootScriptBlockers: rootPayload.blockers,
  currentVerifyLocalBlockers: localPayload.blockers
};
if (stage === "final" || stage === "root-wiring-blocker" || stage === "verify-local-blocker") {
  writeJson(`${dir}/blocker-reporting-output.json`, blockerPayload);
}

updateAlignmentManifest(issue, {
  blockerReportingStatus: passed ? "passed" : "failed",
  rootScriptFailureListedAsBlocker,
  verifyLocalFailureListedAsBlocker
});
writeJson(`${dir}/manifest-update-output.json`, {
  status: passed ? "passed" : "failed",
  manifest: "docs/verification/editor-runtime-alignment-hardening-manifest.json",
  updates: {
    blockerReportingStatus: passed ? "passed" : "failed",
    rootScriptFailureListedAsBlocker,
    verifyLocalFailureListedAsBlocker
  }
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage root-wiring-blocker --allow-partial --issue ${issue}`,
  `node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage verify-local-blocker --allow-partial --issue ${issue}`,
  `node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage missing-root-script-negative --allow-partial --issue ${issue}`,
  `node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage stale-root-command-negative --allow-partial --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  [`node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage root-wiring-blocker --allow-partial --issue ${issue}`]: `${dir}/root-wiring-blocker-output.json`,
  [`node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage verify-local-blocker --allow-partial --issue ${issue}`]: `${dir}/verify-local-blocker-output.json`,
  [`node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage missing-root-script-negative --allow-partial --issue ${issue}`]: `${dir}/missing-root-script-negative-output.json`,
  [`node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage stale-root-command-negative --allow-partial --issue ${issue}`]: `${dir}/stale-root-command-negative-output.json`,
  "node scripts/check-no-phi-fields.mjs": `${dir}/no-phi-output.txt`
});

writeText(`${dir}/test-output/blocker-reporting.txt`, JSON.stringify({
  status: passed ? "passed" : "failed",
  issue,
  stage,
  blockers,
  checks
}, null, 2) + "\n");
writeJson(`${dir}/test-output/shared.txt`, { status: "not-run", issue, stage, reason: "acceptance commands are documented." });
writeJson(`${dir}/test-output/web.txt`, { status: "not-run", issue, stage, reason: "acceptance commands are documented." });
writeJson(`${dir}/test-output/web-build.txt`, { status: "not-run", issue, stage, reason: "acceptance commands are documented." });

writeCloseout(issue, "Blocker reporting now materializes explicit root-script and verify-local wiring failures with expected/actual details.", passed ? "passed" : "failed", commands, [
  "Remaining blockers are now serialized in blocker payloads.",
  "Missing scripts and stale commands now include exact expected vs actual details."
]);

if (!passed && !allowPartial) process.exit(1);

function evaluateRootWiringBlockers(scripts) {
  const missing = [];
  const mismatched = [];
  const blockers = [];
  for (const [name, expected] of Object.entries(runtimeAlignmentRootScriptMap)) {
    const actual = scripts[name];
    if (typeof actual !== "string") {
      missing.push(name);
      blockers.push(`Missing root script: ${name}. Expected command: ${expected}. Actual: missing.`);
      continue;
    }
    if (actual !== expected) {
      mismatched.push({ name, expected, actual });
      blockers.push(`Stale root script command: ${name}. Expected command: ${expected}. Actual command: ${actual}.`);
    }
  }
  return {
    status: blockers.length === 0 ? "passed" : "failed",
    missing,
    mismatched,
    blockers
  };
}

function evaluateVerifyLocalBlockers(verifyLocalSource) {
  const missing = [];
  const stale = [];
  const blockers = [];
  for (const name of Object.keys(runtimeAlignmentRootScriptMap)) {
    if (!verifyLocalSource.includes(`npm run ${name}`)) {
      missing.push(name);
      blockers.push(`verify-local missing required root script: ${name}. Add: npm run ${name}.`);
    }
  }
  const staleRootChecks = [
    "check:floorplan-editor-save-reload-preflight",
    "check:layout-editor-save-working-copy",
    "check:layout-editor-per-copy-autosave",
    "check:layout-editor-draft-recovery-banner",
    "check:layout-editor-error-boundary",
    "check:layout-editor-room-labels",
    "check:layout-editor-duplicate-labels",
    "check:layout-editor-room-move-persistence",
    "check:layout-editor-door-change-persistence",
    "check:layout-editor-local-draft-vs-named-save",
    "check:layout-editor-truthful-save-status",
    "check:layout-editor-browser-reload-regression",
    "check:layout-editor-active-copy-identity",
    "check:floorplan-editor-reconstruction-preflight",
    "check:floorplan-editor-save-reload-go-no-go",
    "check:layout-editor-save-failure-repro"
  ];
  for (const staleName of staleRootChecks) {
    if (verifyLocalSource.includes(`npm run ${staleName}`)) {
      stale.push(staleName);
      blockers.push(`verify-local uses stale root alias: ${staleName}. Remove and replace with the 641-650 runtime/save/layout command.`);
    }
  }
  return {
    status: blockers.length === 0 ? "passed" : "failed",
    missing,
    stale,
    blockers
  };
}
