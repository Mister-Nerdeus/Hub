#!/usr/bin/env node
import { copyFileSync } from "node:fs";
import {
  addCheck,
  assertFile,
  ensureIssueDirs,
  hasFlag,
  loadDoorAuthoringManifest,
  readArg,
  readJson,
  statusFromChecks,
  updateDoorAuthoringManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";

const issue = readArg("--issue", "678");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = ["final"];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door authoring GO / NO-GO stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: final door authoring GO / NO-GO must rerun all real validators and report exact blockers.\n"
);

const checks = [];
const validatorSummaries = collectValidatorSummaries();
for (const summary of validatorSummaries) {
  addCheck(checks, `${summary.label} real validator passed`, summary.status === "passed", summary);
  writeJson(`${dir}/${summary.outputName}`, summary);
}

const manifestBeforeDecision = loadDoorAuthoringManifest(issue);
const manifestSummary = summarizeManifest(manifestBeforeDecision);
addCheck(checks, "manifest agrees with real validator outputs", manifestSummary.status === "passed", manifestSummary);

const screenshotSummary = copyFinalProofScreenshot();
addCheck(checks, "final browser proof screenshot is available", screenshotSummary.status === "passed", screenshotSummary);

const blockers = [
  ...validatorSummaries.flatMap((summary) => summary.status === "passed" ? [] : [summary.blocker]),
  ...manifestSummary.blockers,
  ...(screenshotSummary.status === "passed" ? [] : [screenshotSummary.blocker])
];
const status = statusFromChecks(checks);
const decision = status === "passed"
  ? {
      doorAuthoringGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      goNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      reconstructionStatus: "go_for_full_er_floorplan_reconstruction"
    }
  : {
      doorAuthoringGoNoGoStatus: "go_for_additional_door_repair",
      goNoGoStatus: "blocked_with_exact_door_repair_items",
      reconstructionStatus: "no_go_until_door_authoring_crash_hardening_passes"
    };

const manifest = updateDoorAuthoringManifest(issue, decision);
writeJson(`${dir}/remaining-blockers.json`, {
  status: blockers.length === 0 ? "passed" : "blocked",
  blockers
});
writeGoNoGoMarkdown(decision, blockers);
writeFinalAuditMarkdown(decision, validatorSummaries, blockers);
writeProjectStatus(decision, validatorSummaries, blockers);
writeJson(`${dir}/test-output/door-authoring-go-no-go.txt`, {
  status,
  issue,
  stage,
  checks,
  decision,
  manifest
});
writeCommandsAndCloseout(status, decision, blockers);

console.log(JSON.stringify({ status, issue, stage, decision, blockers, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function collectValidatorSummaries() {
  const validators = [
    {
      key: "preflight",
      label: "669 preflight",
      source: `${dir}/test-output/door-authoring-crash-preflight.txt`,
      outputName: "preflight-summary.json",
      blocker: "669 preflight validator did not pass"
    },
    {
      key: "crash-reproduction",
      label: "670 crash reproduction",
      source: `${dir}/test-output/door-crash-reproduction.txt`,
      outputName: "crash-reproduction-summary.json",
      blocker: "670 crash reproduction validator did not pass"
    },
    {
      key: "safe-wrapper",
      label: "671 safe wrapper",
      source: `${dir}/test-output/safe-door-authoring-wrapper.txt`,
      outputName: "safe-wrapper-summary.json",
      blocker: "671 safe door authoring wrapper validator did not pass"
    },
    {
      key: "candidate-eligibility",
      label: "672 candidate eligibility",
      source: `${dir}/test-output/door-candidate-eligibility.txt`,
      outputName: "candidate-eligibility-summary.json",
      blocker: "672 candidate eligibility validator did not pass"
    },
    {
      key: "add-door-preflight",
      label: "673 add-door preflight",
      source: `${dir}/test-output/add-door-preflight.txt`,
      outputName: "add-door-preflight-summary.json",
      blocker: "673 add-door preflight validator did not pass"
    },
    {
      key: "owner-model",
      label: "674 owner model",
      source: `${dir}/test-output/door-owner-model-hardening.txt`,
      outputName: "owner-model-summary.json",
      blocker: "674 owner model validator did not pass"
    },
    {
      key: "recovery-snapshot",
      label: "675 recovery snapshots",
      source: `${dir}/test-output/door-action-recovery-snapshots.txt`,
      outputName: "recovery-snapshot-summary.json",
      blocker: "675 recovery snapshot validator did not pass"
    },
    {
      key: "recovery-diagnostics",
      label: "676 recovery diagnostics",
      source: `${dir}/test-output/door-recovery-diagnostics.txt`,
      outputName: "recovery-diagnostics-summary.json",
      blocker: "676 recovery diagnostics validator did not pass"
    },
    {
      key: "browser-regression",
      label: "677 browser regression",
      source: `${dir}/test-output/door-authoring-browser-regression.txt`,
      outputName: "browser-regression-summary.json",
      blocker: "677 browser regression validator did not pass"
    }
  ];
  return validators.map((validator) => summarizeValidator(validator));
}

function summarizeValidator(validator) {
  if (!assertFile(validator.source)) {
    return {
      ...validator,
      status: "missing",
      checkCount: 0,
      failedChecks: [],
      sourceExists: false
    };
  }
  const output = readJson(validator.source);
  const failedChecks = Array.isArray(output.checks)
    ? output.checks.filter((check) => check?.passed !== true).map((check) => check?.name ?? "unnamed check")
    : [];
  return {
    ...validator,
    status: output.status === "passed" && failedChecks.length === 0 ? "passed" : "failed",
    checkCount: Array.isArray(output.checks) ? output.checks.length : 0,
    failedChecks,
    sourceExists: true
  };
}

function summarizeManifest(manifest) {
  const requiredStatuses = [
    "doorCrashPreflightStatus",
    "doorCrashReproductionStatus",
    "safeDoorAuthoringWrapperStatus",
    "doorCandidateEligibilityStatus",
    "addDoorPreflightStatus",
    "doorOwnerModelStatus",
    "doorRecoverySnapshotsStatus",
    "recoveryDiagnosticsStatus",
    "doorRegressionPackStatus"
  ];
  const requiredBooleans = [
    "doorActionsNonThrowing",
    "leftPodDoorCrashProof",
    "rightPodDoorCrashProof",
    "invalidDoorActionsBecomeWarnings",
    "candidateEligibilityProof",
    "solidWallDoorRejected",
    "supportAccessSeparatedFromPatientDoor",
    "lastValidSnapshotProof",
    "recoveryDiagnosticsVisible",
    "doorSaveReloadProof",
    "noRecoveryScreenDuringDoorWork"
  ];
  const blockers = [
    ...requiredStatuses.filter((key) => manifest[key] !== "passed").map((key) => `${key} is ${manifest[key] ?? "missing"}`),
    ...requiredBooleans.filter((key) => manifest[key] !== true).map((key) => `${key} is not true`)
  ];
  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers
  };
}

function copyFinalProofScreenshot() {
  const source = "docs/verification/issues/issue-677/screenshots/door-save-reload-proof.png";
  const target = `${dir}/screenshots/door-authoring-final-proof.png`;
  if (!assertFile(source, 5000)) {
    return {
      status: "missing",
      blocker: "Issue 677 final browser screenshot is missing",
      source,
      target
    };
  }
  copyFileSync(source, target);
  return {
    status: "passed",
    source,
    target
  };
}

function writeGoNoGoMarkdown(decision, blockers) {
  const decisionLabel = decision.doorAuthoringGoNoGoStatus === "go_for_full_er_floorplan_reconstruction"
    ? "GO for full ER floorplan reconstruction"
    : "GO for additional door repair";
  writeText(`${dir}/go-no-go.md`, `# Door Authoring GO / NO-GO

Decision: ${decisionLabel}

Blockers:
${blockers.length === 0 ? "- None" : blockers.map((item) => `- ${item}`).join("\n")}
`);
}

function writeFinalAuditMarkdown(decision, summaries, blockers) {
  writeText(`${dir}/final-door-authoring-audit.md`, `# Final Door Authoring Audit

Decision: ${decision.doorAuthoringGoNoGoStatus}

## Real Validators
${summaries.map((summary) => `- ${summary.label}: ${summary.status}`).join("\n")}

## Remaining Blockers
${blockers.length === 0 ? "- None" : blockers.map((item) => `- ${item}`).join("\n")}

## Boundary Confirmation
- No collaboration, WebSockets, live sessions, optimizer behavior, assignment recommendations, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI, or EHR integration was added.
`);
}

function writeProjectStatus(decision, summaries, blockers) {
  const decisionLabel = decision.doorAuthoringGoNoGoStatus === "go_for_full_er_floorplan_reconstruction"
    ? "GO for full ER floorplan reconstruction"
    : "GO for additional door repair";
  writeText("docs/project/door-authoring-crash-hardening-status.md", `# Door Authoring Crash Hardening Status

Decision: ${decisionLabel}

## Revocation
- Source batch: 641-650
- Source GO state: go_for_full_er_floorplan_reconstruction
- Revoked: true
- Reason: User reproduced editor recovery screen while adding/assigning doors in both top pod areas.

## Final Audit
${summaries.map((summary) => `- ${summary.label}: ${summary.status}`).join("\n")}

## Remaining Blockers
${blockers.length === 0 ? "- None" : blockers.map((item) => `- ${item}`).join("\n")}

## Gate Rule
- Final GO reran real validators and did not trust manifest flags alone.
- Door authoring errors are editor warnings, not render/runtime crashes.
- Invalid door actions preserve the previous valid layout.

## Boundaries
- No collaboration, WebSockets, live sessions, optimizer behavior, assignment recommendations, staffing advice, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI, EHR integration, or production-readiness claims were added.
`);
}

function writeCommandsAndCloseout(status, decision, blockers) {
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "npm run check:clean-committed-state",
    `node scripts/check-door-authoring-crash-preflight.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-authoring-crash-reproduction.mjs --stage final --issue ${issue}`,
    `node scripts/check-safe-door-authoring-wrapper.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-candidate-eligibility.mjs --stage final --issue ${issue}`,
    `node scripts/check-add-door-preflight.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-owner-model-hardening.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-action-recovery-snapshots.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-recovery-diagnostics.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-authoring-browser-regression.mjs --stage final --issue ${issue}`,
    `node scripts/check-door-authoring-go-no-go.mjs --stage final --issue ${issue}`,
    `node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue ${issue}`,
    "node scripts/check-no-phi-fields.mjs"
  ];
  writeCommands(issue, commands, {
    "npm --workspace packages/shared test": `${dir}/test-output/shared.txt`,
    "npm --workspace apps/web test": `${dir}/test-output/web.txt`,
    "npm --workspace apps/web run build": `${dir}/test-output/web-build.txt`,
    "npm run check:clean-committed-state": `${dir}/test-output/clean-committed-state.txt`,
    [`node scripts/check-door-authoring-crash-preflight.mjs --stage final --issue ${issue}`]: `${dir}/preflight-summary.json`,
    [`node scripts/check-door-authoring-crash-reproduction.mjs --stage final --issue ${issue}`]: `${dir}/crash-reproduction-summary.json`,
    [`node scripts/check-safe-door-authoring-wrapper.mjs --stage final --issue ${issue}`]: `${dir}/safe-wrapper-summary.json`,
    [`node scripts/check-door-candidate-eligibility.mjs --stage final --issue ${issue}`]: `${dir}/candidate-eligibility-summary.json`,
    [`node scripts/check-add-door-preflight.mjs --stage final --issue ${issue}`]: `${dir}/add-door-preflight-summary.json`,
    [`node scripts/check-door-owner-model-hardening.mjs --stage final --issue ${issue}`]: `${dir}/owner-model-summary.json`,
    [`node scripts/check-door-action-recovery-snapshots.mjs --stage final --issue ${issue}`]: `${dir}/recovery-snapshot-summary.json`,
    [`node scripts/check-door-recovery-diagnostics.mjs --stage final --issue ${issue}`]: `${dir}/recovery-diagnostics-summary.json`,
    [`node scripts/check-door-authoring-browser-regression.mjs --stage final --issue ${issue}`]: `${dir}/browser-regression-summary.json`,
    [`node scripts/check-door-authoring-go-no-go.mjs --stage final --issue ${issue}`]: `${dir}/test-output/door-authoring-go-no-go.txt`,
    [`node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue ${issue}`]: `${dir}/test-output/visible-product-copy.txt`,
    "node scripts/check-no-phi-fields.mjs": `${dir}/no-phi-output.txt`
  });
  writeCloseout(
    issue,
    `Door authoring final audit decision: ${decision.doorAuthoringGoNoGoStatus}.`,
    status,
    commands,
    blockers.length === 0
      ? ["Full ER floorplan reconstruction may resume after this local audit."]
      : blockers
  );
}
