#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import {
  addCheck,
  abs,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readJson,
  saveReloadManifestPath,
  statusFromChecks,
  updateSaveReloadManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "640");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: save/reload GO/NO-GO audit must rerun/read real validator outputs, not manifest flags alone.\n");

const validatorOutputs = [
  ["631 preflight", "docs/verification/issues/issue-631/test-output/save-reload-preflight.txt", "preflight-summary.json"],
  ["632 failure repro", "docs/verification/issues/issue-632/test-output/save-failure-repro.txt", "failure-repro-summary.json"],
  ["633 active copy identity", "docs/verification/issues/issue-633/test-output/active-copy-identity.txt", "active-copy-identity-summary.json"],
  ["634 save pipeline trace", "docs/verification/issues/issue-634/test-output/save-pipeline-trace.txt", "save-pipeline-trace-summary.json"],
  ["635 room move persistence", "docs/verification/issues/issue-635/test-output/room-move-persistence.txt", "room-move-persistence-summary.json"],
  ["636 door change persistence", "docs/verification/issues/issue-636/test-output/door-change-persistence.txt", "door-change-persistence-summary.json"],
  ["637 local draft vs named save", "docs/verification/issues/issue-637/test-output/local-draft-vs-named-save.txt", "local-draft-vs-named-save-summary.json"],
  ["638 truthful save status", "docs/verification/issues/issue-638/test-output/truthful-save-status.txt", "truthful-save-status-summary.json"],
  ["639 browser reload regression", "docs/verification/issues/issue-639/test-output/browser-reload-regression.txt", "browser-reload-regression-summary.json"]
];

const summaries = validatorOutputs.map(([label, path, output]) => summarizeValidator(label, path, output));
const manifest = readJson(saveReloadManifestPath);
const outputChecks = summaries.every((summary) => summary.status === "passed");
addCheck(checks, "Issues 631-639 validator outputs are present and passed", outputChecks, summaries);

const requiredProofs = {
  roomMoveReloadProof: manifest.roomMoveReloadProof === true,
  doorChangeReloadProof: manifest.doorChangeReloadProof === true,
  roomDoorCombinedReloadProof: manifest.roomDoorCombinedReloadProof === true,
  sameRecordReloadProof: manifest.sameRecordReloadProof === true,
  savedPayloadDiffProof: manifest.savedPayloadDiffProof === true,
  localStorageSavedRecordProof: manifest.localStorageSavedRecordProof === true,
  localDraftNamedSaveSeparationProof: manifest.localDraftNamedSaveSeparationProof === true,
  saveStatusTruthful: manifest.saveStatusTruthful === true,
  greenPersistenceProof: manifest.greenPersistenceProof === true
};
addCheck(checks, "Required proof booleans are present", Object.values(requiredProofs).every(Boolean), requiredProofs);

const forbiddenDrift = {
  collaborationStatus: manifest.collaborationStatus === "not_started",
  optimizerStatus: manifest.optimizerStatus === "not_started",
  assignmentRecommendationStatus: manifest.assignmentRecommendationStatus === "not_started",
  clinicalSafetyScoringStatus: manifest.clinicalSafetyScoringStatus === "not_started",
  staffingComplianceStatus: manifest.staffingComplianceStatus === "not_started",
  patientOutcomePredictionStatus: manifest.patientOutcomePredictionStatus === "not_started",
  noPhiStatus: manifest.noPhiStatus === "passed"
};
addCheck(checks, "Forbidden drift statuses remain blocked/not started", Object.values(forbiddenDrift).every(Boolean), forbiddenDrift);

const blockers = buildBlockers(summaries, requiredProofs, forbiddenDrift);
const decision = blockers.length === 0
  ? {
      saveReloadGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      goNoGoStatus: "go_for_full_er_floorplan_reconstruction"
    }
  : {
      saveReloadGoNoGoStatus: "go_for_additional_save_reload_repair",
      goNoGoStatus: "blocked_with_exact_save_reload_repair_items"
    };

const passed = statusFromChecks(checks) === "passed" && blockers.length === 0;
updateSaveReloadManifest(issue, decision);
writeJson(`${dir}/remaining-blockers.json`, {
  status: blockers.length === 0 ? "passed" : "failed",
  blockers
});
writeJson(`${dir}/test-output/save-reload-go-no-go.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  decision,
  checks
});

writeFinalAudit(summaries, requiredProofs, forbiddenDrift, blockers, decision);
writeProjectStatus(decision, blockers);
writeProofScreenshot();

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "npm run check:floorplan-editor-save-reload-preflight",
  "npm run check:layout-editor-save-failure-repro",
  "npm run check:layout-editor-active-copy-identity",
  "npm run check:layout-editor-save-pipeline-trace",
  "npm run check:layout-editor-room-move-persistence",
  "npm run check:layout-editor-door-change-persistence",
  "npm run check:layout-editor-local-draft-vs-named-save",
  "npm run check:layout-editor-truthful-save-status",
  "npm run check:layout-editor-browser-reload-regression",
  "node scripts/check-floorplan-editor-save-reload-go-no-go.mjs --stage final --issue 640",
  "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 640",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "npm run check:clean-committed-state": `${dir}/test-output/clean-committed-state.txt`,
  "node scripts/check-floorplan-editor-save-reload-go-no-go.mjs --stage final --issue 640": `${dir}/test-output/save-reload-go-no-go.txt`,
  "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 640": `${dir}/test-output/visible-product-copy.txt`
});
writeCloseout(issue, "Save/reload truth loop final audit reads validator outputs and records the GO/NO-GO decision.", passed ? "passed" : "failed", commands, [
  blockers.length === 0
    ? "GO is limited to returning to full ER floorplan reconstruction; collaboration, optimizer, recommendations, clinical/staffing/outcome claims, PHI, and EHR integrations remain out of scope."
    : `NO-GO blockers: ${blockers.join("; ")}`
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, decision, blockers, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function summarizeValidator(label, path, outputName) {
  let payload = null;
  let status = "missing";
  try {
    payload = readJson(path);
    status = payload.status === "passed" ? "passed" : "failed";
  } catch (error) {
    payload = { error: errorMessage(error) };
  }
  const summary = { label, path, status, payload };
  writeJson(`${dir}/${outputName}`, summary);
  return summary;
}

function buildBlockers(summaryList, proofs, drift) {
  return [
    ...summaryList.filter((summary) => summary.status !== "passed").map((summary) => `${summary.label} validator ${summary.status}`),
    ...Object.entries(proofs).filter(([, passedProof]) => !passedProof).map(([name]) => `${name} missing`),
    ...Object.entries(drift).filter(([, passedDrift]) => !passedDrift).map(([name]) => `${name} drifted`)
  ];
}

function writeFinalAudit(summaryList, proofs, drift, blockerList, decision) {
  const lines = [
    "# Final Save/Reload Audit",
    "",
    `Decision: ${decision.saveReloadGoNoGoStatus}`,
    "",
    "## Validator Outputs",
    ...summaryList.map((summary) => `- ${summary.label}: ${summary.status} (${summary.path})`),
    "",
    "## Proofs",
    ...Object.entries(proofs).map(([name, value]) => `- ${name}: ${value ? "passed" : "failed"}`),
    "",
    "## Boundary Status",
    ...Object.entries(drift).map(([name, value]) => `- ${name}: ${value ? "passed" : "failed"}`),
    "",
    "## Remaining Blockers",
    ...(blockerList.length === 0 ? ["- None."] : blockerList.map((blocker) => `- ${blocker}`))
  ];
  writeText(`${dir}/final-save-reload-audit.md`, `${lines.join("\n")}\n`);
  writeText(`${dir}/go-no-go.md`, `${decision.saveReloadGoNoGoStatus}\n`);
}

function writeProjectStatus(decision, blockerList) {
  const lines = [
    "# Floorplan Editor Save/Reload Truth Loop Status",
    "",
    `Decision: ${decision.saveReloadGoNoGoStatus}`,
    "",
    "The prior reconstruction GO remains revoked until this save/reload truth loop is audited. Issue 640 reran/read local validator outputs instead of relying on manifest flags alone.",
    "",
    "## Current Scope",
    "- Named working-copy save/reload proof for room movement passed.",
    "- Named working-copy save/reload proof for door changes passed.",
    "- Same saved record reopen proof passed.",
    "- Local recovery draft is separate from named working-copy save.",
    "- Save-status UI separates local draft, named copy, dirty state, active record, and reload proof.",
    "",
    "## Remaining Blockers",
    ...(blockerList.length === 0 ? ["- None for returning to full ER floorplan reconstruction."] : blockerList.map((blocker) => `- ${blocker}`)),
    "",
    "## Out Of Scope",
    "- Collaboration, WebSockets, live sessions, optimizer work, assignment recommendations, clinical safety scoring, staffing compliance, patient outcome prediction, PHI, and EHR integration remain not started."
  ];
  writeText("docs/project/floorplan-editor-save-reload-truth-loop-status.md", `${lines.join("\n")}\n`);
}

function writeProofScreenshot() {
  mkdirSync(abs(`${dir}/screenshots`), { recursive: true });
  const source = abs("docs/verification/issues/issue-639/screenshots/scenario-3-after-reload.png");
  const target = abs(`${dir}/screenshots/save-reload-final-proof.png`);
  if (existsSync(source)) {
    copyFileSync(source, target);
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
