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
  writeText
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";
import { runtimeAlignmentRootScriptMap } from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "651");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

const supportedStages = [
  "package-scripts",
  "verify-local-wiring",
  "missing-root-script-negative",
  "stale-command-negative",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeText(`${dir}/first-failure.txt`, "Failure class: 641-650 root scripts for runtime/save/layout gates are missing, drifted, or not wired into verify-local.\n");

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageScripts = packageJson.scripts ?? {};
const verifyLocal = readFileSync("scripts/verify-local.mjs", "utf8");

const staleRootScripts = [
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

const packageScriptsResult = evaluatePackageRootScripts(packageScripts);
const verifyLocalResult = evaluateVerifyLocalScripts(verifyLocal);

const stageResult = runStage(stage);
const rootScriptsOutput = stageResult.packageScripts || packageScriptsResult;
const verifyLocalOutput = stageResult.verifyLocalScripts || verifyLocalResult;

const blockers = [
  ...rootScriptsOutput.blockers,
  ...verifyLocalOutput.blockers
];
const passed = statusFromChecks(checks) === "passed";

updateAlignmentManifest(issue, {
  rootScriptWiringStatus: passed ? "passed" : "failed",
  rootScripts641To650Present: packageScriptsResult.present,
  verifyLocalIncludes641To650: verifyLocalResult.present,
  rootScriptFailureListedAsBlocker: !packageScriptsResult.present,
  verifyLocalFailureListedAsBlocker: !verifyLocalResult.present
});

writeJson(`${dir}/manifest-update-output.json`, {
  status: passed ? "passed" : "failed",
  updates: {
    rootScriptWiringStatus: passed ? "passed" : "failed",
    rootScripts641To650Present: packageScriptsResult.present,
    verifyLocalIncludes641To650: verifyLocalResult.present,
    rootScriptFailureListedAsBlocker: !packageScriptsResult.present,
    verifyLocalFailureListedAsBlocker: !verifyLocalResult.present
  }
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage package-scripts --allow-partial --issue ${issue}`,
  `node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage verify-local-wiring --allow-partial --issue ${issue}`,
  `node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage missing-root-script-negative --allow-partial --issue ${issue}`,
  `node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage stale-command-negative --allow-partial --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

writeCommands(issue, commands, {
  [`node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage package-scripts --allow-partial --issue ${issue}`]:
    `${dir}/package-root-script-output.json`,
  [`node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage verify-local-wiring --allow-partial --issue ${issue}`]:
    `${dir}/verify-local-wiring-output.json`,
  [`node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage missing-root-script-negative --allow-partial --issue ${issue}`]:
    `${dir}/missing-root-script-negative-output.json`,
  [`node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage stale-command-negative --allow-partial --issue ${issue}`]:
    `${dir}/stale-command-negative-output.json`
});

writeText(`${dir}/test-output/root-wiring.txt`, JSON.stringify({
  status: passed ? "passed" : "failed",
  issue,
  stage,
  blockers,
  checks
}, null, 2) + "\n");
writeJson(`${dir}/test-output/shared.txt`, { status: "not-run", issue, stage, reason: "acceptance commands are documented." });
writeJson(`${dir}/test-output/web.txt`, { status: "not-run", issue, stage, reason: "acceptance commands are documented." });
writeJson(`${dir}/test-output/web-build.txt`, { status: "not-run", issue, stage, reason: "acceptance commands are documented." });
writeCloseout(
  issue,
  "Root script wiring and verify-local wiring for 641-650 runtime/save/layout gates are explicit and exact.",
  passed ? "passed" : "failed",
  commands,
  [
    "Root scripts must be present in package.json with expected commands.",
    "verify-local must call all 10 required root scripts and not call stale 631-640 aliases."
  ]
);

if (!passed && !allowPartial) process.exit(1);

function runStage(currentStage) {
if (currentStage === "package-scripts" || currentStage === "final") {
    runPackageScripts();
  }
  if (currentStage === "verify-local-wiring" || currentStage === "final") {
    runVerifyLocalWiring();
  }
  if (currentStage === "missing-root-script-negative" || currentStage === "final") {
    runMissingRootScriptNegative();
  }
  if (currentStage === "stale-command-negative" || currentStage === "final") {
    runStaleCommandNegative();
  }
  return {
    status: statusFromChecks(checks) === "passed" ? "passed" : "failed",
    packageScripts: packageScriptsResult,
    verifyLocalScripts: verifyLocalResult
  };
}

function runPackageScripts() {
  const payload = {
    ...packageScriptsResult,
    required: Object.keys(runtimeAlignmentRootScriptMap),
    blockers: packageScriptsResult.blockers
  };
  writeJson(`${dir}/package-root-script-output.json`, payload);
  addCheck(
    checks,
    "all 641-650 runtime/save/layout root scripts exist with exact expected commands",
    packageScriptsResult.present,
    packageScriptsResult
  );
}

function runVerifyLocalWiring() {
  const payload = {
    ...verifyLocalResult,
    required: Object.keys(runtimeAlignmentRootScriptMap),
    stale: staleRootScripts.filter((script) => verifyLocal.includes(`npm run ${script}`)),
    blockers: verifyLocalResult.blockers
  };
  writeJson(`${dir}/verify-local-wiring-output.json`, payload);
  addCheck(
    checks,
    "verify-local includes all 641-650 root checks and excludes stale 631-640 script aliases",
    verifyLocalResult.present && payload.stale.length === 0,
    payload
  );
}

function runMissingRootScriptNegative() {
  const first = Object.keys(runtimeAlignmentRootScriptMap)[0];
  const syntheticScripts = { ...packageScripts };
  delete syntheticScripts[first];
  const result = evaluatePackageRootScripts(syntheticScripts);
  const status = !result.present && result.missing.includes(first);
  writeJson(`${dir}/missing-root-script-negative-output.json`, {
    status: status ? "passed" : "failed",
    expected: first,
    expectedMissing: [first],
    actualMissing: result.missing,
    blockers: result.blockers
  });
  if (stage === "final") {
    addCheck(checks, "missing root script negative fixture fails as expected", status, result);
  }
}

function runStaleCommandNegative() {
  const first = Object.keys(runtimeAlignmentRootScriptMap)[0];
  const expected = runtimeAlignmentRootScriptMap[first];
  const syntheticScripts = { ...packageScripts };
  syntheticScripts[first] = `${expected} --allow-partial`;
  const result = evaluatePackageRootScripts(syntheticScripts);
  const failed = !result.present && result.mismatched.some((entry) => entry.name === first);
  writeJson(`${dir}/stale-command-negative-output.json`, {
    status: failed ? "passed" : "failed",
    expected: { name: first, command: expected },
    actual: { name: first, command: syntheticScripts[first] },
    mismatched: result.mismatched,
    blockers: result.blockers
  });
  if (stage === "final") {
    addCheck(checks, "stale command variant negative fixture fails as expected", failed, result);
  }
}

function evaluatePackageRootScripts(scripts) {
  const missing = [];
  const mismatched = [];
  for (const [scriptName, expectedCommand] of Object.entries(runtimeAlignmentRootScriptMap)) {
    const actualCommand = scripts[scriptName];
    if (typeof actualCommand !== "string") {
      missing.push(scriptName);
      continue;
    }
    if (actualCommand !== expectedCommand) {
      mismatched.push({ name: scriptName, expected: expectedCommand, actual: actualCommand });
    }
  }
  return {
    present: missing.length === 0 && mismatched.length === 0,
    missing,
    mismatched,
    blockers: [
      ...missing.map((name) => `Missing root script: ${name}`),
      ...mismatched.map((entry) => `Expected command for ${entry.name}: ${entry.expected}. Actual: ${entry.actual}`)
    ]
  };
}

function evaluateVerifyLocalScripts(source) {
  const missing = [];
  for (const scriptName of Object.keys(runtimeAlignmentRootScriptMap)) {
    if (!source.includes(`npm run ${scriptName}`)) {
      missing.push(scriptName);
    }
  }
  const stale = staleRootScripts.filter((scriptName) => source.includes(`npm run ${scriptName}`));
  return {
    present: missing.length === 0 && stale.length === 0,
    missing,
    stale,
    blockers: [
      ...missing.map((name) => `verify-local missing required script: ${name}`),
      ...stale.map((name) => `verify-local still calls stale script alias: ${name}`)
    ]
  };
}
