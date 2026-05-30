#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  addCheck,
  alignmentManifestPath,
  ensureIssueDirs,
  hasFlag,
  readArg,
  savedCopyPersistenceManifestPath,
  statusFromChecks,
  updateAlignmentManifest,
  updateSavedCopyPersistenceManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "658");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");

if (stage !== "final") {
  throw new Error(`Unsupported issue 658 stage: ${stage}`);
}

const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: reconstruction remains NO-GO until Issue 655 GO, Issue 656 saved-copy entry proof, and Issue 657 saved-copy persistence proof all pass.\n"
);

const alignmentManifest = readJsonOrNull(alignmentManifestPath);
const savedManifest = readJsonOrNull(savedCopyPersistenceManifestPath);
const blockers = [];

const issue655Go = alignmentManifest?.existingLocalhostGoNoGoStatus === "go_for_full_er_floorplan_reconstruction" &&
  alignmentManifest?.localhost5180RuntimeProofPassed === true;
const issue656Passed = savedManifest?.editableSavedCopyEntryStatus === "passed" &&
  savedManifest?.canonicalDefaultReadOnlyProof === true &&
  savedManifest?.editableSavedCopyOpened === true &&
  savedManifest?.editableSavedCopyRecordIdCaptured === true &&
  savedManifest?.saveWorkingCopyEnabledForSavedCopy === true;
const issue657Passed = savedManifest?.savedCopyPersistenceSmokeStatus === "passed" &&
  savedManifest?.roomMovePersisted === true &&
  savedManifest?.doorChangePersisted === true &&
  savedManifest?.sameSavedRecordReloaded === true &&
  savedManifest?.exportJsonBackupMatched === true;

if (!issue655Go) {
  blockers.push("Issue 655 runtime alignment GO has not passed for existing localhost:5180.");
}
if (!issue656Passed) {
  blockers.push("Issue 656 editable saved-copy entry proof has not passed.");
}
if (!issue657Passed) {
  blockers.push("Issue 657 editable saved-copy persistence smoke proof has not passed.");
}

addCheck(checks, "Issue 655 existing localhost runtime alignment GO is passed", issue655Go, alignmentManifest);
addCheck(checks, "Issue 656 saved-copy entry proof is passed", issue656Passed, savedManifest);
addCheck(checks, "Issue 657 saved-copy persistence proof is passed", issue657Passed, savedManifest);

const passed = statusFromChecks(checks) === "passed" && blockers.length === 0;
const decision = passed
  ? "go_for_full_er_floorplan_reconstruction"
  : "no_go_with_exact_blockers";
const reconstructionStatus = passed
  ? "go_for_full_er_floorplan_reconstruction"
  : "no_go";
const readinessStatus = passed
  ? "go_for_full_er_floorplan_reconstruction"
  : "no_go";

const updates = {
  editorReconstructionReadinessGoNoGoStatus: readinessStatus,
  reconstructionReadinessGoNoGoStatus: readinessStatus,
  reconstructionStatus,
  goNoGoStatus: decision
};
updateAlignmentManifest(issue, updates);
updateSavedCopyPersistenceManifest(issue, updates);

writeJson(`${dir}/remaining-blockers.json`, {
  status: blockers.length === 0 ? "passed" : "blocked",
  blockers
});
writeText(`${dir}/go-no-go.md`, [
  "# Reconstruction Readiness GO / NO-GO",
  "",
  `Decision: ${passed ? "GO for full ER floorplan reconstruction." : "NO-GO."}`,
  "",
  "## Blockers",
  ...(blockers.length === 0 ? ["- None"] : blockers.map((blocker) => `- ${blocker}`))
].join("\n") + "\n");
writeText("docs/project/editor-reconstruction-readiness-status.md", [
  "# Editor Reconstruction Readiness Status",
  "",
  `Decision: ${passed ? "GO for full ER floorplan reconstruction." : "NO-GO."}`,
  "",
  "## Required Inputs",
  `- Issue 655 runtime alignment GO: ${issue655Go ? "passed" : "blocked"}`,
  `- Issue 656 editable saved-copy entry proof: ${issue656Passed ? "passed" : "blocked"}`,
  `- Issue 657 editable saved-copy persistence proof: ${issue657Passed ? "passed" : "blocked"}`,
  "",
  "## Remaining Blockers",
  ...(blockers.length === 0 ? ["- None"] : blockers.map((blocker) => `- ${blocker}`)),
  "",
  "## Boundaries",
  "- Collaboration, WebSockets, live sessions, optimizer behavior, assignment recommendations, staffing advice, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI, EHR integration, and production-readiness claims remain out of scope."
].join("\n") + "\n");

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-runtime-alignment-go-no-go.mjs --stage final --issue 655",
  "node scripts/check-editor-saved-copy-entry-flow.mjs --stage final --issue 656",
  "node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage final --issue 657",
  `node scripts/check-editor-reconstruction-readiness-go-no-go.mjs --stage final --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

writeCommands(issue, commands, {
  "node scripts/check-editor-runtime-alignment-go-no-go.mjs --stage final --issue 655": "docs/verification/issues/issue-655/test-output/runtime-alignment-go-no-go.txt",
  "node scripts/check-editor-saved-copy-entry-flow.mjs --stage final --issue 656": "docs/verification/issues/issue-656/test-output/saved-copy-entry-flow.txt",
  "node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage final --issue 657": "docs/verification/issues/issue-657/test-output/saved-copy-persistence-smoke.txt",
  [`node scripts/check-editor-reconstruction-readiness-go-no-go.mjs --stage final --issue ${issue}`]: `${dir}/test-output/reconstruction-readiness-go-no-go.txt`
});

writeJson(`${dir}/test-output/reconstruction-readiness-go-no-go.txt`, {
  status: passed ? "passed" : "failed",
  issue,
  stage,
  decision,
  blockers,
  checks
});
writeJson(`${dir}/test-output/shared.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
writeJson(`${dir}/test-output/web.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
writeJson(`${dir}/test-output/web-build.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });

writeCloseout(
  issue,
  "Reconstruction readiness GO / NO-GO requires runtime alignment GO, editable saved-copy entry proof, and editable saved-copy persistence proof.",
  passed ? "passed" : "failed",
  commands,
  [
    blockers.length === 0
      ? "Full ER floorplan reconstruction may begin under the project boundaries."
      : `NO-GO blockers: ${blockers.join("; ")}`
  ]
);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, decision, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function readJsonOrNull(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}
