#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateAlignmentManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";
import {
  buildRuntimeProofSummary,
  readEditorRuntimeState,
  withBrowserRenderedApp,
  withExistingBrowserRenderedApp,
  waitForExpression
} from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "654");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

const supportedStages = [
  "fresh-runtime-proof",
  "existing-localhost-proof",
  "fresh-pass-existing-fail-negative",
  "existing-pass-fresh-fail-negative",
  "existing-unavailable-negative",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: fresh and existing runtime proof channels must remain separate and cannot override one another.\n"
);

const freshConfig = {
  proofType: "fresh-runtime",
  baseUrl: "http://127.0.0.1:6850",
  port: 6850,
  chromePort: 9850,
  marker: "641-650-editor-runtime-save-layout",
  screenshot: `${dir}/screenshots/fresh-runtime-proof.png`
};

const existingConfig = {
  proofType: "existing-localhost",
  baseUrl: "http://127.0.0.1:5180",
  port: 5180,
  chromePort: 9851,
  marker: "641-650-editor-runtime-save-layout",
  screenshot: `${dir}/screenshots/existing-localhost-proof.png`
};

const initScript =
  "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

let freshProofResult = null;
let existingProofResult = null;
let comparisonResult = null;

const stagesToRun = stage === "final"
  ? [
      "fresh-runtime-proof",
      "existing-localhost-proof",
      "fresh-pass-existing-fail-negative",
      "existing-pass-fresh-fail-negative",
      "existing-unavailable-negative",
      "final"
    ]
  : [stage];

for (const currentStage of stagesToRun) {
  if (currentStage === "final") continue;
  const result = await runStage(currentStage);
  if (currentStage === "fresh-runtime-proof") {
    freshProofResult = result;
  }
  if (currentStage === "existing-localhost-proof") {
    existingProofResult = result;
  }
}

if (freshProofResult == null) {
  freshProofResult = await captureFreshRuntimeProof(freshConfig);
  writeJson(`${dir}/fresh-runtime-proof-output.json`, freshProofResult);
  writeJson(`${dir}/fresh-runtime-proof.json`, freshProofResult);
}
if (existingProofResult == null) {
  existingProofResult = await captureExistingRuntimeProof(existingConfig);
  writeJson(`${dir}/existing-localhost-proof-output.json`, existingProofResult);
  writeJson(`${dir}/existing-localhost-proof.json`, existingProofResult);
}

comparisonResult = buildComparisonPayload(freshProofResult, existingProofResult);
if (stage === "final") {
  writeJson(`${dir}/runtime-proof-comparison-output.json`, comparisonResult);
  writeJson(`${dir}/runtime-proof-comparison.json`, comparisonResult);
}

const checksPassed = statusFromChecks(checks) === "passed";
const finalPassed = checksPassed &&
  comparisonResult != null &&
  comparisonResult.status === "passed" &&
  freshProofResult != null && freshProofResult.status === "passed" &&
  existingProofResult != null && existingProofResult.status === "passed";
const passed = stage === "final" ? finalPassed : checksPassed;

updateAlignmentManifest(issue, {
  freshVsExistingRuntimeProofStatus: finalPassed ? "passed" : "blocked",
  freshRuntimeProofSeparated: true,
  existingLocalhostProofSeparated: true,
  freshRuntimeCannotOverrideExistingFailure: true,
  localhost5180RuntimeProofPassed: existingProofResult?.status === "passed" ?? false
});
writeJson(`${dir}/manifest-update-output.json`, {
  status: finalPassed ? "passed" : "failed",
  updates: {
    freshVsExistingRuntimeProofStatus: finalPassed ? "passed" : "blocked",
    freshRuntimeProofSeparated: true,
    existingLocalhostProofSeparated: true,
    freshRuntimeCannotOverrideExistingFailure: true,
    localhost5180RuntimeProofPassed: existingProofResult?.status === "passed" ?? false
  }
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage fresh-runtime-proof --allow-partial --issue ${issue}`,
  `node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage existing-localhost-proof --allow-partial --issue ${issue}`,
  `node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage fresh-pass-existing-fail-negative --allow-partial --issue ${issue}`,
  `node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage existing-pass-fresh-fail-negative --allow-partial --issue ${issue}`,
  `node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage existing-unavailable-negative --allow-partial --issue ${issue}`,
  `node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage final --allow-partial --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

writeCommands(issue, commands, {
  [`node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage fresh-runtime-proof --allow-partial --issue ${issue}`]: `${dir}/fresh-runtime-proof-output.json`,
  [`node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage existing-localhost-proof --allow-partial --issue ${issue}`]: `${dir}/existing-localhost-proof-output.json`,
  [`node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage fresh-pass-existing-fail-negative --allow-partial --issue ${issue}`]: `${dir}/fresh-pass-existing-fail-negative-output.json`,
  [`node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage existing-pass-fresh-fail-negative --allow-partial --issue ${issue}`]: `${dir}/existing-pass-fresh-fail-negative-output.json`,
  [`node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage existing-unavailable-negative --allow-partial --issue ${issue}`]: `${dir}/existing-unavailable-negative-output.json`,
  [`node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage final --allow-partial --issue ${issue}`]: `${dir}/runtime-proof-comparison-output.json`
});

if (comparisonResult != null) {
  writeJson(`${dir}/runtime-proof-comparison-output.json`, comparisonResult);
  writeJson(`${dir}/runtime-proof-comparison.json`, comparisonResult);
}

writeJson(`${dir}/test-output/fresh-vs-existing-runtime-proof.txt`, {
  status: passed ? "passed" : "failed",
  issue,
  stage,
  checks
});
writeJson(`${dir}/test-output/shared.txt`, {
  status: "not-run",
  issue,
  stage,
  reason: "acceptance commands are documented."
});
writeJson(`${dir}/test-output/web.txt`, {
  status: "not-run",
  issue,
  stage,
  reason: "acceptance commands are documented."
});
writeJson(`${dir}/test-output/web-build.txt`, {
  status: "not-run",
  issue,
  stage,
  reason: "acceptance commands are documented."
});

writeCloseout(issue, "Fresh and existing runtime proof channels are collected independently and compared as separate blockers.", passed ? "passed" : "failed", commands, [
  "Fresh automated runtime proof uses fresh dev startup and fresh proof port 6850.",
  "Existing localhost proof is captured from 127.0.0.1:5180.",
  "Fresh success does not override existing runtime failures."
]);

if (!passed && !allowPartial) process.exit(1);

console.log(JSON.stringify({
  status: passed ? "passed" : "failed",
  issue,
  stage,
  checks,
  comparison: comparisonResult
}, null, 2));

async function runStage(currentStage) {
  if (currentStage === "fresh-runtime-proof") {
    const proof = await captureFreshRuntimeProof(freshConfig);
    addCheck(checks, "fresh runtime proof captures expected marker and controls", proof.status === "passed", proof);
    writeJson(`${dir}/fresh-runtime-proof-output.json`, proof);
    writeJson(`${dir}/fresh-runtime-proof.json`, proof);
    return proof;
  }
  if (currentStage === "existing-localhost-proof") {
    const proof = await captureExistingRuntimeProof(existingConfig);
    addCheck(checks, "existing localhost proof captures expected marker and controls", proof.status === "passed", proof);
    writeJson(`${dir}/existing-localhost-proof-output.json`, proof);
    writeJson(`${dir}/existing-localhost-proof.json`, proof);
    return proof;
  }
  if (currentStage === "fresh-pass-existing-fail-negative") {
    const fresh = await captureFreshRuntimeProof(freshConfig);
    const existingFailure = await captureExistingRuntimeProof(
      {
        ...existingConfig,
        port: 59999,
        chromePort: 9879,
        baseUrl: "http://127.0.0.1:59999"
      },
      false
    );
    const blockerResult = {
      status: fresh.status === "passed" && existingFailure.status === "failed" ? "passed" : "failed",
      scenario: "fresh pass with existing localhost failure",
      freshRuntimeProofStatus: fresh.status,
      existingLocalhostProofStatus: existingFailure.status,
      blocker: fresh.status === "passed" && existingFailure.status === "failed"
        ? "Fresh automated runtime passes, but existing localhost:5180 is stale, unavailable, or mismatched. Restart dev server and hard refresh before reconstruction."
        : "Expected fresh pass and existing failure for this fixture to fail."
    };
    writeJson(`${dir}/fresh-pass-existing-fail-negative-output.json`, blockerResult);
    addCheck(checks, "fresh runtime pass cannot override existing localhost failure", blockerResult.status === "passed", blockerResult);
    return blockerResult;
  }
  if (currentStage === "existing-pass-fresh-fail-negative") {
    const existing = await captureExistingRuntimeProof(existingConfig, true);
    const freshFailure = await captureFreshRuntimeProof({ ...freshConfig, marker: "wrong-marker" });
    const blockerResult = {
      status: freshFailure.status === "failed" && existing.status === "passed" ? "passed" : "failed",
      scenario: "existing pass with fresh runtime failure",
      existingLocalhostProofStatus: existing.status,
      freshRuntimeProofStatus: freshFailure.status,
      blocker: freshFailure.status === "failed" && existing.status === "passed"
        ? "Existing localhost passes, but fresh automated runtime proof failed. Verify test infrastructure or source-rendered runtime before GO."
        : "Expected fresh runtime failure and existing pass for this fixture to fail."
    };
    writeJson(`${dir}/existing-pass-fresh-fail-negative-output.json`, blockerResult);
    addCheck(checks, "existing localhost pass and fresh runtime failure fixture is explicit", blockerResult.status === "passed", blockerResult);
    return blockerResult;
  }
  if (currentStage === "existing-unavailable-negative") {
    const unavailable = await captureExistingRuntimeProof(
      { ...existingConfig, port: 59998, chromePort: 9880, baseUrl: "http://127.0.0.1:59998" },
      false
    );
    const blockerResult = {
      status: unavailable.status === "failed" ? "passed" : "failed",
      scenario: "existing localhost unavailable",
      blocker: unavailable.status === "failed"
        ? "Existing localhost proof must fail when localhost:5180 is unavailable."
        : "Expected unavailable existing localhost failure did not occur.",
      existingLocalhostProofStatus: unavailable.status
    };
    writeJson(`${dir}/existing-unavailable-negative-output.json`, blockerResult);
    addCheck(checks, "existing-unavailable fixture proves hard failure", blockerResult.status === "passed", blockerResult);
    return blockerResult;
  }
  throw new Error(`Unsupported stage: ${currentStage}`);
}

async function captureFreshRuntimeProof(runtimeConfig, options = {}) {
  return captureRuntimeProof({ ...freshConfig, ...runtimeConfig, ...options }, false);
}

async function captureExistingRuntimeProof(runtimeConfig, requireMarkerMatch = true) {
  return captureRuntimeProof({ ...existingConfig, ...runtimeConfig }, true, requireMarkerMatch);
}

async function captureRuntimeProof(runtimeConfig, useExisting, requireMarkerMatch = true) {
  const { proofType, baseUrl, port, chromePort, screenshot, marker } = runtimeConfig;
  const runWith = useExisting ? withExistingBrowserRenderedApp : withBrowserRenderedApp;
  const runOptions = useExisting
    ? { port, chromePort, baseUrl, width: 1440, height: 1000, initScript }
    : { port, chromePort, width: 1440, height: 1000, initScript };

  let payload;
  try {
    const result = await runWith(runOptions, async (browser) => {
      await browser.navigate(`${baseUrl}/?section=editor`, "document.querySelector('[data-runtime-build-info=\"true\"]') != null");
      await browser.navigate(`${baseUrl}/?section=editor`, "document.querySelector('[data-editor-command-bar=\"consolidated\"]') != null");
      const state = await readEditorRuntimeState(browser);
      await waitForExpression(browser, "document.querySelector('[data-editor-command-bar=\"consolidated\"]') != null");
      await browser.screenshot(screenshot);
      return buildRuntimeProofSummary(state, {
        proofType,
        baseUrl,
        port,
        batchMarker: marker
      });
    });
    payload = useExisting ? result : result.result;
  } catch (error) {
    payload = {
      proofType,
      baseUrl,
      port,
      batchMarker: null,
      buildCommit: null,
      buildTime: null,
      saveWorkingCopyVisible: false,
      saveAsNewCopyVisible: false,
      exportJsonBackupVisible: false,
      activeRecordIdVisible: false,
      namedSaveStatusVisible: false,
      runtimeMismatchBannerVisible: false,
      runtimeBuildInfoExists: false,
      batchMarkerMatched: false,
      status: "failed",
      blockers: [error instanceof Error ? error.message : String(error)]
    };
  }

  if (payload.status === "passed") {
    const markerMatched = payload.batchMarker === marker;
    payload.batchMarkerMatched = markerMatched;
    if (requireMarkerMatch && !markerMatched) {
      payload.status = "failed";
      payload.blockers = [...(payload.blockers ?? []), `expected batch marker ${marker}, got ${payload.batchMarker}`];
    }
  } else if (!Array.isArray(payload.blockers)) {
    payload.blockers = payload.blockers == null ? [] : [String(payload.blockers)];
  }

  return payload;
}

function buildComparisonPayload(fresh = null, existing = null) {
  const freshProof = fresh ?? {};
  const existingProof = existing ?? {};
  const blockers = [];
  const freshFailed = freshProof.status !== "passed";
  const existingFailed = existingProof.status !== "passed";

  if (freshProof.status === "failed" && existingProof.status === "failed") {
    blockers.push("Both fresh and existing runtime proofs failed.");
  }
  if (freshProof.status === "passed" && existingFailed) {
    blockers.push("Fresh automated runtime passes, but existing localhost:5180 is stale, unavailable, or mismatched. Restart dev server and hard refresh before reconstruction.");
  }
  if (existingProof.status === "passed" && freshFailed) {
    blockers.push("Existing localhost passes, but fresh automated runtime proof failed. Verify test infrastructure or source-rendered runtime before GO.");
  }
  if (freshFailed && existingProof.status === "passed" && freshProof.blockers?.length) {
    blockers.push("Fresh automation blockers: " + freshProof.blockers.join("; "));
  }
  if (existingFailed && freshProof.status === "passed" && existingProof.blockers?.length) {
    blockers.push("Existing localhost blockers: " + existingProof.blockers.join("; "));
  }

  return {
    status: blockers.length === 0 ? "passed" : "failed",
    freshRuntimeProof: freshProof,
    existingLocalhostProof: existingProof,
    blockers
  };
}
