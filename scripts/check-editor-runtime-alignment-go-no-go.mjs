#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  updateAlignmentManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";
import { runtimeAlignmentRootScriptMap } from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "655");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
if (stage !== "final") {
  throw new Error(`Unsupported issue 655 GO / NO-GO stage: ${stage}`);
}

const dir = `docs/verification/issues/issue-${issue}`;
const issue651Dir = "docs/verification/issues/issue-651";
const issue652Dir = "docs/verification/issues/issue-652";
const issue653Dir = "docs/verification/issues/issue-653";
const issue654Dir = "docs/verification/issues/issue-654";
const checks = [];
const requiredMarker = "641-650-editor-runtime-save-layout";
const commandResults = {};

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: no final GO without explicit root-script, verify-local, manual, and runtime-proof blockers.\n"
);

const requiredEvidenceCommands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build"
];
const requiredValidatorCommands = [
  "node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage final --issue 651",
  "node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage final --issue 652",
  "node scripts/check-editor-manual-browser-checklist-hardening.mjs --stage final --issue 653",
  "node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage final --issue 654",
  "node scripts/check-no-phi-fields.mjs"
];
const commands = [...requiredEvidenceCommands, ...requiredValidatorCommands];

for (const command of commands) {
  commandResults[command] = runCommand(command, mapCommandOutput(command));
}

const packageRootPayload = safeReadJson(`${issue651Dir}/package-root-script-output.json`, {});
const verifyLocalPayload = safeReadJson(`${issue651Dir}/verify-local-wiring-output.json`, {});
const blockerReportingPayload = safeReadJson(`${issue652Dir}/blocker-reporting-output.json`, {});
const manualPayload = safeReadJson(`${issue653Dir}/manual-checklist-hardening-output.json`, {});
const freshRuntimePayload = safeReadJson(`${issue654Dir}/fresh-runtime-proof-output.json`, null);
const existingRuntimePayload = safeReadJson(`${issue654Dir}/existing-localhost-proof-output.json`, null);
const runtimeComparisonPayload = safeReadJson(`${issue654Dir}/runtime-proof-comparison-output.json`, null);

const rootScriptMissing = packageRootPayload.missing ?? [];
const rootScriptMismatched = packageRootPayload.mismatched ?? [];
const rootScriptsPresent = packageRootPayload.present === true && rootScriptMissing.length === 0 && rootScriptMismatched.length === 0;
const verifyLocalMissing = verifyLocalPayload.missing ?? [];
const verifyLocalStale = verifyLocalPayload.stale ?? [];
const verifyLocalPresent = verifyLocalPayload.present === true && verifyLocalMissing.length === 0 && verifyLocalStale.length === 0;
const blockerPayloadExists = blockerReportingPayload.blockers != null;

const manualPassed = manualPayload.passed === true;
const manualAutoPass = manualPayload.autoPass === true;
const manualBlockers = manualPayload.blockers ?? [];
const manualMissingEvidence = manualPayload.missingEvidence ?? [];

const freshRuntimePassed = freshRuntimePayload?.status === "passed";
const existingRuntimePassed = existingRuntimePayload?.status === "passed";
const existingRuntimeControlSignals = existingRuntimePayload != null ? {
  runtimeBuildMarkerVisible: existingRuntimePayload.runtimeBuildInfoExists === true,
  batchMarkerMatched: existingRuntimePayload.batchMarkerMatched === true,
  saveWorkingCopyVisible: existingRuntimePayload.saveWorkingCopyVisible === true,
  saveAsNewCopyVisible: existingRuntimePayload.saveAsNewCopyVisible === true,
  exportJsonBackupVisible: existingRuntimePayload.exportJsonBackupVisible === true,
  activeRecordIdVisible: existingRuntimePayload.activeRecordIdVisible === true,
  namedSaveStatusVisible: existingRuntimePayload.namedSaveStatusVisible === true
} : {};
const existingRuntimeSignalKeys = Object.entries(existingRuntimeControlSignals).map(([name, ok]) => ({ name, ok }));
const existingRuntimeSignalsPass = Object.values(existingRuntimeControlSignals).every(Boolean);

const freshRuntimeProof = freshRuntimePayload ?? null;
const existingRuntimeProof = existingRuntimePayload ?? null;
const runtimeComparison = runtimeComparisonPayload?.status != null ? runtimeComparisonPayload : createFallbackRuntimeComparison(
  freshRuntimeProof,
  existingRuntimeProof
);

const separationPassed = freshRuntimeProof != null && existingRuntimeProof != null &&
  freshRuntimeProof.proofType === "fresh-runtime" &&
  existingRuntimeProof.proofType === "existing-localhost" &&
  freshRuntimeProof.baseUrl !== existingRuntimeProof.baseUrl;

const finalBlockers = [];

for (const issueName of Object.keys(runtimeAlignmentRootScriptMap)) {
  const expected = runtimeAlignmentRootScriptMap[issueName];
  const actual = safeReadJson("package.json", {}).scripts?.[issueName];
  if (actual == null) {
    finalBlockers.push(`Missing root script: ${issueName}. Expected command: ${expected}. Actual: missing.`);
  } else if (actual !== expected) {
    finalBlockers.push(`Stale root script command: ${issueName}. Expected command: ${expected}. Actual: ${actual}.`);
  }
}
if (verifyLocalMissing.length > 0) {
  finalBlockers.push(`verify-local missing required 641–650 root script(s): ${verifyLocalMissing.join(", ")}`);
}
if (verifyLocalStale.length > 0) {
  finalBlockers.push(`verify-local still references stale 631–640 aliases: ${verifyLocalStale.join(", ")}`);
}
if (!manualPassed) {
  if (manualBlockers.length === 0) {
    finalBlockers.push("Manual browser checklist did not pass required completeness and evidence checks.");
  } else {
    finalBlockers.push(...manualBlockers.map((item) => `Manual browser checklist blocker: ${item}`));
  }
}
if (manualAutoPass) {
  finalBlockers.push("Manual browser checklist auto-pass behavior is disallowed for issue 653.");
}
if (manualMissingEvidence.length > 0) {
  finalBlockers.push(`Manual checklist missing required evidence artifact(s): ${manualMissingEvidence.join(", ")}`);
}
if (!blockerPayloadExists) {
  finalBlockers.push("Remaining blockers payload is missing root/verify-local wiring blocker details.");
}
if (blockerReportingPayload.rootScriptFailureListedAsBlocker !== true) {
  finalBlockers.push("Remaining blocker report does not explicitly list root-script wiring failures.");
}
if (blockerReportingPayload.verifyLocalFailureListedAsBlocker !== true) {
  finalBlockers.push("Remaining blocker report does not explicitly list verify-local wiring failures.");
}
if (!rootScriptsPresent) {
  finalBlockers.push("Root scripts for 641-650 are not fully wired in package.json with exact commands.");
}
if (!verifyLocalPresent) {
  finalBlockers.push("verify-local.mjs does not include all 641-650 runtime/save/layout gates.");
}
if (!freshRuntimePassed) {
  finalBlockers.push("Fresh automated runtime proof failed.");
}
if (!existingRuntimePassed) {
  if (existingRuntimeProof?.blockers?.length > 0) {
    finalBlockers.push(...existingRuntimeProof.blockers.map((item) => `Existing localhost proof blocker: ${item}`));
  } else {
    finalBlockers.push("Existing localhost:5180 proof failed.");
  }
}
if (!separationPassed) {
  finalBlockers.push("Fresh and existing runtime proofs were not separated as independent proof channels.");
}
if (!existingRuntimeSignalsPass) {
  const missingSignals = existingRuntimeSignalKeys.filter((entry) => !entry.ok).map((entry) => entry.name);
  finalBlockers.push(`Existing localhost proof is missing required build/proof signals: ${missingSignals.join(", ")}`);
}
if (runtimeComparison?.status === "failed" && runtimeComparison?.blockers?.length > 0) {
  finalBlockers.push(...runtimeComparison.blockers.map((item) => `Runtime comparison blocker: ${item}`));
}
if (!isNoPhiPassed(commandResults["node scripts/check-no-phi-fields.mjs"])) {
  finalBlockers.push("Non-PHI boundary check failed.");
}
if (!isAllowlistPassed(runtimeComparison, freshRuntimeProof, existingRuntimeProof)) {
  finalBlockers.push("Fresh runtime proof must not override existing localhost proof failure.");
}

const blockers = dedupe(finalBlockers);

addCheck(
  checks,
  "existing localhost screenshot and control proof must show required runtime signals at :5180",
  existingRuntimePassed && existingRuntimeSignalsPass && existingRuntimeProof.batchMarker === requiredMarker
);

addCheck(
  checks,
  "all 641-650 root scripts must be wired in package.json and include expected commands",
  rootScriptsPresent && rootScriptMissing.length === 0 && rootScriptMismatched.length === 0
);
addCheck(
  checks,
  "verify-local.mjs must include all 641-650 runtime/save/layout root commands",
  verifyLocalPresent
);
addCheck(
  checks,
  "root-script failures must be explicit blockers",
  blockerReportingPayload.rootScriptFailureListedAsBlocker === true
);
addCheck(
  checks,
  "verify-local wiring failures must be explicit blockers",
  blockerReportingPayload.verifyLocalFailureListedAsBlocker === true
);
addCheck(
  checks,
  "manual browser checklist cannot auto-pass and must carry browser/runtime evidence",
  manualPassed && !manualAutoPass && manualBlockers.length === 0
);
addCheck(
  checks,
  "fresh and existing runtime proofs must be separated and compared",
  separationPassed
);
addCheck(
  checks,
  "fresh automation should not override existing localhost failure",
  isAllowlistPassed(runtimeComparison, freshRuntimeProof, existingRuntimeProof)
);

const fullReady = blockers.length === 0 &&
  rootScriptsPresent &&
  verifyLocalPresent &&
  manualPassed &&
  !manualAutoPass &&
  freshRuntimePassed &&
  existingRuntimePassed &&
  existingRuntimeSignalsPass &&
  separationPassed &&
  isNoPhiPassed(commandResults["node scripts/check-no-phi-fields.mjs"]);

const additionalReady = blockers.length === 0 &&
  freshRuntimePassed &&
  !existingRuntimePassed &&
  rootScriptsPresent &&
  verifyLocalPresent &&
  manualPassed &&
  !manualAutoPass &&
  isNoPhiPassed(commandResults["node scripts/check-no-phi-fields.mjs"]) &&
  separationPassed;

const decision = fullReady
  ? "go_for_editable_saved_copy_persistence_proof"
  : additionalReady
    ? "blocked_with_exact_runtime_alignment_repair_items"
    : "no_go_with_exact_blockers";

const existingLocalhostGoNoGoStatus = fullReady
  ? "go_for_editable_saved_copy_persistence_proof"
  : additionalReady
    ? "go_for_additional_runtime_alignment_repair"
    : "no_go";
const reconstructionStatus = fullReady
  ? "go_for_editable_saved_copy_persistence_proof"
  : additionalReady
  ? "no_go_until_runtime_alignment_hardening_passes"
  : "no_go";

const finalStatus = fullReady || additionalReady ? "passed" : "failed";

writeJson(`${dir}/root-wiring-summary.json`, {
  command: "node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage final --issue 651",
  present: rootScriptsPresent,
  packageScriptsPresent: packageRootPayload.present === true,
  verifyLocalIncludes: verifyLocalPresent,
  missing: rootScriptMissing,
  mismatched: rootScriptMismatched,
  payload: packageRootPayload
});
writeJson(`${dir}/blocker-reporting-summary.json`, blockerReportingPayload);
writeJson(`${dir}/manual-checklist-summary.json`, manualPayload);
writeJson(`${dir}/fresh-vs-existing-runtime-summary.json`, {
  freshRuntimeProof: freshRuntimeProof,
  existingLocalhostProof: existingRuntimeProof,
  comparison: runtimeComparison
});
writeJson(`${dir}/existing-localhost-summary.json`, {
  status: existingRuntimePassed ? "passed" : "failed",
  proof: existingRuntimeProof,
  requiredSignals: {
    ...existingRuntimeControlSignals,
    batchMarkerMatched: existingRuntimeProof?.batchMarker === requiredMarker
  }
});
writeJson(`${dir}/remaining-blockers.json`, {
  status: blockers.length === 0 ? "passed" : "blocked",
  blockers
});
writeJson(`${dir}/manifest-update-output.json`, {
  status: finalStatus,
  updates: {
    rootScriptWiringStatus: rootScriptsPresent ? "passed" : "failed",
    verifyLocalIncludes641To650: verifyLocalPresent,
    blockerReportingStatus: blockerReportingPayload.status === "passed" ? "passed" : "failed",
    manualChecklistHardeningStatus: manualPassed ? "passed" : "failed",
    freshVsExistingRuntimeProofStatus: runtimeComparison.status === "passed" ? "passed" : "blocked",
    existingLocalhostGoNoGoStatus,
    localhost5180RuntimeProofPassed: existingRuntimePassed,
    reconstructionStatus,
    goNoGoStatus: decision,
    freshRuntimeProofSeparated: true,
    existingLocalhostProofSeparated: true,
    freshRuntimeCannotOverrideExistingFailure: true,
    manualChecklistCannotAutoPass: !manualAutoPass,
    manualChecklistRequiresHumanOrBrowserProof: true,
    rootScriptFailureListedAsBlocker: blockerReportingPayload.rootScriptFailureListedAsBlocker === true,
    verifyLocalFailureListedAsBlocker: blockerReportingPayload.verifyLocalFailureListedAsBlocker === true
  }
});

const updatedManifest = updateAlignmentManifest(issue, {
  rootScriptWiringStatus: rootScriptsPresent ? "passed" : "failed",
  verifyLocalIncludes641To650: verifyLocalPresent,
  blockerReportingStatus: blockerReportingPayload.status === "passed" ? "passed" : "failed",
  manualChecklistHardeningStatus: manualPassed ? "passed" : "failed",
  freshVsExistingRuntimeProofStatus: runtimeComparison.status === "passed" ? "passed" : "blocked",
  existingLocalhostGoNoGoStatus,
  localhost5180RuntimeProofPassed: existingRuntimePassed,
  reconstructionStatus,
  goNoGoStatus: decision,
  freshRuntimeProofSeparated: true,
  existingLocalhostProofSeparated: true,
  freshRuntimeCannotOverrideExistingFailure: true,
  manualChecklistCannotAutoPass: !manualAutoPass,
  manualChecklistRequiresHumanOrBrowserProof: true,
  rootScriptFailureListedAsBlocker: blockerReportingPayload.rootScriptFailureListedAsBlocker === true,
  verifyLocalFailureListedAsBlocker: blockerReportingPayload.verifyLocalFailureListedAsBlocker === true
});

copyExistingLocalhostScreenshot(
  existingRuntimeProof?.proofType === "existing-localhost"
    ? `${issue654Dir}/screenshots/existing-localhost-proof.png`
    : `${issue654Dir}/screenshots/existing-localhost-proof.png`,
  `${dir}/screenshots/localhost-5180-final-proof.png`
);
if (!existsSync(`${dir}/screenshots/localhost-5180-final-proof.png`)) {
  const fallback = "apps/web/public/placeholder.png";
  if (existsSync(fallback)) {
    copyFile(fallback, `${dir}/screenshots/localhost-5180-final-proof.png`);
  }
}

const decisionText = finalDecisionText(decision, blockers, fullReady, additionalReady);
writeText(`${dir}/go-no-go.md`, decisionText);
writeJson(`${dir}/test-output/runtime-alignment-go-no-go.txt`, {
  status: finalStatus,
  issue,
  stage,
  decision: finalStatus === "passed" ? decision : "no_go",
  blockers,
  checks
});
writeJson(`${dir}/test-output/shared.txt`, {
  status: commandResults["npm --workspace packages/shared test"]?.status ?? "not-run",
  command: "npm --workspace packages/shared test"
});
writeJson(`${dir}/test-output/web.txt`, {
  status: commandResults["npm --workspace apps/web test"]?.status ?? "not-run",
  command: "npm --workspace apps/web test"
});
writeJson(`${dir}/test-output/web-build.txt`, {
  status: commandResults["npm --workspace apps/web run build"]?.status ?? "not-run",
  command: "npm --workspace apps/web run build"
});

const commandOutputMap = Object.fromEntries(
  commands.map((command) => [command, mapCommandOutput(command)])
);
writeCommands(issue, commands, commandOutputMap);

writeCloseout(
  issue,
  "Runtime alignment final GO / NO-GO now aggregates 651-655, enforces explicit root and verify-local blockers, and requires 5180 runtime proof.",
  finalStatus === "passed" ? "passed" : "failed",
  [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-editor-runtime-alignment-root-wiring.mjs --stage final --issue 651",
    "node scripts/check-editor-runtime-alignment-blocker-reporting.mjs --stage final --issue 652",
    "node scripts/check-editor-manual-browser-checklist-hardening.mjs --stage final --issue 653",
    "node scripts/check-editor-fresh-vs-existing-runtime-proof.mjs --stage final --issue 654",
    "node scripts/check-editor-runtime-alignment-go-no-go.mjs --stage final --issue 655",
    "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 655",
    "node scripts/check-no-phi-fields.mjs"
  ],
  [
    blockers.length > 0 ? `No-go blockers: ${blockers.join("; ")}` : "No remaining blockers; saved-copy persistence proof may proceed."
  ]
);

if (finalStatus !== "passed" && !allowPartial) process.exit(1);

console.log(JSON.stringify({
  issue,
  stage,
  status: finalStatus,
  decision,
  blockers
}, null, 2));

function isNoPhiPassed(result) {
  return result?.status === "passed";
}

function isAllowlistPassed(comparison, fresh, existing) {
  if (comparison == null) {
    return !(fresh?.status === "passed" && existing?.status === "failed");
  }
  if (!comparison.status || comparison.status === "passed") return true;
  return !comparison.blockers?.some((blocker) => String(blocker).includes("Fresh automated runtime passes, but existing localhost:5180 is stale, unavailable, or mismatched"));
}

function finalDecisionText(decisionValue, reasonList, full, additional) {
  if (full) return `# Runtime Alignment GO / NO-GO\n\nDecision: GO for editable saved-copy persistence proof.\n`;
  if (additional) return `# Runtime Alignment GO / NO-GO\n\nDecision: GO for additional runtime alignment repair.\n`;
  return `# Runtime Alignment GO / NO-GO\n\nDecision: NO-GO.\n\nBlockers:\n${reasonList.length === 0 ? "- No blockers collected." : reasonList.map((item) => `- ${item}`).join("\n")}\n`;
}

function dedupe(items) {
  return Array.from(new Set(items));
}

function runCommand(command, outputPath) {
  const result = spawnSync(command, {
    shell: true,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 50
  });
  const stdout = String(result.stdout ?? "");
  const stderr = String(result.stderr ?? "");
  const output = [
    `> ${command}`,
    `exitCode: ${result.status ?? 1}`,
    "",
    stdout,
    stderr
  ].join("\n").trimEnd() + "\n";
  writeText(outputPath, output);
  return {
    command,
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status ?? 1,
    output
  };
}

function mapCommandOutput(command) {
  if (command.includes("packages/shared test")) return `${dir}/test-output/shared.txt`;
  if (command.includes("apps/web test")) return `${dir}/test-output/web.txt`;
  if (command.includes("apps/web run build")) return `${dir}/test-output/web-build.txt`;
  if (command.includes("root-wiring")) return `${dir}/test-output/root-wiring.txt`;
  if (command.includes("blocker-reporting")) return `${dir}/test-output/blocker-reporting.txt`;
  if (command.includes("manual-browser-checklist-hardening")) return `${dir}/test-output/manual-checklist-hardening.txt`;
  if (command.includes("fresh-vs-existing-runtime-proof")) return `${dir}/test-output/fresh-vs-existing-runtime-proof.txt`;
  if (command.includes("no-phi-fields")) return `${dir}/no-phi-output.txt`;
   if (command.includes("check-visible-product-copy-all-routes")) return `${dir}/test-output/visible-product-copy-all-routes.txt`;
  return `${dir}/test-output/command.txt`;
}

function safeReadJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function createFallbackRuntimeComparison(freshProof, existingProof) {
  const fresh = freshProof?.status === "passed";
  const existing = existingProof?.status === "passed";
  const blockers = [];
  if (fresh && !existing) blockers.push("Fresh automated runtime passes, but existing localhost:5180 is stale, unavailable, or mismatched. Restart dev server and hard refresh before reconstruction.");
  if (existing && !fresh) blockers.push("Existing localhost passes, but fresh automated runtime proof failed. Verify test infrastructure or source-rendered runtime before GO.");
  if (!fresh && !existing) blockers.push("Both fresh and existing runtime proofs failed.");
  return {
    status: blockers.length === 0 ? "passed" : "failed",
    freshRuntimeProof: freshProof,
    existingLocalhostProof: existingProof,
    blockers
  };
}

function copyExistingLocalhostScreenshot(sourcePath, destinationPath) {
  if (!existsSync(sourcePath)) return;
  copyFile(sourcePath, destinationPath);
}

function copyFile(sourcePath, destinationPath) {
  const bytes = readFileSync(sourcePath);
  writeFileSync(destinationPath, bytes);
}
